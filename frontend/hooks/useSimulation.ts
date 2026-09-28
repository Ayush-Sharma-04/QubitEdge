'use client';

// hooks/useSimulation.ts — simulation state + auth-gated execution

import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { simulateCircuit, chatWithTutor } from '@/lib/api';
import type {
  CircuitState,
  GateOp,
  SimulationMode,
  SimulationResult,
  ChatMessage,
  TutorContext,
} from '@/lib/types';

const DEFAULT_CIRCUIT: CircuitState = { gates: [], numQubits: 2 };
const DEFAULT_CODE = `# QubitEdge — Qiskit Starter
import json
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)

# Exact statevector before measurement
sv = Statevector(qc)
statevector = [[float(a.real), float(a.imag)] for a in sv.data]

qc.measure([0, 1], [0, 1])

simulator = AerSimulator()
job = simulator.run(qc, shots=1024)
counts = dict(job.result().get_counts())
total = sum(counts.values())
probabilities = {k: v / total for k, v in counts.items()}

print(json.dumps({
    "counts": counts,
    "probabilities": probabilities,
    "statevector": statevector,
    "num_qubits": qc.num_qubits,
    "gate_count": qc.size(),
}))
`;

export function useSimulation() {
  const [mode, setMode] = useState<SimulationMode>('visual');
  const [circuit, setCircuit] = useState<CircuitState>(DEFAULT_CIRCUIT);
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  // ---- Circuit mutations ----

  const addGate = useCallback((gate: Omit<GateOp, 'id'>) => {
    setCircuit(prev => ({
      ...prev,
      gates: [...prev.gates, { ...gate, id: nanoid(8) }],
    }));
  }, []);

  const removeGate = useCallback((id: string) => {
    setCircuit(prev => ({
      ...prev,
      gates: prev.gates.filter(g => g.id !== id),
    }));
  }, []);

  const clearCircuit = useCallback(() => {
    setCircuit(DEFAULT_CIRCUIT);
    setResult(null);
    setRunError(null);
  }, []);

  const setNumQubits = useCallback((n: number) => {
    const clamped = Math.max(1, Math.min(5, n));
    setCircuit(prev => ({
      numQubits: clamped,
      // Remove gates that reference qubits beyond new count
      gates: prev.gates.filter(
        g => g.qubit < clamped && (g.control == null || g.control < clamped)
      ),
    }));
  }, []);

  // ---- Run simulation (auth-gating handled in BuildPage via onRunRequest) ----
  //      This executes the actual API call — caller is responsible for auth check.

  const executeSimulation = useCallback(async () => {
    setIsRunning(true);
    setRunError(null);
    try {
      let response;
      if (mode === 'visual') {
        response = await simulateCircuit({
          mode: 'visual',
          shots: 1024,
          gates: circuit.gates.map(({ id: _id, ...g }) => g),
          num_qubits: circuit.numQubits,
        });
      } else {
        response = await simulateCircuit({
          mode: 'code',
          shots: 1024,
          code,
        });
      }

      if (response.success && response.result) {
        setResult(response.result);
      } else {
        setRunError(response.error ?? 'Unknown simulation error');
        setResult(null);
      }
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Network error — is the backend running?');
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  }, [mode, circuit, code]);

  // ---- AI Tutor ----

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: nanoid(8),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsChatting(true);

    const context: TutorContext = {
      mode,
      circuit: mode === 'visual' ? circuit : code,
      results: result,
    };

    // Build history for context (last 6 turns)
    const history = messages.slice(-6).map(m => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      content: m.content,
    }));

    try {
      const response = await chatWithTutor({ message: text, context, history });
      const assistantMsg: ChatMessage = {
        id: nanoid(8),
        role: 'assistant',
        content: response.reply || response.error || 'No response received.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: nanoid(8),
        role: 'assistant',
        content: `⚠️ ${err instanceof Error ? err.message : 'Connection error'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsChatting(false);
    }
  }, [mode, circuit, code, result, messages]);

  const clearChat = useCallback(() => setMessages([]), []);

  return {
    // State
    mode, setMode,
    circuit, code, setCode,
    result, isRunning, runError,
    messages, isChatting,
    // Actions
    addGate, removeGate, clearCircuit, setNumQubits,
    executeSimulation,
    sendMessage, clearChat,
  };
}
