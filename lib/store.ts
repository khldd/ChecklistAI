import { create } from 'zustand';
import type {
  Checklist,
  ParsedChecklist,
  FusionSuggestion,
  FusionSuggestionWithDetails,
  ChecklistItem,
  FusionStatus,
} from './types/database';

interface FusionDecision {
  suggestionId: string;
  status: FusionStatus;
  customText?: string;
}

interface AppState {
  // Checklists
  checklist1: Checklist | null;
  checklist2: Checklist | null;
  checklist1Loading: boolean;
  checklist2Loading: boolean;
  checklist1Error: string | null;
  checklist2Error: string | null;

  // Original PDF files for preview
  pdfFile1: File | null;
  pdfFile2: File | null;

  // Fusion suggestions
  fusionSuggestions: FusionSuggestionWithDetails[];
  fusionSuggestionsLoading: boolean;
  fusionSuggestionsError: string | null;

  // User decisions
  fusionDecisions: Map<string, FusionDecision>;

  // Generated fused checklist
  fusedChecklist: ParsedChecklist | null;

  // Actions
  setChecklist1: (checklist: Checklist | null) => void;
  setChecklist2: (checklist: Checklist | null) => void;
  setChecklist1Loading: (loading: boolean) => void;
  setChecklist2Loading: (loading: boolean) => void;
  setChecklist1Error: (error: string | null) => void;
  setChecklist2Error: (error: string | null) => void;

  setPdfFile1: (file: File | null) => void;
  setPdfFile2: (file: File | null) => void;

  setFusionSuggestions: (suggestions: FusionSuggestionWithDetails[]) => void;
  setFusionSuggestionsLoading: (loading: boolean) => void;
  setFusionSuggestionsError: (error: string | null) => void;

  acceptFusion: (suggestionId: string) => void;
  rejectFusion: (suggestionId: string) => void;
  editFusion: (suggestionId: string, customText: string) => void;
  clearFusionDecision: (suggestionId: string) => void;

  generateFusedChecklist: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  checklist1: null,
  checklist2: null,
  checklist1Loading: false,
  checklist2Loading: false,
  checklist1Error: null,
  checklist2Error: null,

  pdfFile1: null,
  pdfFile2: null,

  fusionSuggestions: [],
  fusionSuggestionsLoading: false,
  fusionSuggestionsError: null,

  fusionDecisions: new Map(),
  fusedChecklist: null,

  // Actions
  setChecklist1: (checklist) => set({ checklist1: checklist }),
  setChecklist2: (checklist) => set({ checklist2: checklist }),
  setChecklist1Loading: (loading) => set({ checklist1Loading: loading }),
  setChecklist2Loading: (loading) => set({ checklist2Loading: loading }),
  setChecklist1Error: (error) => set({ checklist1Error: error }),
  setChecklist2Error: (error) => set({ checklist2Error: error }),

  setPdfFile1: (file) => set({ pdfFile1: file }),
  setPdfFile2: (file) => set({ pdfFile2: file }),

  setFusionSuggestions: (suggestions) => set({ fusionSuggestions: suggestions }),
  setFusionSuggestionsLoading: (loading) => set({ fusionSuggestionsLoading: loading }),
  setFusionSuggestionsError: (error) => set({ fusionSuggestionsError: error }),

  acceptFusion: (suggestionId) => {
    const decisions = new Map(get().fusionDecisions);
    decisions.set(suggestionId, { suggestionId, status: 'accepted' });
    set({ fusionDecisions: decisions });
  },

  rejectFusion: (suggestionId) => {
    const decisions = new Map(get().fusionDecisions);
    decisions.set(suggestionId, { suggestionId, status: 'rejected' });
    set({ fusionDecisions: decisions });
  },

  editFusion: (suggestionId, customText) => {
    const decisions = new Map(get().fusionDecisions);
    decisions.set(suggestionId, {
      suggestionId,
      status: 'edited',
      customText,
    });
    set({ fusionDecisions: decisions });
  },

  clearFusionDecision: (suggestionId) => {
    const decisions = new Map(get().fusionDecisions);
    decisions.delete(suggestionId);
    set({ fusionDecisions: decisions });
  },

  generateFusedChecklist: () => {
    const state = get();
    const { checklist1, checklist2, fusionSuggestions, fusionDecisions } = state;

    if (!checklist1 || !checklist2) {
      console.error('Both checklists must be uploaded');
      return;
    }

    // Collect all accepted/edited fusion items
    const fusedItemIds = new Set<string>();
    const fusedItems: ChecklistItem[] = [];

    fusionSuggestions.forEach((suggestion) => {
      const decision = fusionDecisions.get(suggestion.id);

      if (decision && (decision.status === 'accepted' || decision.status === 'edited')) {
        fusedItemIds.add(suggestion.item1_id);
        fusedItemIds.add(suggestion.item2_id);

        fusedItems.push({
          id: `fused_${suggestion.id}`,
          section: suggestion.sourceItems.item1.section,
          text: decision.customText || suggestion.suggested_text,
          references: [
            ...(suggestion.sourceItems.item1.references || []),
            ...(suggestion.sourceItems.item2.references || []),
          ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
          category: suggestion.sourceItems.item1.category,
          metadata: {
            fusedFrom: [suggestion.item1_id, suggestion.item2_id],
            originalTexts: {
              item1: suggestion.sourceItems.item1.text,
              item2: suggestion.sourceItems.item2.text,
            },
          },
        });
      }
    });

    // Add non-fused items from both checklists
    const allItems = [...fusedItems];

    checklist1.parsed_content.items.forEach((item) => {
      if (!fusedItemIds.has(item.id)) {
        allItems.push({
          ...item,
          metadata: {
            ...item.metadata,
            sourceChecklist: 'checklist1',
          },
        });
      }
    });

    checklist2.parsed_content.items.forEach((item) => {
      if (!fusedItemIds.has(item.id)) {
        allItems.push({
          ...item,
          metadata: {
            ...item.metadata,
            sourceChecklist: 'checklist2',
          },
        });
      }
    });

    // Sort items by section
    allItems.sort((a, b) => {
      if (a.section < b.section) return -1;
      if (a.section > b.section) return 1;
      return 0;
    });

    const fusedChecklist: ParsedChecklist = {
      items: allItems,
      metadata: {
        title: 'Fused Checklist',
        version: 'v1.0',
        date: new Date().toISOString().split('T')[0],
        sections: Array.from(new Set(allItems.map((item) => item.section))),
      },
    };

    set({ fusedChecklist });
  },

  reset: () => {
    set({
      checklist1: null,
      checklist2: null,
      checklist1Loading: false,
      checklist2Loading: false,
      checklist1Error: null,
      checklist2Error: null,
      pdfFile1: null,
      pdfFile2: null,
      fusionSuggestions: [],
      fusionSuggestionsLoading: false,
      fusionSuggestionsError: null,
      fusionDecisions: new Map(),
      fusedChecklist: null,
    });
  },
}));
