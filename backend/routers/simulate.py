"""
simulate.py — /api/simulate and /api/v1/simulate/sync router

Blueprint spec: Primary endpoint is /api/v1/simulate/sync
Legacy endpoint /api/simulate is kept for backwards compatibility.
"""
from __future__ import annotations

import logging
from fastapi import APIRouter

from models import SimulateRequest, SimulateResponse, SimulationResult
from services.quantum_executor import run_visual_circuit, QuantumExecutorError
from services.code_runner import run_user_code, CodeRunnerError

logger = logging.getLogger(__name__)
router = APIRouter()


async def _execute_simulation(request: SimulateRequest) -> SimulateResponse:
    """
    Core simulation logic shared between legacy and versioned endpoints.

    - **visual mode**: Accepts a JSON gate list and builds a Qiskit circuit server-side.
    - **code mode**: Accepts a raw Python string and executes it in a sandboxed subprocess.
    """
    try:
        if request.mode == "visual":
            if not request.gates:
                # Empty circuit — return |0...0> ground state
                n = request.num_qubits or 1
                zero = "0" * n
                result = SimulationResult(
                    counts={zero: request.shots},
                    probabilities={zero: 1.0},
                    statevector=[[1.0, 0.0]] + [[0.0, 0.0]] * (2 ** n - 1),
                    num_qubits=n,
                    gate_count=0,
                    shots=request.shots,
                )
            else:
                result = run_visual_circuit(
                    gates=request.gates,
                    shots=request.shots,
                    num_qubits=request.num_qubits,
                )

        elif request.mode == "code":
            if not request.code or not request.code.strip():
                return SimulateResponse(
                    success=False,
                    error="No code provided. Write a Python script and click Run.",
                )
            result = run_user_code(code=request.code, shots=request.shots)

        else:
            return SimulateResponse(success=False, error=f"Unknown mode: {request.mode}")

        return SimulateResponse(success=True, result=result)

    except (QuantumExecutorError, CodeRunnerError) as exc:
        logger.warning("Simulation error: %s", exc)
        return SimulateResponse(success=False, error=str(exc))

    except Exception as exc:
        logger.exception("Unexpected simulation error")
        return SimulateResponse(
            success=False,
            error=f"An unexpected server error occurred: {exc}",
        )


# ---------------------------------------------------------------------------
# Legacy endpoint (backwards compatible)
# ---------------------------------------------------------------------------

@router.post(
    "/simulate",
    response_model=SimulateResponse,
    summary="Run a quantum circuit simulation (legacy)",
    description="Legacy endpoint kept for backwards compatibility. Prefer `/v1/simulate/sync`.",
    tags=["Simulation"],
)
async def simulate_legacy(request: SimulateRequest) -> SimulateResponse:
    return await _execute_simulation(request)


# ---------------------------------------------------------------------------
# Versioned endpoint — blueprint spec: /api/v1/simulate/sync
# ---------------------------------------------------------------------------

@router.post(
    "/v1/simulate/sync",
    response_model=SimulateResponse,
    summary="Run a quantum circuit simulation (v1)",
    description=(
        "Primary simulation endpoint per architecture spec. "
        "Accepts circuit JSON (visual mode) or Python string (code mode), "
        "processes the quantum math synchronously, and returns results instantly."
    ),
    tags=["Simulation"],
)
async def simulate_v1(request: SimulateRequest) -> SimulateResponse:
    return await _execute_simulation(request)
