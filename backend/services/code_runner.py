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

# Prohibited top-level modules in user code
FORBIDDEN_MODULES = {
    "os", "subprocess", "socket", "shutil", "pathlib",
    "ctypes", "multiprocessing", "threading", "signal",
    "pty", "tty", "fcntl", "resource", "mmap", "pickle", "shelve", "dbm",
    "requests", "urllib", "http"
}

FORBIDDEN_CALLS = {"eval", "exec", "breakpoint", "compile", "open"}


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


# Wrapper that captures user code output cleanly
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


def run_user_code(code: str, shots: int = 1024) -> SimulationResult:
    """
    Execute user-submitted Python code in a sandboxed subprocess.

    The user's code is expected to print a JSON object to stdout containing:
        {
            "counts": {"00": 512, "11": 512},
            "probabilities": {"00": 0.5, "11": 0.5},
            "num_qubits": 2
        }

    Args:
        code: Raw Python string submitted by the user.
        shots: Shot count passed as context (not enforced here; user controls it).

    Returns:
        SimulationResult parsed from the code's JSON output.
    """
    # Validate code statically via AST to forbid dangerous modules
    _validate_code_ast(code)

    # Indent user code to fit inside try block
    indented = textwrap.indent(code.rstrip(), "    ")
    wrapped = _WRAPPER_TEMPLATE.format(user_code=indented)

    # Write to a temp file
    TIMEOUT_SECONDS = 60
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as tf:
        tf.write(wrapped)
        tf.flush()
        tmp_path = tf.name
    # Explicitly closed by exiting with-block, now safe for child process to read on Windows

    try:
        proc = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        )
    except subprocess.TimeoutExpired:
        raise CodeRunnerError(
            f"Execution timed out after {TIMEOUT_SECONDS} seconds. "
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

    # Parse the last JSON object from stdout
    try:
        # Find the last line that looks like JSON
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

    return SimulationResult(
        counts=counts,
        probabilities=probabilities,
        statevector=data.get("statevector"),
        num_qubits=num_qubits,
        gate_count=gate_count,
        shots=shots,
    )
