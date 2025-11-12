import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Check what role we're connecting as
    const { data: roleData, error: roleError } = await supabaseServer.rpc('current_user');

    // Try a raw SQL query to check permissions
    const { data: sqlData, error: sqlError } = await supabaseServer
      .rpc('check_permissions', {});

    // Check if RLS is enabled
    const { data: rlsData, error: rlsError } = await supabaseServer
      .from('checklists')
      .select('*')
      .limit(1);

    return NextResponse.json({
      roleData,
      roleError: roleError?.message,
      sqlData,
      sqlError: sqlError?.message,
      rlsData,
      rlsError: rlsError?.message,
      clientConfig: {
        hasAuth: !!(supabaseServer as any).auth,
        authOptions: (supabaseServer as any).auth?.client?.authConfig || 'N/A',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
