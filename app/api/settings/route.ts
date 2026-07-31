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

export async function GET(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId, userId } = result as any;

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    return NextResponse.json({ settings: null });
  }

  return NextResponse.json({ settings: data });
}

export async function PUT(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId, userId } = result as any;
  const body = await request.json();

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const allowedFields = [
    'company_name',
    'industry',
    'timezone',
    'language',
    'ai_model',
    'temperature',
    'response_length',
    'default_country',
    'default_industry',
    'max_search_results',
    'email_signature',
    'whatsapp_signature',
    'autosave',
    'email_notifications',
    'browser_notifications',
    'daily_summary',
    'lead_alerts',
    'ai_notifications',
    'theme',
    'accent_color',
  ];

  const updates: Record<string, any> = { user_id: userId, workspace_id: workspaceId };

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(updates, { onConflict: 'user_id,workspace_id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
