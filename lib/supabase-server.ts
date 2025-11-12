import { createClient } from '@supabase/supabase-js';
import type { Checklist, FusionSuggestion, AcceptedFusion } from './types/database';

// Server-side Supabase client with service role key (bypasses RLS)
// This should ONLY be used in API routes, never on the client side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables are not set. Database operations will fail.');
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey,
    },
  },
});

// Database operations (same as client, but using server client)

/**
 * Check if a checklist with the given file hash exists
 */
export async function checkChecklistExists(fileHash: string): Promise<Checklist | null> {
  const { data, error } = await supabaseServer
    .from('checklists')
    .select('*')
    .eq('file_hash', fileHash)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error checking checklist:', error);
    throw error;
  }

  return data as Checklist | null;
}

/**
 * Save a new checklist to the database
 */
export async function saveChecklist(
  fileHash: string,
  fileName: string,
  parsedContent: any
): Promise<Checklist> {
  const { data, error } = await supabaseServer
    .from('checklists')
    .insert({
      file_hash: fileHash,
      file_name: fileName,
      parsed_content: parsedContent,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving checklist:', error);
    throw error;
  }

  return data as Checklist;
}

/**
 * Save fusion suggestions to the database
 */
export async function saveFusionSuggestions(
  checklist1Id: string,
  checklist2Id: string,
  suggestions: Array<{
    item1_id: string;
    item2_id: string;
    suggested_text: string;
    similarity_score: number;
  }>
): Promise<FusionSuggestion[]> {
  const suggestionsToInsert = suggestions.map(s => ({
    checklist1_id: checklist1Id,
    checklist2_id: checklist2Id,
    item1_id: s.item1_id,
    item2_id: s.item2_id,
    suggested_text: s.suggested_text,
    similarity_score: s.similarity_score,
  }));

  const { data, error } = await supabaseServer
    .from('fusion_suggestions')
    .insert(suggestionsToInsert)
    .select();

  if (error) {
    console.error('Error saving fusion suggestions:', error);
    throw error;
  }

  return data as FusionSuggestion[];
}

/**
 * Get fusion suggestions for two checklists
 */
export async function getFusionSuggestions(
  checklist1Id: string,
  checklist2Id: string
): Promise<FusionSuggestion[]> {
  const { data, error } = await supabaseServer
    .from('fusion_suggestions')
    .select('*')
    .eq('checklist1_id', checklist1Id)
    .eq('checklist2_id', checklist2Id)
    .order('similarity_score', { ascending: false });

  if (error) {
    console.error('Error fetching fusion suggestions:', error);
    throw error;
  }

  return data as FusionSuggestion[];
}

/**
 * Save an accepted fusion decision
 */
export async function saveAcceptedFusion(
  fusionSuggestionId: string,
  status: 'accepted' | 'rejected' | 'edited',
  customText?: string
): Promise<AcceptedFusion> {
  const { data, error } = await supabaseServer
    .from('accepted_fusions')
    .insert({
      fusion_suggestion_id: fusionSuggestionId,
      status,
      custom_text: customText || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving accepted fusion:', error);
    throw error;
  }

  return data as AcceptedFusion;
}

/**
 * Get accepted fusions for fusion suggestions
 */
export async function getAcceptedFusions(
  fusionSuggestionIds: string[]
): Promise<AcceptedFusion[]> {
  const { data, error } = await supabaseServer
    .from('accepted_fusions')
    .select('*')
    .in('fusion_suggestion_id', fusionSuggestionIds);

  if (error) {
    console.error('Error fetching accepted fusions:', error);
    throw error;
  }

  return data as AcceptedFusion[];
}

/**
 * Delete a fusion decision
 */
export async function deleteAcceptedFusion(fusionSuggestionId: string): Promise<void> {
  const { error } = await supabaseServer
    .from('accepted_fusions')
    .delete()
    .eq('fusion_suggestion_id', fusionSuggestionId);

  if (error) {
    console.error('Error deleting accepted fusion:', error);
    throw error;
  }
}
