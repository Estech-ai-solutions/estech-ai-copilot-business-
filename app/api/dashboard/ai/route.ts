import { NextRequest, NextResponse } from 'next/server';
import { generateAiResponse } from '@/lib/ai';
import { retrieveRelevantKnowledge, buildKnowledgeContext } from '@/lib/knowledge/retrieval';
import { getUserAndWorkspace } from '@/lib/auth-server';

type Intent = 
  | 'lead_search'
  | 'communication'
  | 'document'
  | 'task'
  | 'business_question'
  | 'general';

interface IntentResult {
  intent: Intent;
  confidence: number;
  message: string;
  action?: {
    type: string;
    href: string;
    params?: Record<string, string> | undefined;
    label: string;
  };
}

async function classifyIntent(message: string, workspaceName?: string): Promise<IntentResult> {
  const classificationPrompt = `You are an intent classifier for a business copilot assistant.

User message: "${message}"

Classify the user's intent into one of these categories:
- lead_search: User wants to find potential customers, leads, or prospects
- communication: User wants to reply to a customer, write a message, or communicate
- document: User wants to create a document like a quotation, proposal, invoice, or contract
- task: User wants to create a task, reminder, or follow-up
- business_question: User is asking about their business information, knowledge base, or context
- general: Everything else

Also extract any relevant parameters like:
- industry (for lead search)
- location (for lead search)
- documentType (for documents)
- taskDetails (for tasks)

Respond in JSON format only:
{
  "intent": "one of the categories above",
  "confidence": 0.0-1.0,
  "message": "friendly response message (1-2 sentences)",
  "action": {
    "type": "open_leads|open_documents|open_tasks|open_responses|answer|none",
    "href": "/leads|/documents|/tasks|/responses|/assistant|null",
    "params": { "key": "value" } or null,
    "label": "button text"
  }
}

Examples:
- "I need to find logistics companies in Lagos" → intent: lead_search, action: open_leads, params: { industry: "logistics", location: "Lagos" }
- "Create a quotation" → intent: document, action: open_documents, params: { type: "quote" }
- "Remind me to follow up with John" → intent: task, action: open_tasks
- "What do you know about our delivery policy?" → intent: business_question, action: answer

  Business context: user workspace${workspaceName ? ` named "${workspaceName}"` : ''}`;

  const response = await generateAiResponse(classificationPrompt, undefined, { maxTokens: 600 });
  const text = response.text || '';

  const cleanedText = text
    .replace(/^json\s+/i, '')
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  let parsed: IntentResult | null = null;

  try {
    parsed = JSON.parse(cleanedText) as IntentResult;
  } catch {
    try {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]) as IntentResult;
      }
    } catch {
      parsed = null;
    }
  }

  if (parsed && typeof parsed.message === 'string') {
    const safeMessage = extractPlainText(parsed.message);
    if (safeMessage.startsWith('{') || safeMessage.startsWith('[')) {
      return {
        ...parsed,
        message: 'I can help with that. What would you like to do next?',
      };
    }
    return {
      ...parsed,
      message: safeMessage,
    };
  }

  return {
    intent: 'general',
    confidence: 0.5,
    message: cleanedText || 'I\'m here to help. What would you like to do?',
    action: {
      type: 'none',
      href: '',
      label: '',
    },
  };
}

function extractPlainText(text: string): string {
  if (!text) return '';
  const cleaned = text
    .replace(/^json\s+/i, '')
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    return cleaned;
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'string') return parsed;
    if (typeof parsed?.message === 'string') return parsed.message;
    if (typeof parsed?.text === 'string') return parsed.text;
    if (typeof parsed?.content === 'string') return parsed.content;
    return cleaned;
  } catch {
    const messageMatch = cleaned.match(/"message"\s*:\s*"([^"]*)"/);
    if (messageMatch) {
      return messageMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
    return 'I received an incomplete response. Please try again.';
  }
}

export async function POST(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;
  const workspace = result.workspaceId ? await supabase.from('workspaces').select('name').eq('id', result.workspaceId).maybeSingle().then(r => r.data) : null;
  const body = await request.json();
  const { message } = body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const trimmedMessage = message.trim();

  try {
    const intentResult = await classifyIntent(trimmedMessage, workspace?.name);

    // If it's a business question, retrieve knowledge and answer directly
    if (intentResult.intent === 'business_question') {
      let knowledgeContextStr = '';

      if (workspaceId) {
        try {
          const knowledgeResults = await retrieveRelevantKnowledge(supabase, workspaceId, trimmedMessage, { limit: 5 });
          knowledgeContextStr = buildKnowledgeContext(knowledgeResults);
        } catch (error) {
          console.error('Failed to retrieve relevant knowledge:', error);
        }
      }

      const context = `You are a helpful business assistant.

${knowledgeContextStr || 'No relevant business knowledge was found for this query.'}

If the Business Brain does not contain the answer, say you do not have that information. Do not make up business-specific facts.`;

      const aiResponse = await generateAiResponse(trimmedMessage, context, { maxTokens: 500 });
      const plainMessage = extractPlainText(aiResponse.text || '');
      
      return NextResponse.json({
        suggestion: {
          message: plainMessage || 'I don\'t have that information in your business knowledge yet.',
          intent: 'business_question',
          action: {
            type: 'answer',
            href: '',
            params: null,
            label: '',
          },
        },
      });
    }

    // For other intents, return the classification result
    const safeIntent: IntentResult = {
      ...intentResult,
      message: extractPlainText(intentResult.message),
    };

    return NextResponse.json({
      suggestion: safeIntent,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        suggestion: {
          message: 'I\'m having trouble understanding that. Could you try rephrasing?',
          intent: 'general',
          action: {
            type: 'none',
            href: '',
            params: undefined,
            label: '',
          },
        },
      },
      { status: 500 }
    );
  }
}
