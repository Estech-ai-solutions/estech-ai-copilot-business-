import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

async function getUserAndWorkspace(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', workspaceId: null };
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('created_by', user.id)
    .limit(1)
    .single();

  return { supabase, userId: user.id, workspaceId: workspace?.id || null };
}

export async function GET(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ searches: [] });
  }

  const { supabase, workspaceId } = result as any;

  if (!workspaceId) {
    return NextResponse.json({ searches: [] });
  }

  const { data: searches, error } = await supabase
    .from('lead_searches')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ searches: searches || [] });
}