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

  if (!workspaceId) {
    return NextResponse.json({ messages: [] });
  }

  const conversationId = params.id;

  const { data: conversation } = await supabase
    .from('conversations')
    .select('workspace_id')
    .eq('id', conversationId)
    .single();

  if (!conversation || conversation.workspace_id !== workspaceId) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: messages || [] });
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
  const { role, content } = body || {};

  if (!role || !content) {
    return NextResponse.json({ error: 'role and content are required' }, { status: 400 });
  }

  if (!['user', 'assistant'].includes(role)) {
    return NextResponse.json({ error: 'role must be user or assistant' }, { status: 400 });
  }

  const conversationId = params.id;

  const { data: conversation } = await supabase
    .from('conversations')
    .select('workspace_id')
    .eq('id', conversationId)
    .single();

  if (!conversation || conversation.workspace_id !== workspaceId) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return NextResponse.json({ message });
}
