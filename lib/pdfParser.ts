import type { ParsedChecklist, ChecklistItem } from './types/database';
import axios from 'axios';
import FormData from 'form-data';

/**
 * Parse PDF using Unstract Deployed API Workflow
 * Matches the n8n node configuration
 */
export async function parsePdfWithUnstract(file: File): Promise<ParsedChecklist> {
  const UNSTRACT_API_KEY = process.env.UNSTRACT_API_KEY;
  const UNSTRACT_ORG_ID = process.env.UNSTRACT_ORG_ID || 'org_nE3ANUp2AVZbE8bf';
  const UNSTRACT_DEPLOYMENT_NAME = process.env.UNSTRACT_DEPLOYMENT_NAME || 'karim_1762476869900';
  const UNSTRACT_HOST = process.env.UNSTRACT_HOST || 'https://us-central.unstract.com';

  if (!UNSTRACT_API_KEY) {
    throw new Error('UNSTRACT_API_KEY is required in environment variables');
  }

  try {
    // Build the correct endpoint URL from documentation
    const apiUrl = `${UNSTRACT_HOST}/deployment/api/${UNSTRACT_ORG_ID}/${UNSTRACT_DEPLOYMENT_NAME}/`;

    console.log('🔍 Unstract API Configuration:');
    console.log('  URL:', apiUrl);
    console.log('  File:', file.name);
    console.log('  File size:', file.size, 'bytes');
    console.log('  API Key:', UNSTRACT_API_KEY ? `${UNSTRACT_API_KEY.substring(0, 10)}...` : 'NOT SET');

    // Convert File to Buffer for Node.js FormData (server-side)
    console.log('📄 Converting File to Buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('  Buffer size:', buffer.length, 'bytes');

    // Use Node.js form-data package (not browser FormData)
    const formData = new FormData();
    formData.append('files', buffer, {
      filename: file.name,
      contentType: 'application/pdf',
      knownLength: buffer.length,
    });
    formData.append('timeout', '300');
    formData.append('include_metadata', 'false');

    console.log('🚀 Sending request to Unstract...');

    // Make the API call with Bearer token using axios (exactly like test script)
    const response = await axios.post(apiUrl, formData, {
      headers: {
        'Authorization': `Bearer ${UNSTRACT_API_KEY}`,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    console.log('📬 Response Status:', response.status, response.statusText);
    console.log('📋 Response received, data length:', JSON.stringify(response.data).length);

    if (response.status !== 200) {
      throw new Error(`Unstract API error (${response.status}): ${JSON.stringify(response.data)}`);
    }

    // Transform Unstract response to our checklist format
    console.log('🔄 Transforming response...');
    const result = transformUnstractResponse(response.data, file.name);
    console.log('✅ Successfully parsed checklist with', result.items.length, 'items');
    return result;
  } catch (error: any) {
    console.error('❌ Error parsing PDF with Unstract:');
    console.error('  Error message:', error.message);
    console.error('  Error details:', error.response?.data || error.toString());
    if (error.response) {
      console.error('  Response status:', error.response.status);
      console.error('  Response headers:', error.response.headers);
    }
    throw new Error(`Unstract API failed: ${error.message}`);
  }
}

/**
 * Transform Unstract API response to our checklist format
 * Handles the specific structure from the Unstract deployed workflow
 */
function transformUnstractResponse(response: any, fileName: string): ParsedChecklist {
  const items: ChecklistItem[] = [];

  console.log('Transforming Unstract response structure...');

  try {
    // Navigate the response structure: message.result[0].result.output.karim_1
    const message = response.message;
    if (!message || !message.result || !Array.isArray(message.result) || message.result.length === 0) {
      throw new Error('Invalid Unstract response structure: missing message.result');
    }

    const firstResult = message.result[0];
    if (firstResult.status !== 'Success') {
      throw new Error(`Unstract processing failed with status: ${firstResult.status}`);
    }

    // Get the JSON string from the output (it's wrapped in markdown code fences)
    const outputKey = Object.keys(firstResult.result.output)[0]; // Usually 'karim_1'
    let jsonString = firstResult.result.output[outputKey];

    // Remove markdown code fences if present
    jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');

    // Parse the JSON
    const parsed = JSON.parse(jsonString);
    console.log('Parsed Unstract data:', parsed);

    // Extract document metadata
    const document = parsed.document || {};
    const sections = parsed.sections || [];

    // Transform sections and items to our format
    sections.forEach((section: any) => {
      const sectionTitle = `${section.letter}. ${section.title}`;

      section.items.forEach((item: any) => {
        // Extract option labels
        const options = (item.options || []).map((opt: any) => opt.label);

        // Determine category based on section title
        const category = detectCategoryFromSection(section.title);

        items.push({
          id: item.id,
          section: sectionTitle,
          text: item.label || item.text || '',
          options,
          references: item.references || [],
          category,
          metadata: {
            page: item.page,
            status: item.status,
            notes: item.notes,
            ...item.fields,
          },
        });
      });
    });

    return {
      items,
      metadata: {
        title: document.title || fileName.replace('.pdf', ''),
        version: document.version || document.date || '',
        date: document.date || new Date().toISOString().split('T')[0],
        sections: sections.map((s: any) => `${s.letter}. ${s.title}`),
      },
    };
  } catch (error) {
    console.error('Error transforming Unstract response:', error);
    throw new Error(`Failed to parse Unstract response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse extracted text into checklist format
 */
function parseExtractedText(text: string, fileName: string): ParsedChecklist {
  const items: ChecklistItem[] = [];
  const lines = text.split('\n').filter(line => line.trim());

  let currentSection = 'General';
  let itemCounter = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (trimmedLine.length === 0) continue;

    // Detect section headers (e.g., "A. Généralités")
    if (/^[A-Z]\.\s+/.test(trimmedLine) && trimmedLine.length < 100) {
      currentSection = trimmedLine;
      continue;
    }

    // Detect checklist items (various formats)
    const isChecklistItem =
      trimmedLine.includes('☐') ||
      trimmedLine.includes('□') ||
      trimmedLine.includes('☑') ||
      trimmedLine.includes('✓') ||
      trimmedLine.includes('✗') ||
      /^\d+[\.\)]\s/.test(trimmedLine) ||
      /^[\u2022\u2023\u25E6\u2043\u2219]/.test(trimmedLine);

    if (isChecklistItem && trimmedLine.length > 10) {
      // Extract references (text in parentheses at the end)
      const referenceMatch = trimmedLine.match(/\(([^)]+)\)\s*$/);
      const references = referenceMatch ? [referenceMatch[1]] : [];
      const textWithoutRef = referenceMatch
        ? trimmedLine.substring(0, referenceMatch.index).trim()
        : trimmedLine;

      // Clean up the text
      const cleanText = textWithoutRef
        .replace(/^[\u2022\u2023\u25E6\u2043\u2219☐□☑✓✗\d+[\.\)]\s]+/, '')
        .trim();

      if (cleanText.length > 0) {
        items.push({
          id: `item_${itemCounter++}`,
          section: currentSection,
          text: cleanText,
          references,
          category: detectCategory(cleanText),
        });
      }
    }
  }

  return {
    items,
    metadata: {
      title: fileName.replace('.pdf', ''),
      version: '',
      date: new Date().toISOString().split('T')[0],
      sections: Array.from(new Set(items.map(item => item.section))),
    },
  };
}

/**
 * Detect category based on section title
 */
function detectCategoryFromSection(sectionTitle: string): string {
  const lowerTitle = sectionTitle.toLowerCase();

  if (lowerTitle.includes('contrat') || lowerTitle.includes('licence') || lowerTitle.includes('document')) {
    return 'Documentation';
  }
  if (lowerTitle.includes('achat') || lowerTitle.includes('réception') || lowerTitle.includes('matières premières')) {
    return 'Procurement';
  }
  if (lowerTitle.includes('emballage') || lowerTitle.includes('déclaration')) {
    return 'Packaging';
  }
  if (lowerTitle.includes('recette') || lowerTitle.includes('transformation') || lowerTitle.includes('production')) {
    return 'Production';
  }
  if (lowerTitle.includes('parasite') || lowerTitle.includes('hygiène') || lowerTitle.includes('nettoyage')) {
    return 'Hygiene';
  }
  if (lowerTitle.includes('importation') || lowerTitle.includes('transport')) {
    return 'Import';
  }
  if (lowerTitle.includes('contrôle') || lowerTitle.includes('flux')) {
    return 'Quality Control';
  }
  if (lowerTitle.includes('annonce') || lowerTitle.includes('obligation')) {
    return 'Compliance';
  }

  return 'General';
}

/**
 * Detect category based on item text content
 */
function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('document') || lowerText.includes('formulaire') || lowerText.includes('registre')) {
    return 'Documentation';
  }
  if (lowerText.includes('formation') || lowerText.includes('personnel') || lowerText.includes('collaborateur')) {
    return 'Personnel';
  }
  if (lowerText.includes('production') || lowerText.includes('fabrication')) {
    return 'Production';
  }
  if (lowerText.includes('hygiène') || lowerText.includes('nettoyage') || lowerText.includes('désinfection')) {
    return 'Hygiene';
  }
  if (lowerText.includes('stockage') || lowerText.includes('entreposage')) {
    return 'Storage';
  }
  if (lowerText.includes('traçabilité') || lowerText.includes('étiquetage')) {
    return 'Traceability';
  }

  return 'General';
}

/**
 * Fallback: Parse PDF locally - REMOVED
 * User wants Unstract only
 */
export async function parsePdfLocally(file: File): Promise<ParsedChecklist> {
  throw new Error('Local PDF parsing not available. Please configure Unstract API credentials.');
}

/**
 * Extract metadata from PDF - REMOVED
 * User wants Unstract only
 */
export async function extractPdfMetadata(file: File): Promise<Record<string, any>> {
  return {
    title: file.name,
    pageCount: 0,
  };
}
