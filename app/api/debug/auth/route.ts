import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    env: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '[set]' : '[missing]',
    },
    cookies: {
      count: request.cookies.getAll().length,
      names: request.cookies.getAll().map((c) => c.name),
    },
    steps: [] as any[],
  };

  try {
    diagnostics.steps.push({ step: 'create_client', status: 'started' });
    const { supabase } = await getSupabaseServerClient(request);
    diagnostics.steps.push({ step: 'create_client', status: 'ok' });

    diagnostics.steps.push({ step: 'auth_getUser', status: 'started' });
    const startTime = Date.now();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const elapsed = Date.now() - startTime;

    diagnostics.steps.push({
      step: 'auth_getUser',
      status: userError ? 'error' : 'ok',
      elapsed,
      hasUser: !!user,
      userId: user?.id ?? null,
      error: userError?.message ?? null,
    });

    if (user) {
      diagnostics.steps.push({ step: 'workspaces_query', status: 'started' });
      const wsStart = Date.now();
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)
        .maybeSingle();
      diagnostics.steps.push({
        step: 'workspaces_query',
        status: workspaceError ? 'error' : 'ok',
        elapsed: Date.now() - wsStart,
        hasWorkspace: !!workspace,
        workspaceId: workspace?.id ?? null,
        error: workspaceError?.message ?? null,
      });
    }

    return NextResponse.json({ diagnostics }, { status: 200 });
  } catch (err: any) {
    diagnostics.steps.push({
      step: 'fatal',
      status: 'error',
      message: err?.message ?? String(err),
      name: err?.name ?? null,
      statusCode: err?.status ?? null,
    });
    return NextResponse.json({ diagnostics }, { status: 500 });
  }
}
