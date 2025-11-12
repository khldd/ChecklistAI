export interface ChecklistItem {
  id: string;
  section: string;
  text: string;
  options?: string[];
  references?: string[];
  category: string;
  metadata?: Record<string, any>;
}

export interface ParsedChecklist {
  items: ChecklistItem[];
  metadata: {
    title?: string;
    version?: string;
    date?: string;
    sections?: string[];
  };
}

export interface Checklist {
  id: string;
  file_hash: string;
  file_name: string;
  parsed_content: ParsedChecklist;
  created_at: string;
  updated_at: string;
}

export interface FusionSuggestion {
  id: string;
  checklist1_id: string;
  checklist2_id: string;
  item1_id: string;
  item2_id: string;
  suggested_text: string;
  similarity_score: number;
  created_at: string;
}

export type FusionStatus = 'accepted' | 'rejected' | 'edited';

export interface AcceptedFusion {
  id: string;
  fusion_suggestion_id: string;
  custom_text: string | null;
  status: FusionStatus;
  accepted_at: string;
}

export interface FusionSuggestionWithDetails extends FusionSuggestion {
  sourceItems: {
    item1: ChecklistItem;
    item2: ChecklistItem;
  };
}
