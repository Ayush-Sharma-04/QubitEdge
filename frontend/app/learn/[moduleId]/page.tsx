'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  BookOpen, Zap, ClipboardCheck, ArrowLeft, ArrowRight,
  CheckCircle2, Lock, LogOut, User, ChevronRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Module content data
// ---------------------------------------------------------------------------

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ModuleData {
  id: number;
  title: string;
  duration: string;
  theory: {
    sections: { heading: string; body: string }[];
  };
  activity: {
    description: string;
    hints: string[];
    gateSequence: string;
  };
  assessment: QuizQuestion[];
}

const MODULES: Record<number, ModuleData> = {
  1: {
    id: 1,
    title: 'Introduction to Quantum Computing',
    duration: '15 min',
    theory: {
      sections: [
        {
          heading: 'What is Quantum Computing?',
          body: `Classical computers store information as bits — each bit is either 0 or 1. Quantum computers use quantum bits, or **qubits**, which exploit quantum mechanical phenomena to process information in fundamentally new ways.\n\nWhereas a classical bit must be one thing at a time, a qubit can exist in a **superposition** — a combination of 0 and 1 simultaneously — until it is measured.`,
        },
        {
          heading: 'Why Does It Matter?',
          body: `Quantum computers are not universally faster than classical computers. Their advantage lies in specific problem types: cryptography, molecular simulation, optimization, and machine learning.\n\nFor example, Shor's algorithm can factor large integers exponentially faster than any known classical algorithm — threatening current encryption schemes and driving research into post-quantum cryptography.`,
        },
        {
          heading: 'Real-World Applications',
          body: `Drug discovery companies use quantum simulation to model molecular interactions at quantum accuracy. Financial firms explore quantum optimization for portfolio management. Google's Sycamore processor achieved a computation in 200 seconds that would take a classical supercomputer ~10,000 years.`,
        },
      ],
    },
    activity: {
      description: 'Navigate to the Build playground and create a single-qubit circuit. Place an H gate on qubit 0 and run the simulation. Observe that the measurement outcomes split roughly 50/50 between |0⟩ and |1⟩ — this is superposition!',
      hints: [
        'Drag the H gate from the palette onto qubit 0.',
        'Click "Run Simulation" and examine the histogram.',
        'The equal split confirms the qubit was in superposition before measurement.',
      ],
      gateSequence: 'H(q0)',
    },
    assessment: [
      {
        id: 1,
        question: 'What is the fundamental unit of information in a quantum computer?',
        options: ['Bit', 'Byte', 'Qubit', 'Nit'],
        correctIndex: 2,
        explanation: 'A qubit (quantum bit) is the fundamental unit of quantum information, capable of existing in superposition of 0 and 1.',
      },
      {
        id: 2,
        question: 'Which property allows a qubit to be 0 and 1 at the same time?',
        options: ['Entanglement', 'Superposition', 'Interference', 'Decoherence'],
        correctIndex: 1,
        explanation: 'Superposition allows a qubit to exist in a linear combination of |0⟩ and |1⟩ until measurement forces it into one definite state.',
      },
      {
        id: 3,
        question: "Shor's algorithm threatens which technology?",
        options: ['Quantum error correction', 'RSA encryption', 'Neural networks', 'GPS systems'],
        correctIndex: 1,
        explanation: "Shor's algorithm can factor large integers exponentially faster than classical methods, breaking RSA and similar public-key cryptosystems.",
      },
    ],
  },
  2: {
    id: 2,
    title: 'Superposition & the Hadamard Gate',
    duration: '20 min',
    theory: {
      sections: [
        {
          heading: 'The Bloch Sphere',
          body: `The state of a single qubit can be visualised as a point on the surface of a unit sphere — the **Bloch sphere**. The north pole represents |0⟩, the south pole |1⟩, and every point on the equator represents an equal superposition.\n\nMathematically, any single-qubit state is |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩ where θ is the polar angle and φ is the azimuthal angle.`,
        },
        {
          heading: 'The Hadamard Gate',
          body: `The **Hadamard gate (H)** is the most fundamental single-qubit gate. It maps:\n\n• |0⟩ → (|0⟩ + |1⟩) / √2  (the |+⟩ state)\n• |1⟩ → (|0⟩ − |1⟩) / √2  (the |−⟩ state)\n\nThis rotation takes the qubit from a pole of the Bloch sphere to its equator, creating a perfect 50/50 superposition.`,
        },
        {
          heading: 'Measurement Collapse',
          body: `When a qubit in superposition is measured, the superposition **collapses** to either |0⟩ or |1⟩ with probabilities determined by the amplitudes. This is non-deterministic — repeat measurements of identically-prepared qubits will produce different outcomes, obeying the Born rule: P(0) = |α|², P(1) = |β|² where α, β are the amplitudes.`,
        },
      ],
    },
    activity: {
      description: 'Build a 2-qubit circuit. Apply H to qubit 0. Notice how the results show ~50% |00⟩ and ~50% |10⟩ — only qubit 0 is in superposition while qubit 1 remains in |0⟩.',
      hints: [
        'Set number of qubits to 2.',
        'Place H on qubit 0 only.',
        'Run and observe: the first bit fluctuates, the second stays 0.',
      ],
      gateSequence: 'H(q0) → Measure',
    },
    assessment: [
      {
        id: 1,
        question: 'What does the Hadamard gate do to the |0⟩ state?',
        options: ['Leaves it unchanged', 'Flips it to |1⟩', 'Creates an equal superposition', 'Adds a phase of π'],
        correctIndex: 2,
        explanation: 'H|0⟩ = (|0⟩ + |1⟩)/√2, placing the qubit in equal superposition on the Bloch sphere equator.',
      },
      {
        id: 2,
        question: 'Where does |0⟩ sit on the Bloch sphere?',
        options: ['South pole', 'Equator', 'North pole', 'Origin'],
        correctIndex: 2,
        explanation: 'By convention, |0⟩ is represented at the north pole and |1⟩ at the south pole of the Bloch sphere.',
      },
      {
        id: 3,
        question: 'If a qubit has amplitude α for |0⟩, what is the probability of measuring 0?',
        options: ['α', '2α', '|α|²', '√α'],
        correctIndex: 2,
        explanation: 'The Born rule states that the probability of measuring outcome 0 is |α|², the squared magnitude of its amplitude.',
      },
    ],
  },
  3: {
    id: 3,
    title: 'Quantum Entanglement',
    duration: '25 min',
    theory: {
      sections: [
        {
          heading: 'What is Entanglement?',
          body: `When two qubits are **entangled**, the state of one cannot be described independently of the other, regardless of the physical distance between them. Measuring one qubit instantly determines the state of its partner — what Einstein called "spooky action at a distance."\n\nThis is not faster-than-light communication; the correlations are established during entanglement creation and revealed only upon classical comparison.`,
        },
        {
          heading: 'Bell States',
          body: `The **Bell states** are the four maximally entangled two-qubit states. The most common — |Φ+⟩ — is:\n\n|Φ+⟩ = (|00⟩ + |11⟩) / √2\n\nThis means measuring qubit 0 as 0 guarantees qubit 1 is also 0, and vice versa. They are created by applying H to the control qubit followed by a CNOT gate.`,
        },
        {
          heading: 'The CNOT Gate',
          body: `The **Controlled-NOT (CNOT)** gate flips the target qubit if and only if the control qubit is |1⟩. It is the primary two-qubit entangling gate. Combined with H:\n\n1. H(q0) creates superposition: (|0⟩ + |1⟩)/√2 ⊗ |0⟩\n2. CNOT(q0→q1) correlates them: (|00⟩ + |11⟩)/√2`,
        },
      ],
    },
    activity: {
      description: 'Create a Bell state! Apply H to qubit 0, then add a CNOT with qubit 0 as control and qubit 1 as target. Run the simulation and verify that only |00⟩ and |11⟩ appear — never |01⟩ or |10⟩.',
      hints: [
        'Set 2 qubits, place H on qubit 0.',
        'Drag CNOT and set control=0, target=1.',
        'Run: you should see ~50% |00⟩ and ~50% |11⟩.',
        'No |01⟩ or |10⟩ confirms entanglement!',
      ],
      gateSequence: 'H(q0) → CNOT(ctrl=0, tgt=1)',
    },
    assessment: [
      {
        id: 1,
        question: 'What gate combination creates a Bell state from |00⟩?',
        options: ['X then CNOT', 'H then CNOT', 'CNOT then H', 'H then X'],
        correctIndex: 1,
        explanation: 'Applying H to the control qubit creates superposition, then CNOT entangles the two qubits, producing the Bell state (|00⟩+|11⟩)/√2.',
      },
      {
        id: 2,
        question: 'In the Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2, if qubit 0 is measured as 1, what is qubit 1?',
        options: ['0', '1', 'Unknown', 'Superposition'],
        correctIndex: 1,
        explanation: 'Due to entanglement, the qubits are perfectly correlated. Measuring qubit 0 as 1 collapses the state to |11⟩, so qubit 1 is also 1.',
      },
      {
        id: 3,
        question: 'What does the CNOT gate do?',
        options: [
          'Always flips the target',
          'Flips the target only if the control is |1⟩',
          'Puts the control into superposition',
          'Measures both qubits',
        ],
        correctIndex: 1,
        explanation: 'CNOT (Controlled-NOT) flips the target qubit if and only if the control qubit is in state |1⟩.',
      },
    ],
  },
};

