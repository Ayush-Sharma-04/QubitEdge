"""
Sandboxed execution of user-submitted Python code via subprocess.
The code must print a JSON object to stdout with 'counts' and 'probabilities'.
"""
from __future__ import annotations

import json
import logging
import subprocess
import sys
import textwrap
import tempfile
import os
from typing import Optional

from models import SimulationResult

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 5
MAX_OUTPUT_BYTES = 64 * 1024  # 64 KB

import ast
import concurrent.futures
import contextlib
import io
import threading

# Prohibited top-level modules in user code
FORBIDDEN_MODULES = {
    "os", "subprocess", "socket", "shutil", "pathlib",
    "ctypes", "multiprocessing", "threading", "signal",
    "pty", "tty", "fcntl", "resource", "mmap", "pickle", "shelve", "dbm",
    "requests", "urllib", "http"
}

FORBIDDEN_CALLS = {"eval", "exec", "breakpoint", "compile", "open"}

_FAST_RUNNER_LOCK = threading.Lock()
_THREAD_POOL = concurrent.futures.ThreadPoolExecutor(max_workers=4)


def _validate_code_ast(code: str) -> None:
    """Statically validate that the user code does not import or call dangerous modules/functions."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise CodeRunnerError(f"Syntax error in code: {e}")

    for node in ast.walk(tree):
        # Check imports: import os, import subprocess, etc.
        if isinstance(node, ast.Import):
            for alias in node.names:
                top = alias.name.split(".")[0]
                if top in FORBIDDEN_MODULES:
                    raise CodeRunnerError(f"Importing module '{alias.name}' is not permitted.")

        # Check from ... import ...
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                top = node.module.split(".")[0]
                if top in FORBIDDEN_MODULES:
                    raise CodeRunnerError(f"Importing from '{node.module}' is not permitted.")

        # Check dangerous builtins: open(), eval(), exec()
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_CALLS:
                raise CodeRunnerError(f"Calling function '{node.func.id}()' is not permitted.")


# Wrapper that captures user code output cleanly (subprocess fallback)
_WRAPPER_TEMPLATE = textwrap.dedent("""
import sys, json, io

_output_buffer = io.StringIO()
_orig_stdout = sys.stdout
sys.stdout = _output_buffer

try:
{user_code}
except Exception as _e:
    sys.stdout = _orig_stdout
    print(json.dumps({{"__error__": str(_e)}}))
    sys.exit(0)

