'use client';

/**
 * UnitaryMatrix.tsx — displays the circuit unitary matrix with color-coded magnitude
 */
import type { SimulationResult } from '@/lib/types';

interface Props { result: SimulationResult; }

function magnitude(re: number, im: number) { return Math.sqrt(re * re + im * im); }

function magToColor(mag: number): string {
  // 0 → transparent, 1 → deep accent
  const alpha = Math.pow(mag, 0.6); // gamma to make small values visible
  return `rgba(77, 43, 187, ${(alpha * 0.75).toFixed(3)})`;
}

function formatCell(re: number, im: number): string {
  const mag = magnitude(re, im);
  if (mag < 1e-4) return '0';
  const rStr = Math.abs(re) < 1e-4 ? '0' : re.toFixed(3);
  if (Math.abs(im) < 1e-4) return rStr;
  const sign = im >= 0 ? '+' : '−';
  return `${rStr}${sign}${Math.abs(im).toFixed(3)}i`;
}

export default function UnitaryMatrix({ result }: Props) {
  const { unitary, num_qubits } = result;

  if (!unitary || unitary.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', flexDirection: 'column', gap: 8 }}>
        <p>Unitary matrix not available.</p>
        <p style={{ fontSize: '0.75rem' }}>This may happen for circuits &gt; 4 qubits, parametric gates, or code-mode simulations.</p>
      </div>
    );
  }

  const dim = unitary.length;
  const cellSize = Math.max(52, Math.min(80, Math.floor(480 / dim)));

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '12px 16px' }}>
      <div style={{ marginBottom: 12, fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
        {dim}×{dim} unitary matrix U for {num_qubits}-qubit circuit · cell color = |amplitude|
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', fontFamily: 'var(--font-sans)' }}>|amplitude|:</span>
        <div style={{
          width: 120, height: 12, borderRadius: 3,
          background: 'linear-gradient(90deg, rgba(77,43,187,0) 0%, rgba(77,43,187,0.75) 100%)',
          border: '1px solid var(--color-border)',
        }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', fontFamily: 'var(--font-sans)' }}>0 → 1</span>
      </div>

      <div style={{ display: 'inline-block' }}>
        {/* Column index header */}
        <div style={{ display: 'flex', marginLeft: 32 }}>
          {unitary[0].map((_, ci) => (
            <div key={ci} style={{
              width: cellSize, textAlign: 'center',
              fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-subtle)', padding: '2px 0',
            }}>
              |{ci.toString(2).padStart(num_qubits, '0')}⟩
            </div>
          ))}
        </div>

        {unitary.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Row label */}
            <div style={{
              width: 32, fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-subtle)', textAlign: 'right', paddingRight: 4,
            }}>
              ⟨{ri.toString(2).padStart(num_qubits, '0')}|
            </div>

            {row.map(([re, im], ci) => {
              const mag = magnitude(re, im);
              return (
                <div
                  key={ci}
                  title={`U[${ri},${ci}] = ${re.toFixed(6)} + ${im.toFixed(6)}i  |amp| = ${mag.toFixed(4)}`}
                  style={{
                    width: cellSize, height: cellSize,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: magToColor(mag),
                    border: '1px solid var(--color-border)',
                    fontSize: Math.max(8, cellSize * 0.14),
                    fontFamily: 'var(--font-mono)',
                    color: mag > 0.5 ? 'var(--color-text-inv)' : 'var(--color-text)',
                    fontWeight: mag > 0.3 ? 700 : 400,
                    cursor: 'default',
                    userSelect: 'none',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    padding: 2,
                    transition: 'background 0.2s',
                  }}
                >
                  {cellSize >= 60 ? formatCell(re, im) : mag < 1e-4 ? '0' : mag.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
