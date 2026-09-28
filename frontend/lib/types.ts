// Shared TypeScript types for QubitEdge frontend

// ---------------------------------------------------------------------------
// Circuit types
// ---------------------------------------------------------------------------

export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'I' | 'CNOT';

export interface GateOp {
  id: string;          // Unique id for React keys
  type: GateType;
  qubit: number;       // Target qubit index (0–4)
  control?: number;    // Control qubit (CNOT only)
  step: number;        // Column position
}

export interface CircuitState {
  gates: GateOp[];
  numQubits: number;   // 1–5
}

// ---------------------------------------------------------------------------
// Simulation types
// ---------------------------------------------------------------------------

export type SimulationMode = 'visual' | 'code';

export interface SimulateVisualRequest {
  mode: 'visual';
  shots: number;
  gates: Omit<GateOp, 'id'>[];
  num_qubits: number;
}

export interface SimulateCodeRequest {
  mode: 'code';
  shots: number;
  code: string;
}

export type SimulateRequest = SimulateVisualRequest | SimulateCodeRequest;

export interface SimulationResult {
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  statevector: [number, number][] | null;
  /** Per-qubit Bloch vector [x, y, z] */
  bloch_vectors: [number, number, number][] | null;
  /** Circuit unitary matrix — 2D array of [real, imag] pairs */
  unitary: [number, number][][] | null;
  num_qubits: number;
  gate_count: number;
  shots: number;
}

export interface SimulateResponse {
  success: boolean;
  result?: SimulationResult;
  error?: string;
}

// ---------------------------------------------------------------------------
// AI Tutor types
// ---------------------------------------------------------------------------

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
}

export interface TutorContext {
  mode: SimulationMode;
  circuit: CircuitState | string | null;  // JSON (visual) or code string
  results: SimulationResult | null;
}

export interface ChatRequest {
  message: string;
  context?: TutorContext;
  history?: { role: 'user' | 'model'; content: string }[];
}

export interface ChatResponse {
  reply: string;
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Gate palette metadata
// ---------------------------------------------------------------------------

export interface GateMeta {
  type: GateType;
  label: string;
  description: string;
  color: string;        // Tailwind bg class
  textColor: string;    // Tailwind text class
  twoQubit?: boolean;
}

export const GATE_PALETTE: GateMeta[] = [
  { type: 'H',    label: 'H',    description: 'Hadamard — creates superposition',           color: 'bg-blue-100',   textColor: 'text-blue-800' },
  { type: 'X',    label: 'X',    description: 'Pauli-X — quantum NOT gate',                 color: 'bg-red-100',    textColor: 'text-red-800' },
  { type: 'Y',    label: 'Y',    description: 'Pauli-Y — bit + phase flip',                 color: 'bg-orange-100', textColor: 'text-orange-800' },
  { type: 'Z',    label: 'Z',    description: 'Pauli-Z — phase flip',                       color: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { type: 'S',    label: 'S',    description: 'S gate — 90° phase rotation',                color: 'bg-green-100',  textColor: 'text-green-800' },
  { type: 'T',    label: 'T',    description: 'T gate — 45° phase rotation',                color: 'bg-teal-100',   textColor: 'text-teal-800' },
  { type: 'CNOT', label: 'CNOT', description: 'Controlled-NOT — entanglement gate',         color: 'bg-purple-100', textColor: 'text-purple-800', twoQubit: true },
];
