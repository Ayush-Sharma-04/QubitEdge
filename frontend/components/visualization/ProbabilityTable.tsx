'use client';

/**
 * ProbabilityTable.tsx — clean tabular view of measurement outcomes
 */
import type { SimulationResult } from '@/lib/types';

interface Props { result: SimulationResult; }

export default function ProbabilityTable({ result }: Props) {
  const { counts, probabilities, shots, num_qubits } = result;
  const states = Object.keys(probabilities).sort((a, b) => probabilities[b] - probabilities[a]);
  const maxProb = Math.max(...Object.values(probabilities));

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '12px 16px' }}>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
          {states.length} distinct outcome{states.length !== 1 ? 's' : ''} · {shots} total shots · {num_qubits} qubit{num_qubits > 1 ? 's' : ''}
        </span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            {['Rank', 'Basis State', 'Counts', 'Probability', 'Relative', 'Distribution'].map(h => (
              <th key={h} style={{ padding: '6px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-subtle)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {states.map((state, rank) => {
            const prob = probabilities[state];
            const count = counts[state] ?? 0;
            const rel = prob / maxProb;
            const isTop = rank === 0;

            return (
              <tr
                key={state}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: isTop ? 'var(--color-accent-subtle)' : rank % 2 === 0 ? 'transparent' : 'var(--color-bg)',
                }}
              >
                <td style={{ padding: '8px 12px', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                  #{rank + 1}
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: isTop ? 'var(--color-accent)' : 'var(--color-text)' }}>
                  |{state}⟩
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--color-text)' }}>
                  {count.toLocaleString()}
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--color-text)' }}>
                  {(prob * 100).toFixed(2)}%
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)' }}>
                  {(rel * 100).toFixed(1)}%
                </td>
                <td style={{ padding: '8px 12px', width: 160 }}>
                  <div style={{ height: 14, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${rel * 100}%`,
                      background: isTop
                        ? `linear-gradient(90deg, var(--color-accent), var(--color-logo-mark))`
                        : 'var(--color-accent-light)',
                      borderRadius: 4,
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
