'use client';

import dynamic from 'next/dynamic';
import type { SimulationResult } from '@/lib/types';

// Plotly must be SSR-safe
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface HistogramProps {
  result: SimulationResult;
}

export default function Histogram({ result }: HistogramProps) {
  const { probabilities, counts, shots, num_qubits } = result;

  // Sort states by bitstring value
  const states = Object.keys(probabilities).sort();
  const probs = states.map((s) => probabilities[s]);
  const countVals = states.map((s) => counts[s] ?? 0);

  // Format state labels with ket notation
  const labels = states.map((s) => `|${s}⟩`);

  // Color bars by probability magnitude using corporate navy & indigo shades
  const colors = probs.map((p) => {
    if (p >= 0.4) return '#1e3a8a'; // Corporate Navy
    if (p >= 0.15) return '#3b82f6'; // Quantum Blue
    return '#94a3b8'; // Slate
  });

  const hoverText = states.map(
    (s, i) =>
      `State: |${s}⟩<br>Probability: ${(probs[i] * 100).toFixed(1)}%<br>Counts: ${countVals[i]} / ${shots}`
  );

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--color-text)]">
            Basis State Distribution
          </span>
          <span className="badge badge-info text-[11px]">
            {num_qubits} Qubit{num_qubits > 1 ? 's' : ''} · {shots} Shots
          </span>
        </div>
        <span className="text-xs text-[var(--color-text-subtle)] font-medium">
          {states.length} non-zero basis state{states.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 min-h-0 p-3">
        <Plot
          data={[
            {
              type: 'bar',
              x: labels,
              y: probs,
              text: probs.map((p) => `${(p * 100).toFixed(1)}%`),
              textposition: 'outside',
              hovertext: hoverText,
              hoverinfo: 'text',
              marker: {
                color: colors,
                line: { color: 'transparent', width: 0 },
              },
            },
          ]}
          layout={{
            autosize: true,
            margin: { t: 28, r: 20, b: 40, l: 52 },
            xaxis: {
              title: { text: 'Basis State |ψ⟩', font: { size: 11, color: '#475569' } },
              tickfont: { family: "'JetBrains Mono', monospace", size: 12, color: '#0f172a' },
              gridcolor: '#e2e8f0',
            },
            yaxis: {
              title: { text: 'Probability', font: { size: 11, color: '#475569' } },
              range: [0, Math.min(1.15, Math.max(...probs) * 1.25)],
              tickformat: '.0%',
              gridcolor: '#e2e8f0',
              zeroline: true,
              zerolinecolor: '#cbd5e1',
            },
            paper_bgcolor: '#f8fafc',
            plot_bgcolor: '#f8fafc',
            font: { family: "'Inter', sans-serif", size: 12, color: '#0f172a' },
            bargap: 0.35,
          }}
          config={{
            responsive: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
          }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  );
}
