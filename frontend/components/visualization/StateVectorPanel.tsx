'use client';

/**
 * StateVectorPanel.tsx — displays the statevector as a table of complex amplitudes
 */
import type { SimulationResult } from '@/lib/types';

interface Props { result: SimulationResult; }

function formatComplex(re: number, im: number): string {
  const rStr = re.toFixed(4);
  if (Math.abs(im) < 1e-6) return rStr;
  const sign = im >= 0 ? '+' : '−';
  return `${rStr} ${sign} ${Math.abs(im).toFixed(4)}i`;
}

function amplitude(re: number, im: number): number {
  return Math.sqrt(re * re + im * im);
}

export default function StateVectorPanel({ result }: Props) {
  const { statevector, num_qubits, probabilities } = result;

  if (!statevector || statevector.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%',
        color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)',
        fontSize: '0.85rem', gap: 8,
      }}>
        <p style={{ fontWeight: 600 }}>Statevector not available.</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>
          Statevector is computed automatically in visual mode. In code mode, your script
          must explicitly compute and print a <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', background: 'var(--color-bg)', padding: '1px 5px', borderRadius: 4 }}>statevector</code> key in its JSON output.
        </p>
      </div>
    );
  }

  const dim = statevector.length;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '12px 16px' }}>
      <div style={{ marginBottom: 12, fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
        {dim}-dimensional statevector for {num_qubits}-qubit system · showing all {dim} basis states
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            {['Basis state', 'Amplitude', 'Probability', 'Phase (rad)', 'Bar'].map(h => (
              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-subtle)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statevector.map(([re, im], idx) => {
            const amp  = amplitude(re, im);
            const prob = amp * amp;
            const phase = Math.atan2(im, re);
            const bits = idx.toString(2).padStart(num_qubits, '0');
            const isNonZero = amp > 1e-6;

            return (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: isNonZero ? 'var(--color-accent-subtle)' : 'transparent',
                  opacity: isNonZero ? 1 : 0.4,
                }}
              >
                {/* Basis state */}
                <td style={{ padding: '7px 10px', fontWeight: 700, color: 'var(--color-accent)' }}>
                  |{bits}⟩
                </td>

                {/* Complex amplitude */}
                <td style={{ padding: '7px 10px', color: 'var(--color-text)' }}>
                  {formatComplex(re, im)}
                </td>

                {/* Probability */}
                <td style={{ padding: '7px 10px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {(prob * 100).toFixed(2)}%
                </td>

                {/* Phase */}
                <td style={{ padding: '7px 10px', color: 'var(--color-text-subtle)' }}>
                  {isNonZero ? phase.toFixed(4) : '—'}
                </td>

                {/* Probability bar */}
                <td style={{ padding: '7px 10px', width: 120 }}>
                  <div style={{ height: 10, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${prob * 100}%`,
                      background: `linear-gradient(90deg, var(--color-accent), var(--color-logo-mark))`,
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
