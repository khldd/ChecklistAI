import { NextRequest, NextResponse } from 'next/server';
import { generateFusionSuggestions } from '@/lib/fusionEngine';
import { saveFusionSuggestions, getFusionSuggestions } from '@/lib/supabase-server';
import type { Checklist, FusionSuggestionWithDetails } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checklist1, checklist2, options } = body;

    if (!checklist1 || !checklist2) {
      return NextResponse.json(
        { error: 'Both checklists are required' },
        { status: 400 }
      );
    }

    const checklist1Data = checklist1 as Checklist;
    const checklist2Data = checklist2 as Checklist;

    // Check if fusion suggestions already exist
    const existingSuggestions = await getFusionSuggestions(
      checklist1Data.id,
      checklist2Data.id
    );

    if (existingSuggestions.length > 0) {
      // Convert to FusionSuggestionWithDetails format
      const suggestionsWithDetails: FusionSuggestionWithDetails[] = existingSuggestions.map(
        (suggestion) => {
          const item1 = checklist1Data.parsed_content.items.find(
            (item) => item.id === suggestion.item1_id
          );
          const item2 = checklist2Data.parsed_content.items.find(
            (item) => item.id === suggestion.item2_id
          );

          if (!item1 || !item2) {
            throw new Error('Item not found in checklist');
          }

          return {
            ...suggestion,
            sourceItems: {
              item1,
              item2,
            },
          };
        }
      );

      return NextResponse.json({
        suggestions: suggestionsWithDetails,
        cached: true,
      });
    }

    // Generate new fusion suggestions
    const suggestions = await generateFusionSuggestions(
      checklist1Data.parsed_content,
      checklist2Data.parsed_content,
      options
    );

    // Save to database
    const savedSuggestions = await saveFusionSuggestions(
      checklist1Data.id,
      checklist2Data.id,
      suggestions
    );

    // Convert to FusionSuggestionWithDetails format
    const suggestionsWithDetails: FusionSuggestionWithDetails[] = savedSuggestions.map(
      (suggestion) => {
        const item1 = checklist1Data.parsed_content.items.find(
          (item) => item.id === suggestion.item1_id
        );
        const item2 = checklist2Data.parsed_content.items.find(
          (item) => item.id === suggestion.item2_id
        );

        if (!item1 || !item2) {
          throw new Error('Item not found in checklist');
        }

        return {
          ...suggestion,
          sourceItems: {
            item1,
            item2,
          },
        };
      }
    );

    return NextResponse.json({
      suggestions: suggestionsWithDetails,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error in generate-fusions API:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate fusion suggestions',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
