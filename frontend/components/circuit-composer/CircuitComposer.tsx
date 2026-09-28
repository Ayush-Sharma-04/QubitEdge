'use client';

import { useState, useRef, useCallback } from 'react';
import type { GateOp, GateType, CircuitState } from '@/lib/types';
import { GATE_PALETTE } from '@/lib/types';
import { MousePointer, Info, X } from 'lucide-react';

interface CircuitComposerProps {
  circuit: CircuitState;
  onAddGate: (gate: Omit<GateOp, 'id'>) => void;
  onRemoveGate: (id: string) => void;
  onClear: () => void;
  onNumQubitsChange: (n: number) => void;
  /** Active gate selected in GateContainer — drives both drag and click-to-place */
  activeGate: GateType | null;
  onActiveGateChange: (gate: GateType | null) => void;
}

const MAX_STEPS = 16;

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

// Row height for the qubit wires
const ROW_H = 56;
// Left offset for qubit label
const LABEL_W = 44;
// Column width per step
const STEP_W = 60;

export default function CircuitComposer({
  circuit,
  onAddGate,
  onRemoveGate,
  activeGate,
  onActiveGateChange,
}: CircuitComposerProps) {
  const [cnotControl, setCnotControl] = useState<number | null>(null);
  // Which cell is the user hovering over while dragging?
  const [hoverCell, setHoverCell] = useState<{ qubit: number; step: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Helpers 

  const nextStep = useCallback(
    (qubit: number) => {
      const occupied = circuit.gates
        .filter((g) => g.qubit === qubit || g.control === qubit)
        .map((g) => g.step);
      let s = 0;
      while (occupied.includes(s)) s++;
      return Math.min(s, MAX_STEPS - 1);
    },
    [circuit.gates]
  );

  /** Place the active gate on a qubit, handling CNOT two-step flow */
  const placeGate = useCallback(
    (qubit: number, step?: number) => {
      if (!activeGate) return;

      if (activeGate === 'CNOT') {
        if (cnotControl === null) {
          setCnotControl(qubit);
          return;
        }
        if (cnotControl === qubit) {
          // Clicked control again — cancel
          setCnotControl(null);
          return;
        }
        const s = step ?? Math.max(nextStep(qubit), nextStep(cnotControl));
        onAddGate({ type: 'CNOT', qubit, control: cnotControl, step: s });
        setCnotControl(null);
        onActiveGateChange(null);
      } else {
        const s = step ?? nextStep(qubit);
        onAddGate({ type: activeGate, qubit, step: s });
        onActiveGateChange(null);
      }
    },
    [activeGate, cnotControl, nextStep, onAddGate, onActiveGateChange]
  );

  // ── Drag-and-drop: resolve column from x position ─────────────────────

  const resolveStep = (e: React.DragEvent | React.MouseEvent, qubit: number): number => {
    if (!canvasRef.current) return nextStep(qubit);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - LABEL_W;
    const col = Math.floor(x / STEP_W);
    return Math.max(0, Math.min(col, MAX_STEPS - 1));
  };

  const handleDragOver = (e: React.DragEvent, qubit: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const step = resolveStep(e, qubit);
    setHoverCell({ qubit, step });
  };

  const handleDrop = (e: React.DragEvent, qubit: number) => {
    e.preventDefault();
    setHoverCell(null);
    const step = resolveStep(e, qubit);
    placeGate(qubit, step);
  };

  const handleDragLeave = () => setHoverCell(null);

  const handleWireClick = (e: React.MouseEvent, qubit: number) => {
    if (!activeGate) return;
    const step = resolveStep(e, qubit);
    placeGate(qubit, step);
  };

  // Layout 

  const gateAt    = (q: number, s: number) => circuit.gates.find((g) => g.qubit   === q && g.step === s);
  const controlAt = (q: number, s: number) => circuit.gates.find((g) => g.type === 'CNOT' && g.control === q && g.step === s);

  const maxStep = circuit.gates.reduce((m, g) => Math.max(m, g.step), -1);
  const visibleSteps = Math.min(maxStep + 3, MAX_STEPS);
  const canvasW = LABEL_W + visibleSteps * STEP_W + 16;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>

      {/* ── Hint bar ── */}
      <div
        className="flex items-center gap-3 px-5 border-b text-xs"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
          minHeight: 36, flexShrink: 0,
        }}
      >
        {activeGate ? (
          <>
            <MousePointer className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              {activeGate === 'CNOT'
                ? cnotControl === null
                  ? 'Click or drag onto the CONTROL qubit wire'
                  : `Control set on q${cnotControl} — now click or drag onto the TARGET qubit wire`
                : `Click or drag onto a qubit wire to place ${activeGate}`}
            </span>
            <button
              onClick={() => { onActiveGateChange(null); setCnotControl(null); }}
              className="ml-auto btn-ghost flex items-center gap-1 px-2 py-0.5 rounded"
              style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}
            >
              <X size={11} /> Cancel
            </button>
          </>
        ) : cnotControl !== null ? (
          <>
            <Info className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
            <span style={{ color: 'var(--color-accent)' }}>
              CNOT control on q{cnotControl} — click target wire
            </span>
          </>
        ) : (
          <span>Select a gate in the left panel, then click a qubit wire to place it.</span>
        )}
      </div>

      {/* ── Canvas ── */}
      <div
        className="flex-1 overflow-auto p-5"
        style={{ background: 'var(--color-bg)' }}
      >
        <div
          ref={canvasRef}
          style={{
            position: 'relative',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            minWidth: canvasW,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {Array.from({ length: circuit.numQubits }, (_, qi) => (
            <div
              key={qi}
              className="qubit-wire"
              style={{
                height: ROW_H,
                cursor: activeGate ? 'cell' : 'default',
                position: 'relative',
              }}
              onDragOver={(e) => handleDragOver(e, qi)}
              onDrop={(e) => handleDrop(e, qi)}
              onDragLeave={handleDragLeave}
              onClick={(e) => handleWireClick(e, qi)}
            >
              {/* Qubit label */}
              <div className="qubit-label" style={{ position: 'absolute', left: 0, top: 0, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: LABEL_W, zIndex: 3 }}>
                q{qi}
              </div>

              {/* Horizontal wire */}
              <div className="wire-line" style={{ left: LABEL_W }} />

              {/* Hover ghost cell */}
              {hoverCell && hoverCell.qubit === qi && activeGate && !gateAt(qi, hoverCell.step) && (
                <div style={{
                  position: 'absolute',
                  left: LABEL_W + hoverCell.step * STEP_W + (STEP_W - 42) / 2,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 42, height: 32,
                  borderRadius: 6,
                  border: `2px dashed ${GATE_COLORS[activeGate]?.border ?? 'var(--color-accent)'}`,
                  background: GATE_COLORS[activeGate]?.bg ?? 'var(--color-accent-subtle)',
                  opacity: 0.6,
                  zIndex: 2,
                  pointerEvents: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 700,
                  color: GATE_COLORS[activeGate]?.text ?? 'var(--color-accent)',
                }}>
                  {activeGate}
                </div>
              )}

              {/* Placed gates */}
              {Array.from({ length: visibleSteps }, (_, si) => {
                const gate = gateAt(qi, si);
                const ctrl = controlAt(qi, si);
                return (
                  <div
                    key={si}
                    style={{
                      position: 'absolute',
                      left: LABEL_W + si * STEP_W,
                      width: STEP_W,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  >
                    {gate && (
                      <PlacedGate gate={gate} onRemove={() => onRemoveGate(gate.id)} />
                    )}
                    {ctrl && !gate && (
                      <div
                        title={`CNOT control → q${ctrl.qubit}`}
                        style={{
                          width: 13, height: 13,
                          borderRadius: '50%',
                          background: GATE_COLORS.CNOT.border,
                          cursor: 'pointer',
                          pointerEvents: 'all',
                          flexShrink: 0,
                        }}
                        onClick={(e) => { e.stopPropagation(); onRemoveGate(ctrl.id); }}
                      />
                    )}
                  </div>
                );
              })}

              {/* CNOT vertical connector line */}
              {circuit.gates
                .filter((g) => g.type === 'CNOT' && g.control != null)
                .map((g) => {
                  if (g.qubit !== qi && g.control !== qi) return null;
                  const top    = Math.min(g.qubit, g.control!) * ROW_H + ROW_H / 2;
                  const bottom = Math.max(g.qubit, g.control!) * ROW_H + ROW_H / 2;
                  if (g.qubit !== qi) return null; // draw once, from target row
                  return (
                    <div
                      key={`cnot-line-${g.id}`}
                      style={{
                        position: 'absolute',
                        left: LABEL_W + g.step * STEP_W + STEP_W / 2 - 1,
                        top: top - qi * ROW_H,
                        height: bottom - top,
                        width: 2,
                        background: GATE_COLORS.CNOT.border,
                        zIndex: 1,
                        pointerEvents: 'none',
                      }}
                    />
                  );
                })}
            </div>
          ))}
        </div>

        {circuit.gates.length === 0 && (
          <p className="text-sm mt-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Select a gate in the left panel, then click a qubit wire to place it — or drag a gate directly onto the wire.
          </p>
        )}
      </div>
    </div>
  );
}

function PlacedGate({ gate, onRemove }: { gate: GateOp; onRemove: () => void }) {
  const colors = GATE_COLORS[gate.type];
  return (
    <button
      title={`${gate.type} on q${gate.qubit} step ${gate.step} — click to remove`}
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className="gate-chip"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        width: gate.type === 'CNOT' ? 48 : 42,
        fontSize: gate.type === 'CNOT' ? '0.65rem' : '0.78rem',
        cursor: 'pointer',
        pointerEvents: 'all',
        flexShrink: 0,
        zIndex: 4,
        position: 'relative',
      }}
    >
      {gate.type === 'CNOT' ? (
        <span style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1 }}>⊕</span>
      ) : (
        gate.type
      )}
    </button>
  );
}
