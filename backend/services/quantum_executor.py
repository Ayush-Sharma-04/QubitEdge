"""
quantum_executor.py
-------------------
Converts a visual JSON gate list into a Qiskit QuantumCircuit and
runs it through the AerSimulator, returning:
  - counts / probabilities (measurement histogram)
  - statevector (complex amplitudes)
  - bloch_vectors (per-qubit [x, y, z] from reduced density matrix)
  - unitary (full circuit unitary matrix)
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from qiskit import QuantumCircuit, transpile
    from qiskit_aer import AerSimulator
    import numpy as np
    QISKIT_AVAILABLE = True
except ImportError as err:
    QISKIT_AVAILABLE = False
    logger.warning("Qiskit / qiskit-aer not available (%s). Using mock mode.", err)

from models import GateOp, SimulationResult

SINGLE_QUBIT_GATES = {"H", "X", "Y", "Z", "S", "T", "I"}
TWO_QUBIT_GATES = {"CNOT", "CX"}


class QuantumExecutorError(Exception):
    """Raised when circuit construction or simulation fails."""


# ---------------------------------------------------------------------------
# Circuit builder
# ---------------------------------------------------------------------------

def _build_circuit(gates: List[GateOp], num_qubits: int) -> "QuantumCircuit":
    qc = QuantumCircuit(num_qubits, num_qubits)
    _GATE_MAP = {'H': 'h', 'X': 'x', 'Y': 'y', 'Z': 'z', 'S': 's', 'T': 't', 'I': 'id'}
    for gate in sorted(gates, key=lambda g: (g.step, g.qubit)):
        gtype = gate.type.upper()
        if gtype in SINGLE_QUBIT_GATES:
            getattr(qc, _GATE_MAP[gtype])(gate.qubit)
        elif gtype in TWO_QUBIT_GATES:
            if gate.control is None:
                raise QuantumExecutorError(f"CNOT at step {gate.step} missing control qubit.")
            if gate.control == gate.qubit:
                raise QuantumExecutorError(f"CNOT at step {gate.step}: control == target.")
            qc.cx(gate.control, gate.qubit)
        else:
            raise QuantumExecutorError(f"Unsupported gate type: '{gate.type}'")
    qc.measure(range(num_qubits), range(num_qubits))
    return qc


def _infer_num_qubits(gates: List[GateOp], explicit: Optional[int]) -> int:
    if explicit is not None:
        return explicit
    if not gates:
        return 1
    all_q = {g.qubit for g in gates} | {g.control for g in gates if g.control is not None}
    return min(max(all_q) + 1, 5)


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Statevector & Bloch vector calculation
# ---------------------------------------------------------------------------

def _extract_statevector(qc_no_measure: "QuantumCircuit") -> Optional["np.ndarray"]:
    """
    Extract the statevector as a 1D complex numpy array.
    Uses qiskit.quantum_info.Statevector first (instant, exact, no simulator needed),
    and falls back to AerSimulator with save_statevector().
    """
    try:
        from qiskit.quantum_info import Statevector
        sv = Statevector(qc_no_measure)
        return np.asarray(sv.data, dtype=complex)
    except Exception as e:
        logger.debug("quantum_info.Statevector direct computation failed: %s", e)

    try:
        sim = AerSimulator(method="statevector")
        qc_sv = qc_no_measure.copy()
        qc_sv.save_statevector()
        compiled = transpile(qc_sv, sim)
        res = sim.run(compiled, shots=1).result()
        sv = res.get_statevector()
        if hasattr(sv, 'data'):
            return np.asarray(sv.data, dtype=complex)
        return np.asarray(sv, dtype=complex)
    except Exception as e:
        logger.warning("AerSimulator save_statevector failed: %s", e)

    return None


def _bloch_vector_from_array(sv_array: "np.ndarray", qubit: int, num_qubits: int) -> List[float]:
    """
    Compute Bloch vector [x, y, z] for qubit `qubit` via reduced density matrix.
    Uses fully vectorized NumPy bitmask contraction for microsecond execution.
    """
    mask = 1 << qubit
    dim = len(sv_array)

    indices = np.arange(dim)
    bit_zero_mask = (indices & mask) == 0
    k_zero = indices[bit_zero_mask]
    k_one = k_zero | mask

    pk_zero = sv_array[k_zero]
    pk_one = sv_array[k_one]

    rho_00 = float(np.sum(np.abs(pk_zero) ** 2))
    rho_11 = float(np.sum(np.abs(pk_one) ** 2))
    rho_01 = complex(np.sum(pk_zero * np.conj(pk_one)))

    bx = float(2.0 * rho_01.real)
    by = float(-2.0 * rho_01.imag)
    bz = float(rho_00 - rho_11)

    # Clamp to [-1.0, 1.0] to account for any small floating-point error
    bx = round(float(np.clip(bx, -1.0, 1.0)), 6)
    by = round(float(np.clip(by, -1.0, 1.0)), 6)
    bz = round(float(np.clip(bz, -1.0, 1.0)), 6)
    return [bx, by, bz]


# ---------------------------------------------------------------------------
# Unitary helper
# ---------------------------------------------------------------------------

def _get_unitary(qc_no_measure: "QuantumCircuit") -> Optional[List[List[List[float]]]]:
    """Extract the unitary matrix of a measurement-free circuit."""
    # Method 1: qiskit.quantum_info.Operator (built-in, exact, instant)
    try:
        from qiskit.quantum_info import Operator
        U = np.asarray(Operator(qc_no_measure).data, dtype=complex)
        return [
            [[round(float(U[r, c].real), 6), round(float(U[r, c].imag), 6)] for c in range(U.shape[1])]
            for r in range(U.shape[0])
        ]
    except Exception as e:
        logger.debug("Operator extraction failed: %s", e)

    # Method 2: AerSimulator(method="unitary")
    try:
        sim = AerSimulator(method="unitary")
        qc_u = qc_no_measure.copy()
        qc_u.save_unitary()
        compiled = transpile(qc_u, sim)
        result = sim.run(compiled).result()
        U = np.asarray(result.get_unitary(compiled), dtype=complex)
        return [
            [[round(float(U[r, c].real), 6), round(float(U[r, c].imag), 6)] for c in range(U.shape[1])]
            for r in range(U.shape[0])
        ]
    except Exception as e:
        logger.warning("Unitary extraction failed: %s", e)
        return None


# ---------------------------------------------------------------------------
# Main run function
# ---------------------------------------------------------------------------

# Global cached AerSimulator instance to avoid repeated cold-start re-initialization
_CACHED_AER_SIMULATOR: Optional["AerSimulator"] = None

def _get_cached_aer_sim() -> Optional["AerSimulator"]:
    global _CACHED_AER_SIMULATOR
    if _CACHED_AER_SIMULATOR is None and QISKIT_AVAILABLE:
        try:
            _CACHED_AER_SIMULATOR = AerSimulator()
        except Exception as e:
            logger.warning("Could not initialize AerSimulator: %s", e)
    return _CACHED_AER_SIMULATOR


def run_visual_circuit(
    gates: List[GateOp],
    shots: int = 1024,
    num_qubits: Optional[int] = None,
) -> SimulationResult:
    shots = min(shots, 1024)
    n = _infer_num_qubits(gates, num_qubits)
    n = min(n, 5)
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
    """
    Simulates the circuit with high performance:
    1. Derives Statevector analytically via qiskit.quantum_info.Statevector (< 1ms).
    2. Samples measurement shots analytically via np.random.multinomial (< 0.1ms).
    3. Derives Bloch vectors and Unitary matrix directly.
    4. Falls back to cached AerSimulator if analytical path fails.
    """
    qc_sv = qc.remove_final_measurements(inplace=False)
    n = qc.num_qubits
    dim = 2 ** n

    # ── 1. Analytical Statevector ──────────────────────────────────────────
    sv_array = _extract_statevector(qc_sv)

    counts: Dict[str, int] = {}
    probabilities: Dict[str, float] = {}

    if sv_array is not None:
        # Analytical shot sampling: avoids transpile and C++ Aer startup overhead
        probs_raw = np.abs(sv_array) ** 2
        sum_p = float(np.sum(probs_raw))
        probs_norm = probs_raw / sum_p if sum_p > 0 else probs_raw

        bitstrings = [format(i, f"0{n}b") for i in range(dim)]
        probabilities = {bitstrings[i]: round(float(probs_norm[i]), 6) for i in range(dim) if probs_norm[i] > 1e-7}
        if not probabilities:
            probabilities = {bitstrings[0]: 1.0}

        # Fast multinomial sampling for measurement counts
        sampled = np.random.multinomial(shots, probs_norm)
        counts = {bitstrings[i]: int(sampled[i]) for i in range(dim) if sampled[i] > 0}
    else:
        # Fallback to cached AerSimulator if analytical statevector is unavailable
        sim = _get_cached_aer_sim()
        if sim is not None:
            compiled = transpile(qc, sim)
            counts = sim.run(compiled, shots=shots).result().get_counts()
            total = sum(counts.values()) or 1
            probabilities = {k: v / total for k, v in counts.items()}

    # ── 2. Format Statevector ──────────────────────────────────────────────
    statevector: Optional[List[List[float]]] = None
    if sv_array is not None:
        try:
            statevector = [[round(float(a.real), 6), round(float(a.imag), 6)] for a in sv_array]
        except Exception as e:
            logger.warning("Statevector serialization failed: %s", e)

    # ── 3. Bloch vectors ───────────────────────────────────────────────────
    bloch_vectors: Optional[List[List[float]]] = None
    if sv_array is not None:
        try:
            bloch_vectors = [
                _bloch_vector_from_array(sv_array, q, n)
                for q in range(n)
            ]
        except Exception as e:
            logger.warning("Bloch vector computation failed: %s", e)

    # ── 4. Unitary matrix ──────────────────────────────────────────────────
    unitary = _get_unitary(qc_sv)

    return SimulationResult(
        counts=counts,
        probabilities=probabilities,
        statevector=statevector,
        bloch_vectors=bloch_vectors,
        unitary=unitary,
        num_qubits=n,
        gate_count=gate_count,
        shots=shots,
    )


# ---------------------------------------------------------------------------
# Mock fallback (Qiskit unavailable)
# ---------------------------------------------------------------------------

def _mock_result(num_qubits: int, shots: int, gate_count: int) -> SimulationResult:
    zero = "0" * num_qubits
    one  = "1" * num_qubits
    half = shots // 2
    dim  = 2 ** num_qubits
    # Mock statevector: |0...0> ground state
    statevector = [[1.0, 0.0]] + [[0.0, 0.0]] * (dim - 1)
    bloch_vectors = [[0.0, 0.0, 1.0]] * num_qubits  # |0> north pole
    unitary = [
        [[1.0 if r == c else 0.0, 0.0] for c in range(dim)]
        for r in range(dim)
    ]
    return SimulationResult(
        counts={zero: shots},
        probabilities={zero: 1.0},
        statevector=statevector,
        bloch_vectors=bloch_vectors,
        unitary=unitary,
        num_qubits=num_qubits,
        gate_count=gate_count,
        shots=shots,
    )

