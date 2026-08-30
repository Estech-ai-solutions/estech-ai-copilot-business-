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