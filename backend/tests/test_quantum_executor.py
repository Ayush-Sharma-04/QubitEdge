"""
tests/test_quantum_executor.py
Unit tests for the quantum circuit executor.
Run with: pytest backend/tests/ -v
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from models import GateOp
from services.quantum_executor import run_visual_circuit, QuantumExecutorError, _infer_num_qubits


def make_gate(type_, qubit, step, control=None):
    return GateOp(type=type_, qubit=qubit, step=step, control=control)


class TestInferNumQubits:
    def test_empty_gates_returns_1(self):
        assert _infer_num_qubits([], None) == 1

    def test_explicit_overrides_gates(self):
        gates = [make_gate("H", 0, 0)]
        assert _infer_num_qubits(gates, 3) == 3

    def test_infers_from_max_qubit(self):
        gates = [make_gate("H", 2, 0)]
        assert _infer_num_qubits(gates, None) == 3

    def test_includes_control_qubit(self):
        gates = [make_gate("CNOT", 1, 0, control=3)]
        assert _infer_num_qubits(gates, None) == 4


class TestRunVisualCircuit:
    def test_identity_circuit(self):
        """Empty circuit returns |0⟩ state."""
        result = run_visual_circuit(gates=[], shots=128, num_qubits=1)
        assert result.num_qubits == 1
        assert result.shots == 128
        assert "0" in result.counts

    def test_x_gate_flips_qubit(self):
        """X gate on |0⟩ should always produce |1⟩."""
        gates = [make_gate("X", 0, 0)]
        result = run_visual_circuit(gates=gates, shots=128, num_qubits=1)
        assert result.counts.get("1", 0) == 128

    def test_hadamard_creates_superposition(self):
        """H gate should produce ~50/50 split over many shots."""
        gates = [make_gate("H", 0, 0)]
        result = run_visual_circuit(gates=gates, shots=4096, num_qubits=1)
        prob_0 = result.probabilities.get("0", 0)
        prob_1 = result.probabilities.get("1", 0)
        assert abs(prob_0 - 0.5) < 0.05, f"Expected ~0.5, got {prob_0}"
        assert abs(prob_1 - 0.5) < 0.05, f"Expected ~0.5, got {prob_1}"

    def test_bell_state(self):
        """H + CNOT should produce Bell state: ~50% |00⟩, ~50% |11⟩."""
        gates = [
            make_gate("H", 0, 0),
            make_gate("CNOT", 1, 1, control=0),
        ]
        result = run_visual_circuit(gates=gates, shots=4096, num_qubits=2)
        prob_00 = result.probabilities.get("00", 0)
        prob_11 = result.probabilities.get("11", 0)
        assert abs(prob_00 - 0.5) < 0.05, f"|00⟩ prob: {prob_00}"
        assert abs(prob_11 - 0.5) < 0.05, f"|11⟩ prob: {prob_11}"
        # No |01⟩ or |10⟩
        assert result.probabilities.get("01", 0) < 0.02
        assert result.probabilities.get("10", 0) < 0.02

    def test_qubit_cap_enforced(self):
        """num_qubits is capped at 5."""
        gates = [make_gate("H", 0, 0)]
        result = run_visual_circuit(gates=gates, shots=128, num_qubits=5)
        assert result.num_qubits == 5

    def test_cnot_missing_control_raises(self):
        """CNOT without control qubit raises QuantumExecutorError."""
        gates = [make_gate("CNOT", 1, 0, control=None)]
        with pytest.raises(QuantumExecutorError, match="missing a control qubit"):
            run_visual_circuit(gates=gates, shots=128, num_qubits=2)

    def test_unsupported_gate_raises(self):
        """Unknown gate type raises QuantumExecutorError."""
        gates = [make_gate("INVALID", 0, 0)]
        with pytest.raises(QuantumExecutorError, match="Unsupported gate"):
            run_visual_circuit(gates=gates, shots=128, num_qubits=1)

    def test_probabilities_sum_to_one(self):
        """All probabilities must sum to 1.0."""
        gates = [
            make_gate("H", 0, 0),
            make_gate("H", 1, 0),
            make_gate("H", 2, 0),
        ]
        result = run_visual_circuit(gates=gates, shots=1024, num_qubits=3)
        total = sum(result.probabilities.values())
        assert abs(total - 1.0) < 1e-6, f"Probabilities sum to {total}"

    def test_shots_capped_at_1024(self):
        """Shots over 1024 are silently capped."""
        result = run_visual_circuit(gates=[], shots=9999, num_qubits=1)
        assert result.shots == 1024
