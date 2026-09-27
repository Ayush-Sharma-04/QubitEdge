"""
quantum_executor.py
-------------------
Converts a visual JSON gate list into a Qiskit QuantumCircuit and
runs it through the AerSimulator statevector backend.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from qiskit import QuantumCircuit, transpile
    from qiskit_aer import AerSimulator
    QISKIT_AVAILABLE = True
except ImportError as err:
    QISKIT_AVAILABLE = False
    logger.warning("Qiskit / qiskit-aer not available (%s). Quantum executor will use mock mode.", err)

from models import GateOp, SimulationResult

# Supported single-qubit gates
SINGLE_QUBIT_GATES = {"H", "X", "Y", "Z", "S", "T", "I"}
# Supported two-qubit gates
TWO_QUBIT_GATES = {"CNOT", "CX"}


class QuantumExecutorError(Exception):
    """Raised when circuit construction or simulation fails."""


def _build_circuit(gates: List[GateOp], num_qubits: int) -> "QuantumCircuit":
    """Build a Qiskit QuantumCircuit from an ordered gate list."""
    qc = QuantumCircuit(num_qubits, num_qubits)

    # Sort gates by step (chronological order)
    sorted_gates = sorted(gates, key=lambda g: (g.step, g.qubit))

    for gate in sorted_gates:
        gtype = gate.type.upper()

        if gtype in SINGLE_QUBIT_GATES:
            if gtype == "H":
                qc.h(gate.qubit)
            elif gtype == "X":
                qc.x(gate.qubit)
            elif gtype == "Y":
                qc.y(gate.qubit)
            elif gtype == "Z":
                qc.z(gate.qubit)
            elif gtype == "S":
                qc.s(gate.qubit)
            elif gtype == "T":
                qc.t(gate.qubit)
            elif gtype == "I":
                qc.id(gate.qubit)

        elif gtype in TWO_QUBIT_GATES:
            if gate.control is None:
                raise QuantumExecutorError(
                    f"CNOT gate at step {gate.step} is missing a control qubit."
                )
            if gate.control == gate.qubit:
                raise QuantumExecutorError(
                    f"CNOT at step {gate.step}: control and target must be different qubits."
                )
            qc.cx(gate.control, gate.qubit)

        else:
            raise QuantumExecutorError(f"Unsupported gate type: '{gate.type}'")

    # Measure all qubits
    qc.measure(range(num_qubits), range(num_qubits))
    return qc


def _infer_num_qubits(gates: List[GateOp], explicit: Optional[int]) -> int:
    """Determine qubit count from gates or explicit override."""
    if explicit is not None:
        return explicit
    if not gates:
        return 1
    all_qubits = {g.qubit for g in gates}
    all_qubits |= {g.control for g in gates if g.control is not None}
    return min(max(all_qubits) + 1, 5)


def run_visual_circuit(
    gates: List[GateOp],
    shots: int = 1024,
    num_qubits: Optional[int] = None,
) -> SimulationResult:
    """
    Execute a visual-mode circuit and return a SimulationResult.

    Args:
        gates: Ordered list of GateOp objects from the frontend.
        shots: Number of measurement shots (capped at 1024).
        num_qubits: Explicit qubit count override (1–5). Inferred from gates if None.

    Returns:
        SimulationResult with counts, probabilities, and statevector.
    """
    shots = min(shots, 1024)
    n = _infer_num_qubits(gates, num_qubits)
    n = min(n, 5)  # Hard cap

    if not QISKIT_AVAILABLE:
        return _mock_result(n, shots, len(gates))

    try:
        qc = _build_circuit(gates, n)
        return _run_circuit(qc, shots, len(gates))
    except QuantumExecutorError:
        raise
    except Exception as exc:
        raise QuantumExecutorError(f"Circuit simulation failed: {exc}") from exc


def _run_circuit(qc: "QuantumCircuit", shots: int, gate_count: int) -> SimulationResult:
    """Run a compiled Qiskit circuit and produce a SimulationResult."""
    simulator = AerSimulator(method="statevector")
    compiled = transpile(qc, simulator)
    job = simulator.run(compiled, shots=shots)
    result = job.result()

    counts: Dict[str, int] = result.get_counts()
    total = sum(counts.values())
    probabilities = {k: v / total for k, v in counts.items()}

    # Extract statevector (before measurement)
    qc_sv = qc.remove_final_measurements(inplace=False)
    sv_sim = AerSimulator(method="statevector")
    sv_compiled = transpile(qc_sv, sv_sim)
    sv_job = sv_sim.run(sv_compiled, shots=1)
    sv_result = sv_job.result()

    try:
        sv = sv_result.get_statevector()
        statevector = [[float(amp.real), float(amp.imag)] for amp in sv]
    except Exception:
        statevector = None

    return SimulationResult(
        counts=counts,
        probabilities=probabilities,
        statevector=statevector,
        num_qubits=qc.num_qubits,
        gate_count=gate_count,
        shots=shots,
    )


def _mock_result(num_qubits: int, shots: int, gate_count: int) -> SimulationResult:
    """Return a deterministic mock result when Qiskit is unavailable."""
    zero = "0" * num_qubits
    one = "1" * num_qubits
    half = shots // 2
    counts = {zero: half, one: shots - half}
    probs = {zero: 0.5, one: 0.5}
    return SimulationResult(
        counts=counts,
        probabilities=probs,
        statevector=None,
        num_qubits=num_qubits,
        gate_count=gate_count,
        shots=shots,
    )
