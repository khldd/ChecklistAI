import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Test 1: Check if we can connect
    const { data: testData, error: testError } = await supabaseServer
      .from('checklists')
      .select('count')
      .limit(1);

    // Test 2: Try to insert a dummy record
    const testChecklist = {
      file_hash: 'test-' + Date.now(),
      file_name: 'test.pdf',
      parsed_content: { items: [], metadata: {} },
    };

    const { data: insertData, error: insertError } = await supabaseServer
      .from('checklists')
      .insert(testChecklist)
      .select()
      .single();

    // Clean up test record
    if (insertData) {
      await supabaseServer
        .from('checklists')
        .delete()
        .eq('id', insertData.id);
    }

    return NextResponse.json({
      success: true,
      canRead: !testError,
      canWrite: !insertError,
      testError: testError?.message,
      insertError: insertError?.message,
      usingServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
