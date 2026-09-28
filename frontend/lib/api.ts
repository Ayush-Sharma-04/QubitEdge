// API client — fetch wrappers for backend endpoints

import type {
  SimulateRequest,
  SimulateResponse,
  ChatRequest,
  ChatResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data.detail ?? data.error ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function simulateCircuit(
  request: SimulateRequest
): Promise<SimulateResponse> {
  return post<SimulateResponse>('/api/simulate', request);
}

export async function chatWithTutor(
  request: ChatRequest
): Promise<ChatResponse> {
  return post<ChatResponse>('/api/ai/chat', request);
}

export async function checkHealth(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend unreachable');
  return res.json();
}
