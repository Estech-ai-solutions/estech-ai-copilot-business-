import { NextRequest, NextResponse } from 'next/server';
import { generateAiResponse } from '@/lib/ai';
import { retrieveRelevantKnowledge, buildKnowledgeContext } from '@/lib/knowledge/retrieval';
import { getUserAndWorkspace, SupabaseServerClient } from '@/lib/auth-server';

async function ensureWorkspace(supabase: SupabaseServerClient, userId: string) {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('created_by', userId)
    .limit(1)
    .maybeSingle();

  return workspace?.id || null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const prompt = body.prompt?.trim();
  const maxTokens = typeof body.maxTokens === 'number' ? body.maxTokens : undefined;

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId } = result;
  let workspaceId = result.workspaceId;

  if (!workspaceId) {
    workspaceId = await ensureWorkspace(supabase, userId);
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  let context = 'You are a helpful business consultant for small businesses.';

  if (workspaceId) {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('name, description')
      .eq('id', workspaceId)
      .single();

    if (ws) {
      context = `You are a business consultant for ${ws.name}.`;

      if (ws.description) {
        context += `\n\nBusiness Description: ${ws.description}`;
      }
    }

    try {
      const knowledgeResults = await retrieveRelevantKnowledge(supabase, workspaceId, prompt, { limit: 5 });
      const knowledgeContextStr = buildKnowledgeContext(knowledgeResults);

      if (knowledgeContextStr) {
        context += `\n\n${knowledgeContextStr}`;
      }

      context += '\n\nIf the Business Brain does not contain the answer, say you do not have that information. Do not make up business-specific facts.';
    } catch (error) {
      console.error('Failed to retrieve relevant knowledge:', error);
    }
  }

  const aiResponse = await generateAiResponse(prompt, context, { maxTokens });

  if (workspaceId && aiResponse) {
    await supabase.from('usage_logs').insert({
      workspace_id: workspaceId,
      feature: 'assistant',
      tokens_used: Math.ceil((aiResponse.text?.length || 0) / 4),
      metadata: { knowledgeEntriesRetrieved: 5 },
    });
  }

  return NextResponse.json(aiResponse);
}