function sanitizeAiOutput(text: string): string {
  if (!text) return '';
  let cleaned = text;
  cleaned = cleaned.replace(/<environment_details>[\s\S]*?<\/environment_details>/gi, '');
  cleaned = cleaned.replace(/##\s*<environment_details>[\s\S]*?<\/environment_details>/gi, '');
  cleaned = cleaned.replace(/Current time:[\s\S]*?<\/environment_details>/gi, '</environment_details>');
  cleaned = cleaned.replace(/Working directory:[\s\S]*?<\/environment_details>/gi, '</environment_details>');
  cleaned = cleaned.replace(/Visible files:[\s\S]*?<\/environment_details>/gi, '</environment_details>');
  cleaned = cleaned.replace(/Open tabs:[\s\S]*?<\/environment_details>/gi, '</environment_details>');
  cleaned = cleaned.replace(/<environment_details[^>]*>[\s\S]*?<\/environment_details>/gi, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

type AiProvider = 'gemini' | 'groq' | 'mistral';

interface ResolvedProvider {
  provider: AiProvider;
  apiKey: string;
  apiUrl: string;
  model: string;
}

function isValidKey(key: string | undefined): boolean {
  return typeof key === 'string' && key.trim().length > 0;
}

function resolveAiProvider(): ResolvedProvider | null {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (isValidKey(geminiKey)) {
    return {
      provider: 'gemini',
      apiKey: geminiKey!.trim(),
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      model: 'gemini-2.5-flash',
    };
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (isValidKey(groqKey)) {
    return {
      provider: 'groq',
      apiKey: groqKey!.trim(),
      apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'openai/gpt-oss-120b',
    };
  }

  const mistralKey = process.env.MISTRAL_API_KEY;
  if (isValidKey(mistralKey)) {
    return {
      provider: 'mistral',
      apiKey: mistralKey!.trim(),
      apiUrl: (process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions').trim(),
      model: 'mistral-small-latest',
    };
  }

  return null;
}

function getProviderDisplayName(provider: AiProvider): string {
  return provider === 'gemini' ? 'Gemini' : provider === 'groq' ? 'Groq' : 'AI';
}

function getProviderErrorMessage(status: number, errorText: string, provider: AiProvider): string {
  const providerName = getProviderDisplayName(provider);

  if (status === 401) {
    return `${providerName} authentication failed. Please check your API key.`;
  }
  if (status === 402) {
    return `${providerName} service requires an active subscription or credits. Please check your ${providerName} account.`;
  }
  if (status === 404) {
    return `${providerName} model endpoint not available.`;
  }
  if (status === 429) {
    return `${providerName} service is busy. Please wait a moment and try again.`;
  }
  if (status === 500 || status === 502 || status === 503) {
    return `${providerName} service is temporarily unavailable. Please try again in a moment.`;
  }

  const lower = errorText.toLowerCase();
  if (lower.includes('subscription')) {
    return `${providerName} service requires an active subscription or credits. Please check your ${providerName} account.`;
  }
  if (lower.includes('quota') || lower.includes('rate limit')) {
    return `${providerName} service rate limit reached. Please wait a moment and try again.`;
  }

  return `${providerName} request failed: ${status} ${errorText}`;
}

const RETRYABLE_STATUSES = new Set([401, 402, 404, 429, 500, 502, 503, 504]);

function isRetryableError(status: number, errorText: string): boolean {
  if (RETRYABLE_STATUSES.has(status)) return true;
  const lower = errorText.toLowerCase();
  return lower.includes('rate limit') || lower.includes('quota') || lower.includes('timeout') || lower.includes('unavailable');
}

class ProviderError extends Error {
  status: number;
  provider: AiProvider;
  rawText: string;

  constructor(status: number, provider: AiProvider, rawText: string, message: string) {
    super(message);
    this.status = status;
    this.provider = provider;
    this.rawText = rawText;
  }
}

async function callGemini(apiKey: string, apiUrl: string, fullPrompt: string, maxTokens: number): Promise<{ text: string; provider: string; model: string }> {
  const payload = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
  };

  const url = `${apiUrl}?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const errorText = await response.text();

  if (!response.ok) {
    const message = getProviderErrorMessage(response.status, errorText, 'gemini');
    console.error(`[AI] Gemini failed with ${response.status}:`, errorText.slice(0, 200));
    throw new ProviderError(response.status, 'gemini', errorText, message);
  }

  const json = JSON.parse(errorText);
  const generatedText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleanedText = sanitizeAiOutput(generatedText);

  const finishReason = json?.candidates?.[0]?.finishReason || json?.candidates?.[0]?.finish_reason || null;

  console.log('[AI][Diagnostic] provider=gemini model=gemini-2.5-flash maxOutputTokens=' + maxTokens + ' textLength=' + cleanedText.length + ' finishReason=' + finishReason);

  return {
    text: cleanedText || 'Gemini returned an empty response.',
    provider: 'gemini',
    model: 'gemini-2.5-flash',
  };
}

async function callOpenAICompatible(
  apiKey: string,
  apiUrl: string,
  model: string,
  fullPrompt: string,
  maxTokens: number,
  provider: AiProvider
): Promise<{ text: string; provider: string; model: string }> {
  const payload = {
    model,
    messages: [{ role: 'user', content: fullPrompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const errorText = await response.text();

  if (!response.ok) {
    const message = getProviderErrorMessage(response.status, errorText, provider);
    console.error(`[AI] ${provider} failed with ${response.status}:`, errorText.slice(0, 200));
    throw new ProviderError(response.status, provider, errorText, message);
  }

  const json = JSON.parse(errorText);
  const generatedText = json?.choices?.[0]?.message?.content || '';
  const cleanedText = sanitizeAiOutput(generatedText);

  const finishReason = json?.choices?.[0]?.finish_reason || null;
  const providerLabel = provider === 'groq' ? 'Groq' : 'Mistral';

  console.log('[AI][Diagnostic] provider=' + provider + ' model=' + model + ' max_tokens=' + maxTokens + ' textLength=' + cleanedText.length + ' finishReason=' + finishReason);

  return {
    text: cleanedText || `${providerLabel} returned an empty response.`,
    provider,
    model,
  };
}

async function tryGenerate(
  fullPrompt: string,
  maxTokens: number,
  providers: ResolvedProvider[]
): Promise<{ text: string; provider: string; model: string }> {
  let lastError: ProviderError | null = null;

  for (const p of providers) {
    if (!p) continue;

    console.log(`[AI] Trying provider: ${p.provider} (${p.model})`);

    try {
      if (p.provider === 'gemini') {
        const result = await callGemini(p.apiKey, p.apiUrl, fullPrompt, maxTokens);
        return result;
      }

      const result = await callOpenAICompatible(p.apiKey, p.apiUrl, p.model, fullPrompt, maxTokens, p.provider);
      return result;
    } catch (err: any) {
      if (err instanceof ProviderError) {
        lastError = err;
        const retryable = isRetryableError(err.status, err.rawText);

        if (retryable && providers.length > 1) {
          console.log(`[AI] ${p.provider} failed (${err.status}), trying next provider...`);
          continue;
        }

        console.error(`[AI] ${p.provider} non-retryable error, stopping fallback.`);
      } else {
        console.error(`[AI] ${p.provider} unexpected error:`, err?.message || err);
      }

      throw err;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('AI is not configured. Set GEMINI_API_KEY, GROQ_API_KEY, or MISTRAL_API_KEY in your environment.');
}

function buildAllProviders(): ResolvedProvider[] {
  const allProviders: ResolvedProvider[] = [];

  const geminiKey = process.env.GEMINI_API_KEY;
  if (isValidKey(geminiKey)) {
    allProviders.push({
      provider: 'gemini',
      apiKey: geminiKey!.trim(),
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      model: 'gemini-2.5-flash',
    });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (isValidKey(groqKey)) {
    allProviders.push({
      provider: 'groq',
      apiKey: groqKey!.trim(),
      apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'openai/gpt-oss-120b',
    });
  }

  const mistralKey = process.env.MISTRAL_API_KEY;
  if (isValidKey(mistralKey)) {
    allProviders.push({
      provider: 'mistral',
      apiKey: mistralKey!.trim(),
      apiUrl: (process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions').trim(),
      model: 'mistral-small-latest',
    });
  }

  return allProviders;
}

export async function generateAiResponse(
  prompt: string,
  context?: string,
  options?: { provider?: string; maxTokens?: number }
): Promise<{ text: string; provider?: string; model?: string }> {
  const maxTokens = options?.maxTokens || 4000;
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

  console.log('[AI][Diagnostic] generateAiResponse called maxTokens=' + maxTokens + ' promptLength=' + fullPrompt.length + ' contextLength=' + (context?.length || 0));

  const requestedProvider = options?.provider as AiProvider | undefined;
  const allProviders = buildAllProviders();

  const providers = requestedProvider
    ? allProviders.filter(p => p.provider === requestedProvider)
    : allProviders;

  if (providers.length === 0) {
    return {
      text: 'AI is not configured. Set GEMINI_API_KEY, GROQ_API_KEY, or MISTRAL_API_KEY in your environment.',
      provider: 'none',
      model: 'none',
    };
  }

  try {
    const result = await tryGenerate(fullPrompt, maxTokens, providers);
    console.log('[AI][Diagnostic] generateAiResponse result provider=' + result.provider + ' model=' + result.model + ' textLength=' + result.text.length);
    return result;
  } catch (err: any) {
    if (err instanceof ProviderError) {
      console.error(`[AI] All providers failed. Last error: ${err.provider} ${err.status}`);
    } else {
      console.error('[AI] All providers failed:', err?.message || err);
    }

    return {
      text: 'Estech couldn\'t reach its AI services right now. Please try again in a moment.',
      provider: 'error',
      model: 'none',
    };
  }
}

export async function generateAiChatResponse(
  messages: Array<{ role: string; content: string }>,
  options?: { provider?: string; maxTokens?: number }
): Promise<{ text: string; provider?: string; model?: string }> {
  const maxTokens = options?.maxTokens || 50000;
  const fullPrompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

  const requestedProvider = options?.provider as AiProvider | undefined;
  const allProviders = buildAllProviders();

  const providers = requestedProvider
    ? allProviders.filter(p => p.provider === requestedProvider)
    : allProviders;

  if (providers.length === 0) {
    return {
      text: 'AI is not configured. Set GEMINI_API_KEY, GROQ_API_KEY, or MISTRAL_API_KEY in your environment.',
      provider: 'none',
      model: 'none',
    };
  }

  try {
    const result = await tryGenerate(fullPrompt, maxTokens, providers);
    return result;
  } catch (err: any) {
    if (err instanceof ProviderError) {
      console.error(`[AI] All providers failed. Last error: ${err.provider} ${err.status}`);
    } else {
      console.error('[AI] All providers failed:', err?.message || err);
    }

    return {
      text: 'Estech couldn\'t reach its AI services right now. Please try again in a moment.',
      provider: 'error',
      model: 'none',
    };
  }
}
