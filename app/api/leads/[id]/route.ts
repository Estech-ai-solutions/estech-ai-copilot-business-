import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ lead: null }, { status: 401 });
  }

  const { supabase, workspaceId } = result as any;

  if (!workspaceId) {
    return NextResponse.json({ lead: null }, { status: 404 });
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !lead) {
    return NextResponse.json({ lead: null }, { status: 404 });
  }

  return NextResponse.json({ lead });
}