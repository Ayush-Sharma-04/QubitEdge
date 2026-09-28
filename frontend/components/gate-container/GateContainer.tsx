'use client';

import type { GateOp, GateType, CircuitState, SimulationMode } from '@/lib/types';
import { GATE_PALETTE } from '@/lib/types';
import {
  Trash2,
  SlidersHorizontal,
  Terminal,
  FlaskConical,
  Info,
  MousePointer,
} from 'lucide-react';

const GATE_COLORS: Record<GateType, { bg: string; border: string; text: string }> = {
  H:    { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
  X:    { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
  Y:    { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
  Z:    { bg: '#fefce8', border: '#eab308', text: '#854d0e' },
  S:    { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  T:    { bg: '#f0fdfa', border: '#14b8a6', text: '#0f766e' },
  I:    { bg: '#f8fafc', border: '#94a3b8', text: '#475569' },
  CNOT: { bg: '#faf5ff', border: '#a855f7', text: '#7e22ce' },
};

interface GateContainerProps {
  mode: SimulationMode;
  circuit: CircuitState;
  onAddGate: (gate: Omit<GateOp, 'id'>) => void;
  onRemoveGate: (id: string) => void;
  onClear: () => void;
  onNumQubitsChange: (n: number) => void;
  code: string;
  onCodeChange: (code: string) => void;
  /** Lifted-up active gate state shared with CircuitComposer */
  activeGate: GateType | null;
  onActiveGateChange: (gate: GateType | null) => void;
}

const QISKIT_TEMPLATE = `# QubitEdge — Qiskit Starter
import json
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

simulator = AerSimulator()
job = simulator.run(qc, shots=1024)
counts = dict(job.result().get_counts())
total = sum(counts.values())
probabilities = {k: v / total for k, v in counts.items()}
print(json.dumps({"counts": counts, "probabilities": probabilities, "num_qubits": qc.num_qubits, "gate_count": qc.size()}))
`;

const PENNYLANE_TEMPLATE = `# QubitEdge — PennyLane Starter
import json
import pennylane as qml

dev = qml.device("default.qubit", wires=2, shots=1024)

@qml.qnode(dev)
def circuit():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.counts()

result = circuit()
counts = {k: int(v) for k, v in result.items()}
total = sum(counts.values())
probabilities = {k: v / total for k, v in counts.items()}
print(json.dumps({"counts": counts, "probabilities": probabilities, "num_qubits": 2, "gate_count": 2}))
`;

export default function GateContainer({
  mode,
  circuit,
  onRemoveGate,
  onClear,
  onNumQubitsChange,
  code,
  onCodeChange,
  activeGate,
  onActiveGateChange,
}: GateContainerProps) {
  const sdk = code.includes('pennylane') ? 'pennylane' : 'qiskit';

  const loadTemplate = (s: 'qiskit' | 'pennylane') => {
    onCodeChange(s === 'qiskit' ? QISKIT_TEMPLATE : PENNYLANE_TEMPLATE);
  };

  return (
    <div className="gate-container" style={{ width: 180, flexShrink: 0 }}>

      {/* Header */}
      <div className="panel-header" style={{ padding: '10px 14px' }}>
        {mode === 'visual' ? 'Gate Palette' : 'SDK'}
      </div>

      {mode === 'visual' ? (
        <>
          {/* Qubits selector */}
          <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="gate-section-label" style={{ padding: '0 0 6px 0' }}>Qubits</div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--color-text-subtle)' }} />
              <select
                value={circuit.numQubits}
                onChange={(e) => onNumQubitsChange(Number(e.target.value))}
                style={{
                  flex: 1,
                  fontSize: '0.8rem', fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  padding: '5px 8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} Qubit{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Gate palette */}
          <div className="flex-1 overflow-y-auto">
            <div className="gate-section-label">Gates</div>

            {/* Active hint */}
            {activeGate && (
              <div
                className="mx-3 mb-2 px-2 py-1.5 rounded text-xs flex items-center gap-1.5"
                style={{
                  background: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                  border: '1px solid var(--color-accent-light)',
                  fontSize: '0.68rem',
                }}
              >
                <MousePointer className="w-3 h-3 flex-shrink-0" />
                <span>
                  {activeGate === 'CNOT'
                    ? 'Click/drag control, then target wire'
                    : `Click or drag to place ${activeGate}`}
                </span>
              </div>
            )}

            <div className="px-3 pb-3 flex flex-wrap gap-2">
              {GATE_PALETTE.map((g) => {
                const colors = GATE_COLORS[g.type];
                const isActive = activeGate === g.type;
                return (
                  <button
                    key={g.type}
                    title={g.description}
                    draggable
                    onDragStart={(e) => {
                      // Set drag data so CircuitComposer's drop handler can read gate type
                      e.dataTransfer.setData('text/plain', g.type);
                      e.dataTransfer.effectAllowed = 'copy';
                      onActiveGateChange(g.type);
                    }}
                    onDragEnd={() => {
                      // If dropped successfully the composer will have cleared activeGate;
                      // if dropped outside a wire we clear it here.
                      // Small delay so the drop handler fires first.
                      setTimeout(() => onActiveGateChange(null), 50);
                    }}
                    onClick={() =>
                      onActiveGateChange(activeGate === g.type ? null : g.type)
                    }
                    className="gate-chip"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: isActive ? colors.border : 'rgba(0,0,0,0.15)',
                      color: colors.text,
                      outline: isActive ? `2px solid ${colors.border}` : 'none',
                      outlineOffset: 2,
                      width: g.twoQubit ? 60 : 42,
                      fontSize: g.twoQubit ? '0.65rem' : '0.78rem',
                    }}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            {/* Circuit gate list */}
            {circuit.gates.length > 0 && (
              <div className="px-3 pb-2">
                <div className="gate-section-label" style={{ marginBottom: 6 }}>Placed Gates</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {circuit.gates.map((g) => {
                    const colors = GATE_COLORS[g.type];
                    return (
                      <div
                        key={g.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '3px 6px', borderRadius: 5,
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          fontSize: '0.68rem', color: colors.text,
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{g.type}</span>
                        <span style={{ color: 'var(--color-text-subtle)' }}>
                          q{g.qubit}{g.control != null ? `↔q${g.control}` : ''} s{g.step}
                        </span>
                        <button
                          onClick={() => onRemoveGate(g.id)}
                          style={{
                            background: 'none', border: 'none',
                            cursor: 'pointer', color: colors.text,
                            opacity: 0.6, lineHeight: 0, padding: 2,
                          }}
                          title="Remove gate"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Clear */}
          <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={onClear}
              className="btn btn-secondary w-full"
              style={{ fontSize: '0.8rem', padding: '6px 0', justifyContent: 'center' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Circuit
            </button>
          </div>
        </>
      ) : (
        /* Code mode */
        <>
          <div className="gate-section-label" style={{ padding: '10px 14px 6px' }}>Framework</div>

          <div className="px-3">
            <div className="sdk-selector">
              {(['qiskit', 'pennylane'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => loadTemplate(s)}
                  className={`sdk-btn ${sdk === s ? 'sdk-btn-active' : 'sdk-btn-inactive'}`}
                >
                  {s === 'qiskit' ? 'Qiskit' : 'PennyLane'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-3">
            <div
              className="p-3 rounded"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                {sdk === 'qiskit' ? (
                  <FlaskConical className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                ) : (
                  <Terminal className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                )}
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {sdk === 'qiskit' ? 'Qiskit + Aer' : 'PennyLane'}
                </span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                {sdk === 'qiskit'
                  ? "IBM's quantum SDK. Uses AerSimulator for fast local simulation."
                  : 'ML-focused quantum SDK. Device-agnostic with differentiable circuits.'}
              </p>
            </div>
          </div>

          <div
            className="p-3 border-t text-xs"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-subtle)' }}
          >
            Python 3.12 · Max 5 Qubits
          </div>
        </>
      )}
    </div>
  );
}
