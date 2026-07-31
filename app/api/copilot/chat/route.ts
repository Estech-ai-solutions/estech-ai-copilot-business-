import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { generateAiChatResponse } from '@/lib/ai';

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
    return { error: 'Unauthorized', workspaceId: null, userId: null };
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('created_by', user.id)
    .limit(1)
    .single();

  return { supabase, userId: user.id, workspaceId: workspace?.id || null };
}

function extractSearchTerms(query: string): string[] {
  const stopWords = new Set([
    'who', 'what', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were',
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'and', 'or', 'but', 'not', 'no', 'yes', 'do', 'does', 'did', 'can', 'could',
    'would', 'should', 'will', 'shall', 'may', 'might', 'must', 'have', 'has', 'had',
    'been', 'being', 'be', 'this', 'that', 'these', 'those', 'my', 'your', 'his',
    'her', 'its', 'our', 'their', 'tell', 'about', 'explain', 'describe', 'list',
    'show', 'give', 'need', 'want', 'looking', 'please', 'can', 'you', 'me', 'us'
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

async function searchKnowledge(supabase: any, workspaceId: string, query: string, limit = 5) {
  const searchTerm = query.trim();
  const queryLimit = Math.min(20, Math.max(1, limit));

  const searchTerms = extractSearchTerms(searchTerm);
  const dynamicLimit = Math.max(queryLimit * 3, 20);

  let q = supabase
    .from('knowledge')
    .select('id, title, category, content, tags, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(dynamicLimit);

  if (searchTerms.length > 0) {
    const orConditions = searchTerms.map(term => 'title.ilike.%' + term + '%,content.ilike.%' + term + '%').join(',');
    q = q.or(orConditions);
  }

  const { data: entries } = await q;

  const results = (entries || []).map((entry: any) => {
    const titleLower = entry.title.toLowerCase();
    const contentLower = entry.content.toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    let relevanceScore = 0;

    if (titleLower.includes(searchLower)) {
      relevanceScore += 10;
    }

    const searchWords = searchLower.split(/\s+/).filter((w: string) => w.length > 2);
    const matchedWords = searchWords.filter((word: string) => contentLower.includes(word));
    relevanceScore += matchedWords.length * 2;

    const exactMatches = (entry.content.match(new RegExp(searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    relevanceScore += exactMatches * 3;

    return {
      ...entry,
      relevanceScore,
    };
  });

  results.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

  return results.slice(0, queryLimit);
}

export async function POST(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId, userId } = result as any;
  const body = await request.json();
  const { conversationId, message } = body || {};

  if (!conversationId || !message) {
    return NextResponse.json({ error: 'conversationId and message are required' }, { status: 400 });
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('workspace_id, title')
    .eq('id', conversationId)
    .single();

  if (!conversation || conversation.workspace_id !== workspaceId) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: trimmedMessage,
  });

  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  const knowledgeResults = await searchKnowledge(supabase, workspaceId, trimmedMessage, 5);
  const knowledgeCount = knowledgeResults.length;

  console.log('[Copilot] Knowledge entries retrieved:', knowledgeCount, 'for query:', trimmedMessage);

  let systemPrompt = 'You are Estech AI Business Copilot.\n\n';
  systemPrompt += 'Below is trusted business knowledge from the user\'s Business Brain.\n';
  systemPrompt += 'Use this knowledge when answering.\n\n';
  systemPrompt += 'If the information exists in the Business Brain, answer from it.\n';
  systemPrompt += 'If it does not exist, say you do not know.\n';
  systemPrompt += 'Never ignore the provided knowledge.\n\n';

  if (knowledgeCount > 0) {
    systemPrompt += 'Business Knowledge:\n';
    knowledgeResults.forEach((entry: any, index: number) => {
      systemPrompt += (index + 1) + '. [' + entry.category.toUpperCase() + '] ' + entry.title + '\n';
      systemPrompt += entry.content + '\n\n';
    });
  } else {
    systemPrompt += 'No relevant business knowledge was found for this query.\n';
  }

  const messagesPayload: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (history && history.length > 0) {
    history.forEach((msg: any) => {
      messagesPayload.push({ role: msg.role, content: msg.content });
    });
  }

  messagesPayload.push({ role: 'user', content: trimmedMessage });

  const aiResponse = await generateAiChatResponse(messagesPayload, {
    provider: 'mistral',
    maxTokens: 1000,
  });

  const assistantText = aiResponse.text || 'I apologize, but I could not generate a response. Please try again.';

  const { data: assistantMessage, error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantText,
    })
    .select()
    .single();

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (workspaceId) {
    await supabase.from('usage_logs').insert({
      workspace_id: workspaceId,
      feature: 'assistant',
      tokens_used: Math.ceil(assistantText.length / 4),
    });
  }

  return NextResponse.json({
    message: assistantMessage,
    conversationId,
    knowledgeEntriesRetrieved: knowledgeCount
  });
}
