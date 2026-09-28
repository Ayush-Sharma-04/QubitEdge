'use client';

import Link from 'next/link';
import { LogIn, LogOut, BookOpen, ArrowRight, Lock, User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAuthModal } from '@/components/auth/RootProviders';

const MODULES = [
  {
    id: 1,
    title: 'Introduction to Quantum Computing',
    description: 'Discover what makes quantum computers fundamentally different from classical machines.',
    duration: '15 min',
    topics: ['Bits vs Qubits', 'Quantum advantage', 'Real-world applications'],
  },
  {
    id: 2,
    title: 'Superposition & the Hadamard Gate',
    description: 'Explore how qubits exist in multiple states simultaneously and build your first circuit.',
    duration: '20 min',
    topics: ['Bloch sphere', 'H gate', 'Measurement collapse'],
  },
  {
    id: 3,
    title: 'Quantum Entanglement',
    description: 'Understand the "spooky action at a distance" that powers quantum communication.',
    duration: '25 min',
    topics: ['Bell states', 'CNOT gate', 'EPR paradox'],
  },
  {
    id: 4,
    title: 'Quantum Algorithms',
    description: 'Learn how Grover and Deutsch–Jozsa algorithms achieve exponential speedups.',
    duration: '30 min',
    topics: ["Grover's search", 'Deutsch–Jozsa', 'Oracle design'],
  },
  {
    id: 5,
    title: 'Quantum Error Correction',
    description: 'Discover how quantum information is protected against decoherence and noise.',
    duration: '25 min',
    topics: ['Bit-flip codes', 'Shor code', 'Fault tolerance'],
  },
  {
    id: 6,
    title: 'Quantum Supremacy & Future',
    description: 'Examine milestone achievements and the road ahead for quantum hardware.',
    duration: '20 min',
    topics: ['Google Sycamore', 'NISQ era', 'Quantum advantage benchmarks'],
  },
];

export default function LearnPage() {
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { openAuthModal } = useAuthModal();

  const handleModuleClick = (e: React.MouseEvent, moduleId: number) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openAuthModal('Sign in to access this learning module and track your progress.');
    }
    // If authenticated, Link will navigate normally
    void moduleId;
  };

  return (
    <div
      className="flex flex-col min-h-screen ambient-quantum-bg"
      style={{ minHeight: '100vh', position: 'relative' }}
    >
      {/* Navbar */}
      <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" className="navbar-logo">
          <span className="navbar-q">Q</span>
          <span className="navbar-brand">QubitEdge</span>
          <span className="navbar-page-badge navbar-page-badge-learn">
            <span>Learn</span>
          </span>
        </Link>

        <div className="navbar-links">
          <Link href="/" className="navbar-link">Home</Link>
          <Link href="/build" className="navbar-link">Build</Link>

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
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <button onClick={() => openAuthModal()} className="btn-login">
                <LogIn className="w-4 h-4" />
                Log in
              </button>
            )
          )}
        </div>
      </nav>

      {/* Page header */}
      <div style={{
        paddingTop: 52, paddingBottom: 32,
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-sans)', fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 700, color: 'var(--color-text)', marginBottom: 12,
        }}>
          Curriculum Hub
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '1rem',
          color: 'var(--color-text-muted)', maxWidth: 500, margin: '0 auto',
        }}>
          {isAuthenticated
            ? 'Continue your quantum journey — pick a module to resume or start fresh.'
            : 'Browse the curriculum freely. Sign in to unlock modules and track your progress.'}
        </p>

        {!isAuthenticated && !authLoading && (
          <button
            onClick={() => openAuthModal('Sign in to start learning and track your module progress.')}
            style={{
              marginTop: 16,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 24px',
              background: 'var(--color-accent)', color: 'var(--color-text-inv)',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 700,
            }}
          >
            <LogIn size={15} />
            Sign in to start learning
          </button>
        )}
      </div>

      {/* Module Grid */}
      <main
        className="flex-1 flex flex-col px-8"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          width: '100%',
          paddingBottom: '80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '28px 36px',
          }}
        >
          {MODULES.map((module) => (
            <Link
              key={module.id}
              href={`/learn/${module.id}`}
              onClick={(e) => handleModuleClick(e, module.id)}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                className="card"
                style={{
                  minHeight: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  position: 'relative',
                  opacity: isAuthenticated ? 1 : 0.92,
                  transition: 'opacity 0.15s',
                }}
              >
                {/* Lock badge for guests */}
                {!isAuthenticated && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'var(--color-accent-subtle)',
                    border: '1px solid var(--color-accent-light)',
                    borderRadius: 6, padding: '3px 7px',
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: '0.72rem', fontWeight: 600,
                    color: 'var(--color-accent)',
                  }}>
                    <Lock size={10} />
                    Sign in
                  </div>
                )}

                {isAuthenticated && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'var(--color-success-bg)',
                    border: '1px solid var(--color-success-border)',
                    borderRadius: 6, padding: '3px 7px',
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: '0.72rem', fontWeight: 600,
                    color: 'var(--color-success)',
                  }}>
                    <CheckCircle size={10} />
                    Unlocked
                  </div>
                )}

                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '8px',
                      background: 'var(--color-accent-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <BookOpen className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      color: 'var(--color-text-subtle)',
                      background: 'var(--color-bg)',
                      borderRadius: 4, padding: '2px 7px',
                      border: '1px solid var(--color-border)',
                    }}>
                      Module {module.id} · {module.duration}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem', fontWeight: 700,
                    color: 'var(--color-text)', marginBottom: 8,
                    lineHeight: 1.3,
                  }}>
                    {module.title}
                  </h3>

                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem', fontWeight: 400,
                    color: 'var(--color-text-muted)', lineHeight: 1.5,
                    marginBottom: 12,
                  }}>
                    {module.description}
                  </p>

                  {/* Topic chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {module.topics.map(t => (
                      <span key={t} style={{
                        fontSize: '0.72rem', fontWeight: 500,
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-subtle)',
                        borderRadius: 4, padding: '2px 7px',
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{
                  marginTop: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-accent)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}>
                  <span>{isAuthenticated ? 'Start module' : 'Preview'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
