import { chunkText } from './chunking';
import { generateEmbedding } from './embeddings';

export async function createKnowledgeChunks(
  supabase: any,
  knowledgeId: string,
  sourceId: string | null,
  content: string,
  category: string,
  originalFilename?: string
): Promise<{ chunkCount: number; failed: boolean }> {
  const chunks = chunkText(content);
  const totalChunks = chunks.length;

  if (totalChunks === 0) {
    return { chunkCount: 0, failed: false };
  }

  let failed = false;

  for (let index = 0; index < totalChunks; index++) {
    const chunkContent = chunks[index];
    const embedding = await generateEmbedding(chunkContent);

    if (!embedding) {
      console.error(`[Knowledge] Failed to generate embedding for chunk ${index} of knowledge ${knowledgeId}`);
      failed = true;
      continue;
    }

    console.log(`[Knowledge] Stored chunk ${index + 1}/${totalChunks} for knowledge ${knowledgeId}, dimensions: ${embedding.length}`);

    const { error: chunkError } = await supabase.from('knowledge_chunks').insert({
      knowledge_id: knowledgeId,
      source_id: sourceId,
      chunk_index: index,
      chunk_count: totalChunks,
      content: chunkContent,
      embedding: embedding,
      metadata: {
        original_filename: originalFilename || null,
        category: category,
      },
    });

    if (chunkError) {
      console.error(`[Knowledge] Failed to insert chunk ${index}:`, chunkError);
      failed = true;
    }
  }

  return { chunkCount: totalChunks, failed };
}