sys.stdout = _orig_stdout
_raw = _output_buffer.getvalue().strip()
print(_raw if _raw else json.dumps({{"__error__": "No output produced. Make sure your code prints a JSON result."}}))
""")


class CodeRunnerError(Exception):
    """Raised when sandboxed code execution fails."""


def _execute_in_process(code: str, timeout: float = 5.0) -> str:
    """
    Executes AST-validated user code in-process using pre-warmed modules.
    This eliminates the 4-6 second Windows Python cold-start penalty,
    running quantum scripts in ~10-30ms!
    """
    compiled = compile(code, "<user_code>", "exec")
    output_buffer = io.StringIO()
    user_globals = {
        "__name__": "__main__",
        "__doc__": None,
    }

    def _target():
        with _FAST_RUNNER_LOCK:
            with contextlib.redirect_stdout(output_buffer):
                exec(compiled, user_globals)

    future = _THREAD_POOL.submit(_target)
    try:
        future.result(timeout=timeout)
    except concurrent.futures.TimeoutError:
        raise CodeRunnerError(
            f"Execution timed out after {timeout} seconds. Check for infinite loops."
        )
    except CodeRunnerError:
        raise
    except Exception as exc:
        raise CodeRunnerError(f"Runtime error in user code: {exc}")

    raw = output_buffer.getvalue().strip()
    if not raw:
        raise CodeRunnerError(
            "No output produced. Make sure your script prints a JSON object with 'counts' and 'probabilities'."
        )
    return raw


def _execute_via_subprocess(code: str, timeout: float = 10.0) -> str:
    """Fallback subprocess execution when in-process cannot be used."""
    indented = textwrap.indent(code.rstrip(), "    ")
    wrapped = _WRAPPER_TEMPLATE.format(user_code=indented)

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as tf:
        tf.write(wrapped)
        tf.flush()
        tmp_path = tf.name

    try:
        proc = subprocess.run(
            [sys.executable, "-B", "-E", tmp_path],
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        )
    except subprocess.TimeoutExpired:
        raise CodeRunnerError(
            f"Execution timed out after {timeout} seconds. "
            "Check for infinite loops or overly large circuits."
        )
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    stderr = proc.stderr.strip()
    stdout = proc.stdout.strip()[:MAX_OUTPUT_BYTES]

    if not stdout:
        detail = f" stderr: {stderr[:500]}" if stderr else ""
        raise CodeRunnerError(f"No output from code execution.{detail}")
    return stdout


def run_user_code(code: str, shots: int = 1024) -> SimulationResult:
    """
    Execute user-submitted Python code.
    Tries ultra-fast in-process execution with AST validation first (~10-30ms),
    falling back to isolated subprocess if needed.
    """
    # 1. Statically validate code AST
    _validate_code_ast(code)

    # 2. Try fast in-process execution
    stdout: str
    try:
        stdout = _execute_in_process(code, timeout=TIMEOUT_SECONDS)
    except CodeRunnerError:
        raise
    except Exception as exc:
        logger.warning("In-process execution failed: %s, trying subprocess fallback", exc)
        stdout = _execute_via_subprocess(code, timeout=TIMEOUT_SECONDS * 2)

    # 3. Parse JSON from stdout
    try:
        lines = stdout.splitlines()
        json_line = next((l for l in reversed(lines) if l.strip().startswith("{")), None)
        if json_line is None:
            raise ValueError("No JSON object found in output")
        data = json.loads(json_line)
    except (json.JSONDecodeError, ValueError) as exc:
        raise CodeRunnerError(
            f"Code output is not valid JSON: {exc}. "
            "Your script must print a JSON object with 'counts' and 'probabilities'."
        )

    if "__error__" in data:
        raise CodeRunnerError(f"Runtime error in user code: {data['__error__']}")

    # Validate required fields
    if "counts" not in data or "probabilities" not in data:
        raise CodeRunnerError(
            "Output JSON must contain 'counts' and 'probabilities' keys."
        )

    counts: dict = data["counts"]
    probabilities: dict = data["probabilities"]
    num_qubits: int = data.get("num_qubits", len(next(iter(counts))) if counts else 1)

    # Enforce qubit limit
    if num_qubits > 5:
        raise CodeRunnerError("Simulation exceeded the 5-qubit limit.")

    gate_count = data.get("gate_count", 0)

    raw_sv = data.get("statevector")
    bloch_vectors = data.get("bloch_vectors")

    # If statevector is provided but bloch_vectors was not explicitly computed by user code,
    # auto-derive the per-qubit Bloch vectors so the 3D Bloch sphere tab works!
    if bloch_vectors is None and raw_sv and isinstance(raw_sv, list):
        try:
            import numpy as np
            from services.quantum_executor import _bloch_vector_from_array
            sv_array = np.array([complex(c[0], c[1]) for c in raw_sv], dtype=complex)
            bloch_vectors = [
                _bloch_vector_from_array(sv_array, q, num_qubits)
                for q in range(num_qubits)
            ]
        except Exception as e:
            logger.debug("Auto-calculation of bloch vectors in code runner failed: %s", e)

    return SimulationResult(
        counts=counts,
        probabilities=probabilities,
        statevector=raw_sv,
        bloch_vectors=bloch_vectors,
        unitary=data.get("unitary"),
        num_qubits=num_qubits,
        gate_count=gate_count,
        shots=shots,
    )
