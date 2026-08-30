import { NextRequest, NextResponse } from 'next/server';
import { generateAiResponse } from '@/lib/ai';
import { getUserAndWorkspace } from '@/lib/auth-server';

function buildGenerationPrompt(contentType: string, goal?: string, audience?: string, instructions?: string, existingContent?: string, action?: string) {
  if (action && existingContent) {
    const actionInstructions: Record<string, string> = {
      rewrite: 'Rewrite the following content completely with a fresh perspective while maintaining the same core message. Do not use placeholder text like [Your Business Name]. Write concrete, ready-to-use copy.',
      shorter: 'Rewrite the following content to be more concise and direct. Keep all essential information but remove filler words. Do not use placeholders. Write concrete, ready-to-use copy.',
      longer: 'Expand the following content with more detail, examples, and explanation. Make it more comprehensive and compelling. Do not use placeholders. Write concrete, ready-to-use copy.',
      professional: 'Rewrite the following content in a more formal, professional business tone. Use sophisticated language suitable for corporate communication. Do not use placeholders. Write concrete, ready-to-use copy.',
      friendly: 'Rewrite the following content in a warmer, more approachable tone while maintaining professionalism. Make it feel personal and conversational. Do not use placeholders. Write concrete, ready-to-use copy.',
      translate: 'Translate the following content to English. Preserve the business tone and all key information. Do not use placeholders. Write concrete, ready-to-use copy.',
    };

    const instruction = actionInstructions[action] || 'Improve the following content.';
    return instruction + '\n\nContent:\n' + existingContent;
  }

  let prompt = 'You are an expert marketing copywriter.\n\n';
  prompt += 'Generate a professional ' + contentType + '.\n\n';

  if (goal) {
    prompt += 'Business Goal: ' + goal + '\n\n';
  }

  if (audience) {
    prompt += 'Target Audience: ' + audience + '\n\n';
  }

  if (instructions) {
    prompt += 'Extra Instructions: ' + instructions + '\n\n';
  }

  prompt += 'Requirements:\n';
  prompt += '- Write concrete, ready-to-use marketing copy. Do not write templates or outlines.\n';
  prompt += '- Do not use placeholder text like [Your Business Name], [Your Product], [insert X here], or similar.\n';
  prompt += '- Make the copy specific, compelling, and actionable.\n';
  prompt += '- Use active voice and strong verbs.\n';
  prompt += '- Focus on benefits, not just features.\n';
  prompt += '- Include a clear call-to-action.\n';
  prompt += '- Do not include any environment details, system information, working directory, file paths, timestamps, or metadata.\n';
  prompt += '- Do not include markdown code blocks or backticks.\n';
  prompt += '- Return ONLY the raw marketing content, nothing else.';

  return prompt;
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
  const body = await request.json();
  const { contentType, goal, audience, instructions, existingContent, action } = body || {};

  if (!contentType) {
    return NextResponse.json({ error: 'contentType is required' }, { status: 400 });
  }

  const prompt = buildGenerationPrompt(contentType, goal, audience, instructions, existingContent, action);

  const aiResponse = await generateAiResponse(prompt);

  if (workspaceId && aiResponse.text) {
    await supabase.from('usage_logs').insert({
      workspace_id: workspaceId,
      feature: 'content_studio',
      tokens_used: Math.ceil(aiResponse.text.length / 4),
    });
  }

  return NextResponse.json({
    content: aiResponse.text || 'Failed to generate content. Please try again.',
  });
}
