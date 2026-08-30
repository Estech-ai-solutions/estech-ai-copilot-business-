const GEMINI_EMBEDDING_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';
const EMBEDDING_DIMENSIONS = 768;

const cache = new Map<string, number[]>();

function getCacheKey(text: string): string {
  return text.trim();
}

export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIMENSIONS;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const cacheKey = getCacheKey(text);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[embeddings] GEMINI_API_KEY is not set');
    return null;
  }

  try {
    console.log(`[Embeddings] Generating embedding with gemini-embedding-001 for text length ${text.trim().length}`);

    const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text: text.trim() }],
        },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[embeddings] Gemini API error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();

    if (!data.embedding || !Array.isArray(data.embedding.values)) {
      console.error('[embeddings] Unexpected response format from Gemini', data);
      return null;
    }

    const embedding = data.embedding.values as number[];
    
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      console.error(`[embeddings] Unexpected embedding dimensions: ${embedding.length}, expected ${EMBEDDING_DIMENSIONS}`);
      return null;
    }

    cache.set(cacheKey, embedding);
    console.log(`[Embeddings] Success: ${embedding.length} dimensions`);
    return embedding;
  } catch (error) {
    console.error('[embeddings] Failed to generate embedding:', error);
    return null;
  }
}
