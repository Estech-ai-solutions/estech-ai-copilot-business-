import { NextRequest, NextResponse } from 'next/server';
import { getUserAndWorkspace } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;

  if (!workspaceId) {
    return NextResponse.json({ history: [] });
  }

  const { data: responses, error } = await supabase
    .from('responses')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ history: responses || [] });
}

export async function POST(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;
  const body = await request.json();
  const { customerMessage, tone, response } = body || {};

  if (!customerMessage || !response) {
    return NextResponse.json(
      { error: 'customerMessage and response are required' },
      { status: 400 }
    );
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('responses')
    .insert({
      workspace_id: workspaceId,
      customer_message: customerMessage,
      tone: tone || 'Professional',
      response: response,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ response: data });
}
