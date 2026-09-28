'use client';

/**
 * BlochSpheresPanel.tsx
 * Wraps the Three.js BlochSphere in a dynamically-imported boundary
 * so Next.js correctly lazy-loads Three.js only when this tab is active.
 */

import dynamic from 'next/dynamic';
import type { SimulationResult } from '@/lib/types';
import { Atom, RefreshCw } from 'lucide-react';

// Three.js must NOT run on the server
const BlochSphere = dynamic(() => import('./BlochSphere'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 220, height: 220 }}>
      <RefreshCw size={18} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite' }} />
    </div>
  ),
});

interface Props { result: SimulationResult; }

export default function BlochSpheresPanel({ result }: Props) {
  const { bloch_vectors, num_qubits } = result;

  if (!bloch_vectors || bloch_vectors.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 10,
        color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
      }}>
        <Atom size={28} style={{ color: 'var(--color-border-dark)' }} />
        <p style={{ fontWeight: 600 }}>Bloch vectors not available for this simulation.</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
          Use visual mode with the Qiskit backend to compute per-qubit Bloch vectors.
        </p>
      </div>
    );
  }

  const sphereSize = num_qubits <= 2 ? 220 : num_qubits <= 3 ? 190 : 160;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '8px 16px', borderBottom: '1px solid var(--color-border)',
        fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)',
        flexShrink: 0,
      }}>
        Per-qubit Bloch vectors computed from reduced density matrix ·{' '}
        <strong style={{ color: 'var(--color-text)' }}>drag each sphere to rotate</strong>
      </div>

      <div style={{
        flex: 1, overflow: 'auto',
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'flex-start', justifyContent: 'center',
        gap: 28, padding: 24,
      }}>
        {bloch_vectors.map((bv, qi) => (
          <BlochSphere
            key={qi}
            blochVector={bv as [number, number, number]}
            qubitLabel={`q${qi}`}
            size={sphereSize}
          />
        ))}
      </div>
    </div>
  );
}
