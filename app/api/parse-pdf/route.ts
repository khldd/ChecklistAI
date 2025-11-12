import { NextRequest, NextResponse } from 'next/server';
import { parsePdfWithUnstract } from '@/lib/pdfParser';
import { checkChecklistExists, saveChecklist } from '@/lib/supabase-server';
import CryptoJS from 'crypto-js';

export async function POST(request: NextRequest) {
  try {
    console.log('\n📥 Parse PDF API called');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileHash = formData.get('fileHash') as string;

    console.log('  File:', file?.name);
    console.log('  File size:', file?.size, 'bytes');
    console.log('  File hash:', fileHash);

    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!fileHash) {
      console.error('❌ No file hash provided');
      return NextResponse.json(
        { error: 'File hash is required' },
        { status: 400 }
      );
    }

    // Check if this file has already been processed
    console.log('🔍 Checking for cached checklist...');
    const existingChecklist = await checkChecklistExists(fileHash);

    if (existingChecklist) {
      console.log('✅ Found cached checklist');
      return NextResponse.json({
        checklist: existingChecklist,
        cached: true,
      });
    }

    console.log('📄 No cache found, parsing PDF with Unstract...');

    // Parse the PDF
    const parsedContent = await parsePdfWithUnstract(file);

    console.log('💾 Saving to database...');

    // Save to database
    const checklist = await saveChecklist(
      fileHash,
      file.name,
      parsedContent
    );

    console.log('✅ Successfully processed and saved checklist\n');

    return NextResponse.json({
      checklist,
      cached: false,
    });
  } catch (error: any) {
    console.error('\n❌ ERROR in parse-pdf API:');
    console.error('  Message:', error.message);
    console.error('  Stack:', error.stack);
    console.error('  Full error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to parse PDF',
        details: error.stack || error.toString(),
      },
      { status: 500 }
    );
  }
}

// Next.js 14 App Router handles file uploads automatically
// No need for bodyParser config
