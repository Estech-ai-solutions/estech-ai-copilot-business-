import { NextRequest, NextResponse } from 'next/server';
import { generateAiChatResponse } from '@/lib/ai';
import { retrieveRelevantKnowledge, buildKnowledgeContext } from '@/lib/knowledge/retrieval';
import { getUserAndWorkspace } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;
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

  let knowledgeResults: any[] = [];
  if (workspaceId) {
    knowledgeResults = await retrieveRelevantKnowledge(supabase, workspaceId, trimmedMessage, { limit: 5 });
  }
  const knowledgeCount = knowledgeResults.length;

  console.log('[Copilot] Knowledge entries retrieved:', knowledgeCount, 'for query:', trimmedMessage);

  const knowledgeContextStr = buildKnowledgeContext(knowledgeResults);

  let systemPrompt = 'You are Estech AI Business Copilot.\n\n';
  systemPrompt += 'Below is trusted business knowledge from the user\'s Business Brain.\n';
  systemPrompt += 'Use this knowledge when answering.\n\n';
  systemPrompt += 'If the information exists in the Business Brain, answer from it naturally.\n';
  systemPrompt += 'If it does not exist, say you do not know.\n';
  systemPrompt += 'Never ignore the provided knowledge.\n';
  systemPrompt += 'When you use knowledge, mention the source naturally in your answer, like "Based on your Delivery Policy..." instead of copying raw source metadata.\n\n';

  if (knowledgeContextStr) {
    systemPrompt += knowledgeContextStr + '\n';
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
      metadata: { knowledgeEntriesRetrieved: knowledgeCount },
    });
  }

  return NextResponse.json({
    message: assistantMessage,
    conversationId,
    knowledgeEntriesRetrieved: knowledgeCount
  });
}
