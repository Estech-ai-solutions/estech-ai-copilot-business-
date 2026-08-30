import { NextRequest, NextResponse } from 'next/server';
import { getUserAndWorkspace } from '@/lib/auth-server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;

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
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;
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