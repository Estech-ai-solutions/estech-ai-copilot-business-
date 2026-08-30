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
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  const body = await request.json();
  const { title, description, status, priority, due_date } = body || {};

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (due_date !== undefined) updateData.due_date = due_date;

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', params.id)
    .eq('workspace_id', workspaceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
