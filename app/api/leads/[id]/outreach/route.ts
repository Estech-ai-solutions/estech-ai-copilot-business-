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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ outreach: [] }, { status: 401 });
  }

  const { supabase, workspaceId } = result as any;

  const { data: outreach, error } = await supabase
    .from('outreach')
    .select('*')
    .eq('lead_id', params.id)
    .eq('workspace_id', workspaceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ outreach: outreach || [] });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId } = result as any;
  const body = await request.json();
  const { channel, message } = body;

  if (!channel || !message) {
    return NextResponse.json({ error: 'channel and message are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('outreach')
    .insert({
      lead_id: params.id,
      workspace_id: workspaceId,
      channel,
      message,
      status: 'sent',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ outreach: data });
}