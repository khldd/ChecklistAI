import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ChecklistItem } from './types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format checklist item reference for display
 * @param checklistName - Name of the checklist (e.g., "A" or "B")
 * @param item - The checklist item
 * @returns Formatted reference string (e.g., "A › Section B › Item 3")
 */
export function formatItemReference(checklistName: string, item: ChecklistItem): string {
  // Extract section name (remove any leading letter if present)
  const sectionName = item.section || 'General';

  // Extract item number from ID if possible
  // IDs might be like "a.le-contrat-de-licence" or "item_1" or similar
  const itemNumber = extractItemNumber(item.id);

  return `Checklist ${checklistName} › ${sectionName}${itemNumber ? ` › Item ${itemNumber}` : ''}`;
}

/**
 * Extract item number from item ID
 * @param itemId - The item ID
 * @returns Item number if found, empty string otherwise
 */
function extractItemNumber(itemId: string): string {
  // Try to extract number from various ID formats
  // e.g., "item_1" -> "1", "a.1" -> "1", "section_3_item_5" -> "5"

  // Pattern 1: item_NUMBER
  const itemPattern = /item[_-](\d+)/i;
  const itemMatch = itemId.match(itemPattern);
  if (itemMatch) return itemMatch[1];

  // Pattern 2: Last number in the ID
  const numberPattern = /(\d+)(?!.*\d)/;
  const numberMatch = itemId.match(numberPattern);
  if (numberMatch) return numberMatch[1];

  // If no number found, return empty string
  return '';
}
