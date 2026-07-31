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

export async function GET(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId } = result as any;

  if (!workspaceId) {
    return NextResponse.json({
      usage: {
        totalTokens: 0,
        totalRequests: 0,
        features: {},
        logs: [],
      },
    });
  }

  const { data: logs } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(20);

  const logsArray = logs || [];
  const totalTokens = logsArray.reduce((sum: number, l: any) => sum + (l.tokens_used || 0), 0);
  const totalRequests = logsArray.length;

  const featureCounts: Record<string, number> = {};
  logsArray.forEach((l: any) => {
    featureCounts[l.feature] = (featureCounts[l.feature] || 0) + 1;
  });

  return NextResponse.json({
    usage: {
      totalTokens,
      totalRequests,
      features: featureCounts,
      logs: logsArray,
    },
  });
}