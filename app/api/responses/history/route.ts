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
    .select('id, customer_message, tone, response, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const history = (responses || []).map((r: any) => ({
    id: r.id,
    customerMessage: r.customer_message,
    tone: r.tone,
    response: r.response,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ history });
}
