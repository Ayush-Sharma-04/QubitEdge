// lib/db.ts — Typed Supabase database helpers
// Handles saved_circuits and module_progress operations with RLS enforced server-side

import { getSupabaseBrowserClient } from './supabase';
import type { CircuitState } from './types';
import type { SavedCircuit, ModuleProgress } from './supabase';

// ---------------------------------------------------------------------------
// Saved Circuits
// ---------------------------------------------------------------------------

export async function fetchSavedCircuits(): Promise<SavedCircuit[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('saved_circuits')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SavedCircuit[];
}

export async function saveCircuit(
  name: string,
  circuit: CircuitState
): Promise<SavedCircuit> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('saved_circuits')
    .insert({ name, payload: circuit })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SavedCircuit;
}

export async function updateCircuit(
  id: string,
  name: string,
  circuit: CircuitState
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('saved_circuits')
    .update({ name, payload: circuit, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteCircuit(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('saved_circuits')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Module Progress
// ---------------------------------------------------------------------------

export async function fetchModuleProgress(userId: string): Promise<ModuleProgress[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('module_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return (data ?? []) as ModuleProgress[];
}

export async function upsertModuleProgress(
  moduleId: number,
  updates: Partial<Omit<ModuleProgress, 'id' | 'user_id' | 'module_id' | 'unlocked_at'>>
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('module_progress')
    .upsert(
      { module_id: moduleId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,module_id' }
    );

  if (error) throw new Error(error.message);
}
