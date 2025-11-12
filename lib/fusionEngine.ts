import OpenAI from 'openai';
import type { ChecklistItem, ParsedChecklist } from './types/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface FusionCandidate {
  item1: ChecklistItem;
  item2: ChecklistItem;
  similarity: number;
  fusedText: string;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get embeddings for checklist items
 */
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error('Error getting embeddings:', error);
    throw error;
  }
}

/**
 * Check if items have matching references
 */
function hasMatchingReferences(item1: ChecklistItem, item2: ChecklistItem): boolean {
  if (!item1.references || !item2.references) return false;

  const refs1 = new Set(item1.references.map(r => r.toLowerCase()));
  const refs2 = new Set(item2.references.map(r => r.toLowerCase()));

  // Convert Set to Array for iteration to avoid TypeScript downlevelIteration issue
  for (const ref of Array.from(refs1)) {
    if (refs2.has(ref)) return true;
  }

  return false;
}

/**
 * Check if items are in the same category
 */
function isSameCategory(item1: ChecklistItem, item2: ChecklistItem): boolean {
  return item1.category.toLowerCase() === item2.category.toLowerCase();
}

/**
 * Find fusion candidates based on similarity
 */
export async function findFusionCandidates(
  checklist1: ParsedChecklist,
  checklist2: ParsedChecklist,
  similarityThreshold: number = 0.7
): Promise<FusionCandidate[]> {
  const items1 = checklist1.items;
  const items2 = checklist2.items;

  // Get embeddings for all items
  const texts1 = items1.map(item => item.text);
  const texts2 = items2.map(item => item.text);

  const embeddings1 = await getEmbeddings(texts1);
  const embeddings2 = await getEmbeddings(texts2);

  const candidates: Array<{
    item1: ChecklistItem;
    item2: ChecklistItem;
    similarity: number;
  }> = [];

  // Find similar pairs
  for (let i = 0; i < items1.length; i++) {
    for (let j = 0; j < items2.length; j++) {
      let similarity = cosineSimilarity(embeddings1[i], embeddings2[j]);

      // Boost similarity if items have matching references
      if (hasMatchingReferences(items1[i], items2[j])) {
        similarity = Math.min(1.0, similarity + 0.15);
      }

      // Boost similarity if items are in the same category
      if (isSameCategory(items1[i], items2[j])) {
        similarity = Math.min(1.0, similarity + 0.1);
      }

      if (similarity >= similarityThreshold) {
        candidates.push({
          item1: items1[i],
          item2: items2[j],
          similarity,
        });
      }
    }
  }

  // Sort by similarity score
  candidates.sort((a, b) => b.similarity - a.similarity);

  // Generate fused text for top candidates
  const fusionCandidates: FusionCandidate[] = [];

  for (const candidate of candidates) {
    const fusedText = await generateFusedText(candidate.item1, candidate.item2);
    fusionCandidates.push({
      ...candidate,
      fusedText,
    });
  }

  return fusionCandidates;
}

/**
 * Generate fused text using GPT-4
 */
async function generateFusedText(
  item1: ChecklistItem,
  item2: ChecklistItem
): Promise<string> {
  try {
    const prompt = `You are an expert at merging audit checklist items. Given two similar checklist items from different standards, create a single, comprehensive checklist item that satisfies both requirements.

Item 1 (${item1.category}):
${item1.text}
${item1.references ? `References: ${item1.references.join(', ')}` : ''}

Item 2 (${item2.category}):
${item2.text}
${item2.references ? `References: ${item2.references.join(', ')}` : ''}

Create a fused checklist item that:
1. Preserves all critical requirements from both items
2. Eliminates redundancy
3. Uses clear, professional language
4. Maintains regulatory compliance for both standards
5. Is concise but complete

Return only the fused text without any explanation or preamble.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at merging audit checklist items while preserving all critical requirements.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return response.choices[0].message.content?.trim() || item1.text;
  } catch (error) {
    console.error('Error generating fused text:', error);
    // Fallback to simple concatenation
    return `${item1.text} ${item2.text}`;
  }
}

/**
 * Batch generate fusion suggestions
 */
export async function generateFusionSuggestions(
  checklist1: ParsedChecklist,
  checklist2: ParsedChecklist,
  options: {
    similarityThreshold?: number;
    maxSuggestions?: number;
  } = {}
): Promise<Array<{
  item1_id: string;
  item2_id: string;
  suggested_text: string;
  similarity_score: number;
}>> {
  const {
    similarityThreshold = 0.7,
    maxSuggestions = 50,
  } = options;

  const candidates = await findFusionCandidates(
    checklist1,
    checklist2,
    similarityThreshold
  );

  // Limit to max suggestions
  const limitedCandidates = candidates.slice(0, maxSuggestions);

  return limitedCandidates.map(candidate => ({
    item1_id: candidate.item1.id,
    item2_id: candidate.item2.id,
    suggested_text: candidate.fusedText,
    similarity_score: candidate.similarity,
  }));
}

/**
 * Regenerate fusion text for a specific pair of items
 */
export async function regenerateFusionText(
  item1: ChecklistItem,
  item2: ChecklistItem
): Promise<string> {
  return generateFusedText(item1, item2);
}
