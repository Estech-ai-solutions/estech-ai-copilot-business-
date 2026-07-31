import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { generateAiResponse } from '@/lib/ai';

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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId } = result as any;
  let knowledge: Array<{ title: string; type: string; content: string }> = [];
  let workspaceData: any = null;

  if (workspaceId) {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();
    workspaceData = ws;

    const { data: knowledgeEntries } = await supabase
      .from('knowledge')
      .select('*')
      .eq('workspace_id', workspaceId)
      .limit(10);

    knowledge = knowledgeEntries || [];
  }

  let context = 'You are a helpful business consultant for small businesses.';

  if (workspaceData) {
    context = `You are a business consultant for ${workspaceData.name}.`;

    if (workspaceData.description) {
      context += `\n\nBusiness Description: ${workspaceData.description}`;
    }
  }

  if (knowledge.length > 0) {
    context += `\n\nBusiness Knowledge Base:\n${knowledge.map((k: any) => `## ${k.title} (${k.type})\n${k.content}`).join('\n\n')}`;
  }

  const aiResponse = await generateAiResponse(prompt, context);

  if (workspaceId && aiResponse) {
    await supabase.from('usage_logs').insert({
      workspace_id: workspaceId,
      feature: 'assistant',
      tokens_used: Math.ceil((aiResponse.text?.length || 0) / 4),
    });
  }

  return NextResponse.json(aiResponse);
}