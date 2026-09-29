'use client';

import Link from 'next/link';
import { LogIn, LogOut, User, BookOpen, Cpu, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAuthModal } from '@/components/auth/RootProviders';
import Image from 'next/image';
import tempLogoMark from '@/public/logo/tempLogoMark.svg';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const { openAuthModal } = useAuthModal();

  return (
    <div className="flex flex-col min-h-screen ambient-quantum-bg" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Navbar */}
      <nav className="navbar" style={{ position: 'relative', zIndex: 10 }}>
        <Link href="/" className="navbar-logo">
          {/* <span className="navbar-q">Q</span>
          <span className="navbar-brand">QubitEdge</span> */}
          < Image src ={tempLogoMark} alt="Logo" className='w-8 h-auto' />
        </Link>

        <div className="navbar-links">
          <Link href="/" className="navbar-link">Home</Link>
          <Link href="/learn" className="navbar-link">Learn</Link>
          <Link href="/build" className="navbar-link">Build</Link>

          {!isLoading && (
            isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.85rem', fontWeight: 600,
                  padding: '4px 10px',
                  background: 'var(--color-accent-subtle)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-accent-light)',
                }}>
                  <User size={13} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ color: 'var(--color-accent)' }}>
                    {user?.email?.split('@')[0]}
                  </span>
                </span>
                <button
                  onClick={() => signOut()}
                  className="btn-ghost flex items-center gap-1.5 px-3 py-1.5"
                  style={{ fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <LogOut size={13} />
                  Sign out
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

      {/* Hero Section */}
      <main
        className="flex-1 flex flex-col items-center justify-center text-center px-6"
        style={{ paddingTop: '80px', paddingBottom: '60px', position: 'relative', zIndex: 1 }}
      >
        {/* <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 'var(--radius-full)',
          background: 'var(--color-accent-subtle)',
          border: '1px solid var(--color-accent-light)',
          fontSize: '0.78rem', fontWeight: 700,
          color: 'var(--color-accent)',
          marginBottom: 24, letterSpacing: '0.04em',
          fontFamily: 'var(--font-sans)',
        }}>
          <Zap size={12} />
          Powered by Qiskit Aer + Google Gemini
        </div> */}

        <h1
          className="font-bold tracking-tight"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(48px, 6vw, 76px)',
            fontWeight: 700,
            color: 'var(--color-text)',
            lineHeight: 1.1,
            marginBottom: '18px',
          }}
        >
          QubitEdge
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(16px, 2vw, 22px)',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            marginBottom: '36px',
            maxWidth: '560px',
            lineHeight: 1.6,
          }}
        >
          The interactive quantum learning platform — simulate real circuits, get AI-powered hints, and master quantum computing step by step.
        </p>

        <div className="flex items-center gap-4" style={{ marginBottom: 80 }}>
          <Link
            href="/learn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 32px',
              background: 'var(--color-accent)', color: 'var(--color-text-inv)',
              border: 'none', borderRadius: '8px',
              fontSize: '1rem', fontWeight: 700,
              fontFamily: 'var(--font-sans)', textDecoration: 'none',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
          >
            <BookOpen size={16} />
            Start Learning
          </Link>

          <Link
            href="/build"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 32px',
              background: 'transparent', color: 'var(--color-accent)',
              border: '2px solid var(--color-accent-light)', borderRadius: '8px',
              fontSize: '1rem', fontWeight: 700,
              fontFamily: 'var(--font-sans)', textDecoration: 'none',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-subtle)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-accent-light)'; }}
          >
            <Cpu size={16} />
            Open Playground
          </Link>
        </div>

        {/* Feature cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 20, maxWidth: 900, width: '100%',
        }}>
          {[
            {
              icon: <BookOpen size={22} style={{ color: 'var(--color-accent)' }} />,
              title: 'Structured Curriculum',
              desc: '6 guided modules from superposition to quantum algorithms, with theory, activities, and assessments.',
              href: '/learn',
            },
            {
              icon: <Cpu size={22} style={{ color: 'var(--color-accent)' }} />,
              title: 'Live Circuit Simulator',
              desc: 'Drag-and-drop visual composer or Python code editor — powered by Qiskit Aer for real quantum math.',
              href: '/build',
            },
            {
              icon: <Zap size={22} style={{ color: 'var(--color-accent)' }} />,
              title: 'AI Socratic Tutor',
              desc: 'Get contextual hints from a Gemini-powered tutor that understands your active circuit and guides you without giving answers away.',
              href: '/build',
            },
          ].map(card => (
            <Link key={card.title} href={card.href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                textAlign: 'left', padding: '22px 24px',
                cursor: 'pointer', height: '100%',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: 'var(--color-accent-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  {card.icon}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 700,
                  color: 'var(--color-text)', marginBottom: 8,
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
                  color: 'var(--color-text-muted)', lineHeight: 1.6,
                }}>
                  {card.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '20px',
        borderTop: '1px solid var(--color-border)',
        fontSize: '0.78rem', color: 'var(--color-text-subtle)',
        fontFamily: 'var(--font-sans)', position: 'relative', zIndex: 1,
      }}>
        QubitEdge — Built by Ayush Sharma · Powered by Next.js, FastAPI & Qiskit
      </footer>
    </div>
  );
}
