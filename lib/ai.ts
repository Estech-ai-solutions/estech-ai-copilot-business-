export async function generateAiResponse(prompt: string, context?: string, options?: { provider?: string; maxTokens?: number }) {
  const apiKey = process.env.MISTRAL_API_KEY;
  const apiUrl = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

  if (!apiKey) {
    return {
      text: context
        ? "AI is not configured. Add your MISTRAL_API_KEY to use the knowledge context feature."
        : 'AI is not configured. Set MISTRAL_API_KEY in your environment.'
    };
  }

  const payload = {
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: fullPrompt }],
    max_tokens: options?.maxTokens || 500,
    temperature: 0.7
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      text: `AI request failed: ${response.status} ${errorText}`
    };
  }

  const json = await response.json();
  const generatedText = json?.choices?.[0]?.message?.content || json?.output || '';

  return {
    text: typeof generatedText === 'string' ? generatedText : JSON.stringify(generatedText)
  };
}