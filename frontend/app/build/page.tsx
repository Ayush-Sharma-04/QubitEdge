'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSimulation } from '@/hooks/useSimulation';
import { useAuth } from '@/lib/auth-context';
import { useAuthModal } from '@/components/auth/RootProviders';
import CircuitComposer from '@/components/circuit-composer/CircuitComposer';
import CodeEditor from '@/components/code-editor/CodeEditor';
import ResultsPanel from '@/components/visualization/ResultsPanel';
import AiTutor from '@/components/ai-tutor/AiTutor';
import GateContainer from '@/components/gate-container/GateContainer';
import {
  Play,
  Bot,
  RefreshCw,
  LogIn,
  LogOut,
  PanelRightClose,
  PanelRightOpen,
  User,
  Lock,
} from 'lucide-react';

export default function BuildPage() {
  const sim = useSimulation();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const [activeGate, setActiveGate] = useState<import('@/lib/types').GateType | null>(null);
  const { openAuthModal } = useAuthModal();

  const [tutorOpen, setTutorOpen] = useState(true);

  // Auth-gated run: show modal for guests, execute for authenticated users
  const handleRunSimulation = useCallback(async () => {
    if (!isAuthenticated) {
      openAuthModal('Sign in to execute your circuit and see the quantum simulation results.');
      return;
    }
    await sim.executeSimulation();
  }, [isAuthenticated, openAuthModal, sim]);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>

      {/* Navbar */}
      <nav className="navbar" style={{ height: '56px', padding: '0 32px', flexShrink: 0 }}>
        <Link href="/" className="navbar-logo">
          <span className="navbar-q" style={{ fontSize: '1.7rem' }}>Q</span>
          <span className="navbar-brand" style={{ fontSize: '1rem' }}>QubitEdge</span>
          <span className="navbar-page-badge navbar-page-badge-build">
            <span>Build</span>
          </span>
        </Link>

        <div className="navbar-links">
          <Link href="/" className="navbar-link" style={{ fontSize: '0.875rem' }}>Home</Link>
          <Link href="/learn" className="navbar-link" style={{ fontSize: '0.875rem' }}>Learn</Link>

          {!authLoading && (
            isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.85rem', fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  padding: '4px 10px',
                  background: 'var(--color-accent-subtle)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-accent-light)',
                }}>
                  <User size={13} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ color: 'var(--color-accent)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email?.split('@')[0]}
                  </span>
                </span>
                <button
                  onClick={() => signOut()}
                  className="btn-ghost flex items-center gap-1.5 px-3 py-1.5"
                  style={{ fontSize: '0.82rem', fontWeight: 600 }}
                  title="Sign out"
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="btn-login"
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
              >
                <LogIn className="w-3.5 h-3.5" />
                Log in
              </button>
            )
          )}
        </div>
      </nav>

      {/* Build toolbar row: Mode Toggle + Run Simulation  */}
      <div
        className="flex items-stretch flex-shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {/* Left spacer matching gate container width */}
        <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--color-border)' }} />

        {/* Mode Toggle */}
        <div className="mode-toggle" style={{ width: 480 }}>
          <button
            onClick={() => sim.setMode('visual')}
            disabled={sim.isRunning}
            className={`mode-toggle-btn ${sim.mode === 'visual' ? 'mode-toggle-btn-active' : 'mode-toggle-btn-inactive'}`}
            title={sim.mode === 'visual' ? 'Active: Visual Composer' : 'Switch to Visual Composer'}
          >
            Visual Composer
          </button>
          <button
            onClick={() => sim.setMode('code')}
            disabled={sim.isRunning}
            className={`mode-toggle-btn ${sim.mode === 'code' ? 'mode-toggle-btn-active' : 'mode-toggle-btn-inactive'}`}
            title={sim.mode === 'code' ? 'Active: Code Editor' : 'Switch to Code Editor'}
          >
            Code Editor
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Backend status + Run button */}
        <div className="flex items-center gap-3 pr-4">
          <BackendStatus />

          {/* Run Simulation — shows lock icon for guests */}
          <button
            id="run-simulation-btn"
            onClick={handleRunSimulation}
            disabled={sim.isRunning}
            className="btn-run"
            title={isAuthenticated ? 'Run Simulation' : 'Log in to run simulation'}
            style={{ position: 'relative' }}
          >
            {sim.isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating…</span>
              </>
            ) : isAuthenticated ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Simulation</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* AI Tutor toggle — aligned right */}
        <button
          onClick={() => setTutorOpen((o) => !o)}
          className="btn-ghost flex items-center gap-2 px-3 border-l"
          style={{
            borderColor: 'var(--color-border)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: tutorOpen ? 'var(--color-accent)' : 'var(--color-text-muted)',
          }}
          title="Toggle AI Tutor panel"
        >
          <Bot className="w-4 h-4" />
          <span>AI Tutor</span>
          {tutorOpen
            ? <PanelRightClose className="w-3.5 h-3.5" />
            : <PanelRightOpen className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/*  Guest banner: design freely, log in to execute */}
      {!isAuthenticated && !authLoading && (
        <div style={{
          background: 'linear-gradient(90deg, var(--color-accent-subtle) 0%, #f5f3ff 100%)',
          borderBottom: '1px solid var(--color-accent-light)',
          padding: '8px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
             Design your circuit freely — <strong style={{ color: 'var(--color-text)' }}>sign in to execute</strong> and see quantum results.
          </span>
          <button
            onClick={() => openAuthModal('Sign in to run your quantum circuit simulation.')}
            style={{
              fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-sans)',
              background: 'var(--color-accent)', color: 'var(--color-text-inv)',
              border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
            }}
          >
            Sign in
          </button>
        </div>
      )}

      {/*  Main workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Gate Container sidebar */}
        <GateContainer
          mode={sim.mode}
          circuit={sim.circuit}
          onAddGate={sim.addGate}
          onRemoveGate={sim.removeGate}
          onClear={sim.clearCircuit}
          onNumQubitsChange={sim.setNumQubits}
          code={sim.code}
          onCodeChange={sim.setCode}
          activeGate={activeGate}
          onActiveGateChange={setActiveGate}
        />

        {/* Main panel: circuit/code + results */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">

          {/* Top: Circuit or Code */}
          <div className="flex-1 min-h-0 overflow-hidden" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {sim.mode === 'visual' ? (
              <CircuitComposer
                circuit={sim.circuit}
                onAddGate={sim.addGate}
                onRemoveGate={sim.removeGate}
                onClear={sim.clearCircuit}
                onNumQubitsChange={sim.setNumQubits}
                activeGate={activeGate}
                onActiveGateChange={setActiveGate}
              />
            ) : (
              <CodeEditor code={sim.code} onChange={sim.setCode} />
            )}
          </div>

          {/* Bottom: Results */}
          <div style={{ height: '48%', minHeight: 180, flexShrink: 0 }}>
            <ResultsPanel
              result={sim.result}
              error={sim.runError}
              isRunning={sim.isRunning}
              isAuthenticated={isAuthenticated}
              onLoginPrompt={() => openAuthModal('Sign in to run your quantum circuit simulation.')}
            />
          </div>
        </div>

        {/* AI Tutor sidebar */}
        {tutorOpen && (
          <aside
            className="flex-shrink-0 flex flex-col"
            style={{
              width: 320,
              background: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
            }}
          >
            <AiTutor
              messages={sim.messages}
              isChatting={sim.isChatting}
              onSend={sim.sendMessage}
              onClear={sim.clearChat}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

/* ─── Backend status ─── */
function BackendStatus() {
  const [status, setStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');

  const check = async () => {
    try {
      const res = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/health'
      );
      setStatus(res.ok ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const dotColor =
    status === 'ok' ? 'var(--color-success)' :
      status === 'error' ? 'var(--color-error)' :
        'var(--color-border-dark)';

  return (
    <button
      onClick={check}
      title="Click to check backend"
      className="btn-ghost flex items-center gap-1.5 px-2 py-1 text-xs"
      style={{ fontWeight: 500 }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: dotColor, display: 'inline-block' }} />
      <span style={{ color: 'var(--color-text-muted)' }}>
        {status === 'ok' ? 'Backend OK' : status === 'error' ? 'Offline' : 'Check backend'}
      </span>
    </button>
  );
}