// Fallback for modules 4-6
const PLACEHOLDER_MODULE = (id: number): ModuleData => ({
  id,
  title: ['', '', '', 'Quantum Algorithms', 'Quantum Error Correction', 'Quantum Supremacy & Future'][id] ?? `Module ${id}`,
  duration: '25 min',
  theory: {
    sections: [
      {
        heading: 'Coming Soon',
        body: `This module is currently being developed by the QubitEdge curriculum team. Check back soon for in-depth content on this exciting topic!`,
      },
    ],
  },
  activity: {
    description: 'This module\'s activity is under construction. Visit the Build playground to experiment freely in the meantime.',
    hints: ['Navigate to /build and experiment with what you\'ve learned so far.'],
    gateSequence: 'To be defined',
  },
  assessment: [
    {
      id: 1,
      question: 'This module is under construction. Which platform section can you use to experiment freely?',
      options: ['/learn', '/build', '/profile', '/docs'],
      correctIndex: 1,
      explanation: 'The /build playground lets you experiment with any circuit without restrictions.',
    },
  ],
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Section = 'theory' | 'activity' | 'assessment';

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  const moduleId = Number(params?.moduleId);
  const moduleData = MODULES[moduleId] ?? PLACEHOLDER_MODULE(moduleId);

  const [activeSection, setActiveSection] = useState<Section>('theory');
  const [theoryRead, setTheoryRead]       = useState(false);
  const [activityDone, setActivityDone]   = useState(false);

  // Assessment state
  const [answers, setAnswers]     = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore]         = useState<number | null>(null);

  // Redirect unauthenticated users back to /learn
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/learn');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
          <Lock size={32} style={{ color: 'var(--color-accent)', margin: '0 auto 12px' }} />
          <p>Checking authentication…</p>
        </div>
      </div>
    );
  }

  const handleAssessmentSubmit = () => {
    const total = moduleData.assessment.length;
    const correct = moduleData.assessment.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correctIndex ? 1 : 0);
    }, 0);
    setScore(Math.round((correct / total) * 100));
    setSubmitted(true);
    setActivityDone(true);
  };

  const sections: { key: Section; label: string; icon: React.ReactNode; locked: boolean }[] = [
    { key: 'theory', label: 'Theory', icon: <BookOpen size={15} />, locked: false },
    { key: 'activity', label: 'Activity', icon: <Zap size={15} />, locked: false },
    { key: 'assessment', label: 'Assessment', icon: <ClipboardCheck size={15} />, locked: !theoryRead },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-bg)' }}>

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
          <Link href="/learn" className="navbar-link">Curriculum</Link>
          <Link href="/build" className="navbar-link">Build</Link>
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
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        padding: '10px 32px',
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: '0.8rem', color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-sans)',
      }}>
        <Link href="/learn" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={13} />
          Curriculum
        </Link>
        <ChevronRight size={12} />
        <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>Module {moduleData.id}: {moduleData.title}</span>
      </div>

      <div style={{ display: 'flex', flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '32px 24px', gap: 32 }}>

        {/* Left sidebar: progress steps */}
        <aside style={{ width: 220, flexShrink: 0 }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12, overflow: 'hidden',
            position: 'sticky', top: 80,
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Module {moduleData.id}
              </p>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
                {moduleData.title}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: 4 }}>
                ⏱ {moduleData.duration}
              </p>
            </div>

            <nav style={{ padding: '8px 0' }}>
              {sections.map((s, idx) => (
                <button
                  key={s.key}
                  onClick={() => { if (!s.locked) setActiveSection(s.key); }}
                  disabled={s.locked}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 20px',
                    background: activeSection === s.key ? 'var(--color-accent-subtle)' : 'none',
                    border: 'none', borderLeft: activeSection === s.key ? '3px solid var(--color-accent)' : '3px solid transparent',
                    cursor: s.locked ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    opacity: s.locked ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ color: activeSection === s.key ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                    {s.locked ? <Lock size={15} /> : s.icon}
                  </span>
                  <span style={{
                    fontSize: '0.875rem', fontWeight: 600,
                    color: activeSection === s.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  }}>
                    {idx + 1}. {s.label}
                  </span>
                  {s.key === 'theory' && theoryRead && <CheckCircle2 size={13} style={{ color: 'var(--color-success)', marginLeft: 'auto' }} />}
                  {s.key === 'activity' && activityDone && <CheckCircle2 size={13} style={{ color: 'var(--color-success)', marginLeft: 'auto' }} />}
                  {s.key === 'assessment' && submitted && score !== null && (
                    <span style={{
                      marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700,
                      color: score >= 70 ? 'var(--color-success)' : 'var(--color-error)',
                    }}>
                      {score}%
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* ── Theory ── */}
          {activeSection === 'theory' && (
            <div>
              <h1 style={{
                fontFamily: 'var(--font-sans)', fontSize: '1.75rem', fontWeight: 700,
                color: 'var(--color-text)', marginBottom: 24,
              }}>
                {moduleData.title}
              </h1>

              {moduleData.theory.sections.map((sec, idx) => (
                <div key={idx} style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12, padding: '24px 28px',
                  marginBottom: 16,
                }}>
                  <h2 style={{
                    fontFamily: 'var(--font-sans)', fontSize: '1.1rem', fontWeight: 700,
                    color: 'var(--color-text)', marginBottom: 14,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'var(--color-accent-subtle)',
                      border: '1px solid var(--color-accent-light)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', flexShrink: 0,
                    }}>
                      {idx + 1}
                    </span>
                    {sec.heading}
                  </h2>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
                    color: 'var(--color-text-muted)', lineHeight: 1.75,
                    whiteSpace: 'pre-line',
                  }}>
                    {sec.body}
                  </div>
                </div>
              ))}

              <button
                onClick={() => { setTheoryRead(true); setActiveSection('activity'); }}
                style={{
                  marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '11px 28px',
                  background: 'var(--color-accent)', color: 'var(--color-text-inv)',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
              >
                <span>Continue to Activity</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── Activity ── */}
          {activeSection === 'activity' && (
            <div>
              <h1 style={{
                fontFamily: 'var(--font-sans)', fontSize: '1.5rem', fontWeight: 700,
                color: 'var(--color-text)', marginBottom: 8,
              }}>
                Interactive Activity
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 24 }}>
                Apply what you learned in the theory section with a guided hands-on task.
              </p>

              {/* Task card */}
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 12, padding: '24px 28px',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Zap size={18} style={{ color: 'var(--color-accent)' }} />
                  <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    Your Task
                  </h2>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
                  {moduleData.activity.description}
                </p>

                {/* Gate sequence */}
                <div style={{
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                  fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                  color: 'var(--color-accent)', letterSpacing: '0.02em',
                }}>
                  {moduleData.activity.gateSequence}
                </div>

                {/* Hints */}
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    💡 Hints
                  </p>
                  <ol style={{ paddingLeft: 18 }}>
                    {moduleData.activity.hints.map((h, i) => (
                      <li key={i} style={{
                        fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
                        color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 4,
                      }}>
                        {h}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Open playground CTA */}
              <Link
                href="/build"
                target="_blank"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px',
                  background: 'var(--color-accent)', color: 'var(--color-text-inv)',
                  borderRadius: 8, textDecoration: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 700,
                  marginBottom: 24,
                }}
              >
                Open Build Playground ↗
              </Link>

              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => { setActivityDone(true); setActiveSection('assessment'); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '11px 28px',
                    background: 'var(--color-accent)', color: 'var(--color-text-inv)',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700,
                  }}
                >
                  <span>I&#39;ve completed the activity → Assessment</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Assessment ── */}
          {activeSection === 'assessment' && (
            <div>
              <h1 style={{
                fontFamily: 'var(--font-sans)', fontSize: '1.5rem', fontWeight: 700,
                color: 'var(--color-text)', marginBottom: 8,
              }}>
                Assessment
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 24 }}>
                {submitted
                  ? `You scored ${score}% on this assessment.`
                  : 'Answer all questions to prove your mastery before unlocking the next module.'}
              </p>

              {submitted && score !== null && (
                <div style={{
                  padding: '16px 20px', borderRadius: 10, marginBottom: 24,
                  background: score >= 70 ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                  border: `1px solid ${score >= 70 ? 'var(--color-success-border)' : 'var(--color-error-border)'}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <CheckCircle2 size={22} style={{ color: score >= 70 ? 'var(--color-success)' : 'var(--color-error)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 700, color: score >= 70 ? 'var(--color-success)' : 'var(--color-error)', marginBottom: 2 }}>
                      {score >= 70 ? `🎉 Passed! Score: ${score}%` : `Score: ${score}% — Review and try again`}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {score >= 70 ? 'You\'ve mastered this module. Next module is now unlocked.' : 'Review the Theory section and reattempt.'}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {moduleData.assessment.map((q) => (
                  <div key={q.id} style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12, padding: '20px 24px',
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 600,
                      color: 'var(--color-text)', marginBottom: 14,
                    }}>
                      {q.id}. {q.question}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt, oi) => {
                        const isSelected  = answers[q.id] === oi;
                        const isCorrect   = oi === q.correctIndex;
                        const showResult  = submitted;

                        let borderColor = 'var(--color-border)';
                        let bgColor     = 'var(--color-bg)';
                        let textColor   = 'var(--color-text-muted)';

                        if (showResult && isCorrect) {
                          borderColor = 'var(--color-success-border)';
                          bgColor     = 'var(--color-success-bg)';
                          textColor   = 'var(--color-success)';
                        } else if (showResult && isSelected && !isCorrect) {
                          borderColor = 'var(--color-error-border)';
                          bgColor     = 'var(--color-error-bg)';
                          textColor   = 'var(--color-error)';
                        } else if (!showResult && isSelected) {
                          borderColor = 'var(--color-accent-light)';
                          bgColor     = 'var(--color-accent-subtle)';
                          textColor   = 'var(--color-accent)';
                        }

                        return (
                          <button
                            key={oi}
                            onClick={() => { if (!submitted) setAnswers(prev => ({ ...prev, [q.id]: oi })); }}
                            disabled={submitted}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 14px',
                              background: bgColor, border: `1px solid ${borderColor}`,
                              borderRadius: 8, cursor: submitted ? 'default' : 'pointer',
                              textAlign: 'left', transition: 'all 0.12s',
                              fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
                              color: textColor, fontWeight: isSelected || (showResult && isCorrect) ? 600 : 400,
                            }}
                          >
                            <span style={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              border: `2px solid ${borderColor}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 700, color: textColor,
                            }}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation shown after submission */}
                    {submitted && (
                      <div style={{
                        marginTop: 12, padding: '10px 14px',
                        background: 'var(--color-accent-subtle)',
                        border: '1px solid var(--color-accent-light)',
                        borderRadius: 8, fontSize: '0.82rem',
                        color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)',
                      }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!submitted ? (
                <button
                  onClick={handleAssessmentSubmit}
                  disabled={Object.keys(answers).length < moduleData.assessment.length}
                  style={{
                    marginTop: 20,
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '11px 28px',
                    background: Object.keys(answers).length < moduleData.assessment.length
                      ? 'var(--color-border-dark)' : 'var(--color-accent)',
                    color: 'var(--color-text-inv)',
                    border: 'none', borderRadius: 8,
                    cursor: Object.keys(answers).length < moduleData.assessment.length ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700,
                  }}
                >
                  <ClipboardCheck size={16} />
                  Submit Assessment
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  {score !== null && score < 70 && (
                    <button
                      onClick={() => { setSubmitted(false); setAnswers({}); setScore(null); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '11px 24px',
                        background: 'var(--color-surface)', color: 'var(--color-text)',
                        border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer',
                        fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600,
                      }}
                    >
                      Retry
                    </button>
                  )}
                  {score !== null && score >= 70 && moduleId < 6 && (
                    <Link
                      href={`/learn/${moduleId + 1}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '11px 28px',
                        background: 'var(--color-accent)', color: 'var(--color-text-inv)',
                        border: 'none', borderRadius: 8,
                        fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <span>Next Module</span>
                      <ArrowRight size={16} />
                    </Link>
                  )}
                  {score !== null && score >= 70 && moduleId >= 6 && (
                    <Link
                      href="/learn"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '11px 28px',
                        background: 'var(--color-success)', color: '#fff',
                        border: 'none', borderRadius: 8,
                        fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      🎓 Curriculum Complete!
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
