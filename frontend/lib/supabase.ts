// lib/supabase.ts — Supabase client instances for QubitEdge
// Uses @supabase/ssr for Next.js-compatible cookie-based auth

import { createBrowserClient } from '@supabase/ssr';

// ---------------------------------------------------------------------------
// Types (minimal — extend as needed)
// ---------------------------------------------------------------------------

export interface SavedCircuit {
  id: string;
  user_id: string;
  name: string;
  payload: unknown;        // CircuitState JSON
  created_at: string;
  updated_at: string;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: number;
  completed_theory: boolean;
  completed_activity: boolean;
  assessment_score: number | null;
  unlocked_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Browser client (singleton pattern)
// ---------------------------------------------------------------------------

let _browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (_browserClient) return _browserClient;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client in dev when env vars aren't set yet.
    // All operations will fail gracefully — auth context handles this.
    console.warn(
      '[QubitEdge] Supabase env vars not set. ' +
      'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
    );
    // Still create with placeholder so TypeScript is satisfied
    _browserClient = createBrowserClient(
      url  ?? 'https://placeholder.supabase.co',
      key  ?? 'placeholder-anon-key'
    );
  } else {
    _browserClient = createBrowserClient(url, key);
  }

  return _browserClient;
}
