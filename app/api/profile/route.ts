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
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const [{ data: profile }, { data: workspace }, { data: membership }, { count: knowledgeCount }, { count: taskCount }, { count: documentCount }, { count: leadCount }, { count: outreachCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
    supabase.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', userId).single(),
    supabase.from('knowledge').select('*', { count: 'exact' }).eq('workspace_id', workspaceId),
    supabase.from('tasks').select('*', { count: 'exact' }).eq('workspace_id', workspaceId),
    supabase.from('documents').select('*', { count: 'exact' }).eq('workspace_id', workspaceId),
    supabase.from('leads').select('*', { count: 'exact' }).eq('workspace_id', workspaceId),
    supabase.from('outreach').select('*', { count: 'exact' }).eq('workspace_id', workspaceId),
  ]);

  const completedTasks = taskCount || 0;

  return NextResponse.json({
    profile: profile || {},
    workspace: workspace || {},
    role: membership?.role || 'viewer',
    counts: {
      documents: documentCount || 0,
      knowledgeEntries: knowledgeCount || 0,
      leads: leadCount || 0,
      messagesSent: outreachCount || 0,
      tasksCompleted: completedTasks,
    },
  });
}

export async function PUT(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;
  const body = await request.json();

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const { password, ...profileUpdates } = body || {};

  if (password) {
    const { error: passwordError } = await supabase.auth.updateUser({
      password,
    });

    if (passwordError) {
      return NextResponse.json({ error: passwordError.message }, { status: 400 });
    }
  }

  const allowedFields = ['full_name', 'phone', 'job_title', 'bio', 'avatar_url'];
  const updates: Record<string, any> = { id: userId };

  for (const field of allowedFields) {
    if (field in profileUpdates) {
      updates[field] = profileUpdates[field];
    }
  }

  if (Object.keys(updates).length > 1) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return NextResponse.json({ profile: updatedProfile });
}
