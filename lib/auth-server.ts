import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export type SupabaseServerClient = ReturnType<typeof createServerClient>;
export type AuthResult =
  | { error: 'Unauthorized'; userId: string | null; workspaceId: string | null; cause?: string }
  | { error: 'AuthServiceUnavailable'; message: string; userId: string | null; workspaceId: string | null }
  | { error: null; userId: string; workspaceId: string | null; supabase: SupabaseServerClient };

export async function getSupabaseServerClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const response = new NextResponse();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}

export async function getUserAndWorkspace(request: NextRequest): Promise<AuthResult> {
  let supabase: SupabaseServerClient;
  let authResponse: NextResponse;

  try {
    const created = await getSupabaseServerClient(request);
    supabase = created.supabase;
    authResponse = created.response;
  } catch (error) {
    return {
      error: 'AuthServiceUnavailable',
      message: error instanceof Error ? error.message : 'Failed to create Supabase client',
      userId: null,
      workspaceId: null,
    };
  }

  let user: { id: string } | null = null;
  let authError: any = null;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    authError = result.error;
  } catch (error: any) {
    authError = error;
  }

  if (!user) {
    const cause = authError
      ? authError.message || String(authError)
      : 'No authenticated user';
    return { error: 'Unauthorized', userId: null, workspaceId: null, cause };
  }

  let workspace: { id: string } | null = null;
  let workspaceError: any = null;

  try {
    const result = await supabase
      .from('workspaces')
      .select('id')
      .eq('created_by', user.id)
      .limit(1)
      .maybeSingle();

    workspace = result.data;
    workspaceError = result.error;
  } catch (error) {
    workspaceError = error;
  }

  if (workspaceError || !workspace) {
    return { error: null, userId: user.id, workspaceId: null, supabase };
  }

  return { error: null, userId: user.id, workspaceId: workspace.id, supabase };
}

export async function getWorkspaceMembership(
  supabase: SupabaseServerClient,
  userId: string,
  workspaceId: string
) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}
