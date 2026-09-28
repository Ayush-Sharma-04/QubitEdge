'use client';

// components/auth/AuthModal.tsx — Sign-in / Sign-up modal
// Triggered whenever a guest tries to access a protected feature

import { useState, useEffect, useRef } from 'react';
import { X, LogIn, UserPlus, Loader2, Eye, EyeOff, Atom } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt?: string;
}

type Tab = 'signin' | 'signup';

export default function AuthModal({ isOpen, onClose, prompt }: AuthModalProps) {
  const { signIn, signUp } = useAuth();

  const [tab, setTab]           = useState<Tab>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError(null);
      setSuccess(null);
      setIsSubmitting(false);
      setTimeout(() => emailRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsSubmitting(true);

    if (tab === 'signin') {
      const err = await signIn(email, password);
      if (err) {
        setError(err.message);
        setIsSubmitting(false);
      } else {
        onClose();
      }
    } else {
      const err = await signUp(email, password);
      if (err) {
        setError(err.message);
        setIsSubmitting(false);
      } else {
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(15, 10, 30, 0.60)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Authentication"
        style={{
          position: 'fixed', inset: 0, zIndex: 901,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            width: '100%', maxWidth: 420,
            padding: '32px',
            position: 'relative',
            animation: 'slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none',
              color: 'var(--color-text-muted)', cursor: 'pointer',
              padding: 4, borderRadius: 6, lineHeight: 0,
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--color-accent-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <Atom size={24} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.25rem', fontWeight: 700,
              color: 'var(--color-text)', marginBottom: 6,
            }}>
              {tab === 'signin' ? 'Welcome back' : 'Join QubitEdge'}
            </h2>
            {prompt && (
              <p style={{
                fontSize: '0.82rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
                background: 'var(--color-accent-subtle)',
                borderRadius: 8, padding: '8px 12px',
                border: '1px solid var(--color-accent-light)',
              }}>
                {prompt}
              </p>
            )}
          </div>

          {/* Tab toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--color-bg)',
            borderRadius: 10, padding: 3,
            marginBottom: 24, gap: 2,
          }}>
            {(['signin', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                style={{
                  flex: 1, padding: '8px 0',
                  borderRadius: 8, border: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem', fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: tab === t ? 'var(--color-surface)' : 'transparent',
                  color: tab === t ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{
                fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)',
              }}>
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8, outline: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{
                fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 40px 10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8, outline: 'none',
                    fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'var(--color-text-muted)', cursor: 'pointer', lineHeight: 0,
                  }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div style={{
                padding: '9px 12px', borderRadius: 8,
                background: 'var(--color-error-bg)',
                border: '1px solid var(--color-error-border)',
                fontSize: '0.82rem', color: 'var(--color-error)',
                fontFamily: 'var(--font-sans)',
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{
                padding: '9px 12px', borderRadius: 8,
                background: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                fontSize: '0.82rem', color: 'var(--color-success)',
                fontFamily: 'var(--font-sans)',
              }}>
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 4,
                padding: '11px 0',
                background: isSubmitting ? 'var(--color-border-dark)' : 'var(--color-accent)',
                color: 'var(--color-text-inv)',
                border: 'none', borderRadius: 8, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--color-accent-hover)'; }}
              onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--color-accent)'; }}
            >
              {isSubmitting ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : tab === 'signin' ? (
                <><LogIn size={16} /><span>Sign In</span></>
              ) : (
                <><UserPlus size={16} /><span>Create Account</span></>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p style={{
            marginTop: 20, textAlign: 'center',
            fontSize: '0.78rem', color: 'var(--color-text-subtle)',
            fontFamily: 'var(--font-sans)',
          }}>
            {tab === 'signin' ? (
              <>No account? <button onClick={() => { setTab('signup'); setError(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>
                Sign up free
              </button></>
            ) : (
              <>Already have an account? <button onClick={() => { setTab('signin'); setError(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>
                Sign in
              </button></>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
