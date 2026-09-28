'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { SimulationResult } from '@/lib/types';
import {
  BarChart3, Atom, TableProperties, Binary, Grid3x3,
  RefreshCw, AlertTriangle, CheckCircle2, Lock,
} from 'lucide-react';

// Each tab panel is dynamically imported so heavy deps (Plotly, Three.js) only
// load when their tab is first opened.

const Histogram        = dynamic(() => import('./Histogram'),        { ssr: false, loading: () => <PanelLoader /> });
const BlochSpheresPanel= dynamic(() => import('./BlochSpheresPanel'),{ ssr: false, loading: () => <PanelLoader /> });
const ProbabilityTable = dynamic(() => import('./ProbabilityTable'), { ssr: false, loading: () => <PanelLoader /> });
const StateVectorPanel = dynamic(() => import('./StateVectorPanel'), { ssr: false, loading: () => <PanelLoader /> });
const UnitaryMatrix    = dynamic(() => import('./UnitaryMatrix'),    { ssr: false, loading: () => <PanelLoader /> });

// Tabs

type TabId = 'histogram' | 'bloch' | 'probabilities' | 'statevector' | 'unitary';

interface Tab { id: TabId; label: string; icon: React.ReactNode; }

const TABS: Tab[] = [
  { id: 'histogram',     label: 'Histogram',     icon: <BarChart3 size={13} /> },
  { id: 'bloch',         label: 'Bloch Sphere',  icon: <Atom size={13} /> },
  { id: 'probabilities', label: 'Probabilities', icon: <TableProperties size={13} /> },
  { id: 'statevector',   label: 'State Vector',  icon: <Binary size={13} /> },
  { id: 'unitary',       label: 'Unitary',       icon: <Grid3x3 size={13} /> },
];



interface ResultsPanelProps {
  result: SimulationResult | null;
  error: string | null;
  isRunning: boolean;
  isAuthenticated: boolean;
  onLoginPrompt: () => void;
}



export default function ResultsPanel({
  result,
  error,
  isRunning,
  isAuthenticated,
  onLoginPrompt,
}: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('histogram');

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-surface)' }}>

      {/*  Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0, overflowX: 'auto',
      }}>
        {/* Section label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 14px', borderRight: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <BarChart3 size={13} style={{ color: 'var(--color-accent)' }} />
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
          }}>
            Simulation Outputs
          </span>
        </div>

        {/* Tab buttons */}
        <div style={{ display: 'flex', flex: 1 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id && !!result;
            return (
              <button
                key={tab.id}
                onClick={() => result && setActiveTab(tab.id)}
                disabled={!result}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0 14px', height: 36,
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                  background: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 600,
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  cursor: result ? 'pointer' : 'not-allowed',
                  opacity: result ? 1 : 0.45,
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s, border-color 0.15s',
                  flexShrink: 0,
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Result badges */}
        {result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', flexShrink: 0 }}>
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
              <CheckCircle2 size={10} />
              {result.gate_count}g
            </span>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{result.shots}s</span>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{result.num_qubits}q</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0" style={{ overflow: 'hidden' }}>

        {/* Running spinner */}
        {isRunning && (
          <CenteredState>
            <RefreshCw size={24} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              Simulating via AerSimulator…
            </p>
          </CenteredState>
        )}

        {/* Error */}
        {!isRunning && error && (
          <div style={{ padding: 16 }}>
            <div className="alert alert-error" style={{ display: 'flex', gap: 10 }}>
              <AlertTriangle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem' }}>{error}</span>
            </div>
          </div>
        )}

        {/* Guest prompt */}
        {!isRunning && !error && !result && !isAuthenticated && (
          <CenteredState>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--color-accent-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={20} style={{ color: 'var(--color-accent)' }} />
            </div>
            <p style={{
              fontSize: '0.82rem', color: 'var(--color-text-muted)',
              maxWidth: 300, textAlign: 'center', lineHeight: 1.6,
            }}>
              Circuit ready.{' '}
              <button
                onClick={onLoginPrompt}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-accent)', fontWeight: 700,
                  fontSize: '0.82rem', fontFamily: 'var(--font-sans)',
                  textDecoration: 'underline', padding: 0,
                }}
              >
                Sign in
              </button>
              {' '}to execute and view all 5 output types.
            </p>
          </CenteredState>
        )}

        {/* Authenticated empty state */}
        {!isRunning && !error && !result && isAuthenticated && (
          <CenteredState>
            <BarChart3 size={32} style={{ color: 'var(--color-border-dark)', strokeWidth: 1.2 }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
              Build a circuit and click{' '}
              <strong style={{ color: 'var(--color-text)' }}>Run Simulation</strong>{' '}
              to view outputs.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
              {TABS.map(t => (
                <span key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 9px', borderRadius: 'var(--radius-full)',
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  fontSize: '0.72rem', color: 'var(--color-text-subtle)', fontFamily: 'var(--font-sans)',
                }}>
                  {t.icon}{t.label}
                </span>
              ))}
            </div>
          </CenteredState>
        )}

        {/* Tab content */}
        {!isRunning && !error && result && (
          <div style={{ height: '100%' }}>
            {activeTab === 'histogram'     && <Histogram result={result} />}
            {activeTab === 'bloch'         && <BlochSpheresPanel result={result} />}
            {activeTab === 'probabilities' && <ProbabilityTable result={result} />}
            {activeTab === 'statevector'   && <StateVectorPanel result={result} />}
            {activeTab === 'unitary'       && <UnitaryMatrix result={result} />}
          </div>
        )}
      </div>
    </div>
  );
}

// Helpers

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 12, padding: 24,
    }}>
      {children}
    </div>
  );
}

function PanelLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 80 }}>
      <RefreshCw size={18} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}
