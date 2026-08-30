import { generateEmbedding } from './embeddings';

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  source_type: string;
  original_filename?: string;
  relevance_score: number;
  source_id?: string;
}

async function semanticSearch(
  supabase: any,
  workspaceId: string,
  queryEmbedding: number[],
  limit: number
): Promise<KnowledgeSearchResult[]> {
  try {
    const { data: chunkRows, error: chunkError } = await supabase.rpc(
      'match_knowledge_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: limit,
        p_workspace_id: workspaceId,
      }
    );

    if (chunkError || !chunkRows || chunkRows.length === 0) {
      return [];
    }

    const knowledgeIds = Array.from(
      new Set(chunkRows.map((row: any) => row.knowledge_id))
    );

    const { data: knowledgeRows, error: knowledgeError } = await supabase
      .from('knowledge')
      .select('id, title, category, source_type, original_filename')
      .in('id', knowledgeIds);

    if (knowledgeError || !knowledgeRows) {
      return [];
    }

    const knowledgeRowsData = knowledgeRows as any[];
    const knowledgeMap = new Map(
      knowledgeRowsData.map((k) => [k.id, k])
    );

    const seen = new Set<string>();
    const results: KnowledgeSearchResult[] = [];

    for (const row of chunkRows) {
      const knowledgeId = row.knowledge_id as string;
      if (seen.has(knowledgeId)) {
        continue;
      }
      seen.add(knowledgeId);

      const knowledge = knowledgeMap.get(knowledgeId);
      if (!knowledge) {
        continue;
      }

      results.push({
        id: knowledge.id,
        title: knowledge.title,
        content: row.content,
        category: knowledge.category,
        source_type: knowledge.source_type,
        original_filename: knowledge.original_filename ?? undefined,
        relevance_score: row.relevance_score ?? 0,
        source_id: row.source_id ?? undefined,
      });
    }

    return results;
  } catch {
    return [];
  }
}

async function keywordSearch(
  supabase: any,
  workspaceId: string,
  query: string,
  limit: number,
  categories?: string[]
): Promise<KnowledgeSearchResult[]> {
  try {
    const terms = query
      .split(/\s+/)
      .filter((t) => t.length > 0)
      .map((t) => `%${t}%`);

    if (terms.length === 0) {
      return [];
    }

    const orClauses = terms
      .map((term) => `title.ilike.${term},content.ilike.${term}`)
      .join(',');

    let builder = supabase
      .from('knowledge')
      .select('id, title, content, category, source_type, original_filename')
      .eq('workspace_id', workspaceId)
      .or(orClauses)
      .limit(limit);

    if (categories && categories.length > 0) {
      builder = builder.in('category', categories);
    }

    const { data: rows, error } = await builder;

    if (error || !rows) {
      return [];
    }

    return rows.map((row: Record<string, any>) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      source_type: row.source_type,
      original_filename: row.original_filename ?? undefined,
      relevance_score: 0.1,
    }));
  } catch {
    return [];
  }
}

function combineAndRank(
  semanticResults: KnowledgeSearchResult[],
  keywordResults: KnowledgeSearchResult[]
): KnowledgeSearchResult[] {
  const seen = new Map<string, KnowledgeSearchResult>();

  for (const result of [...semanticResults, ...keywordResults]) {
    const existing = seen.get(result.id);
    if (!existing) {
      seen.set(result.id, result);
    } else if (result.relevance_score > existing.relevance_score) {
      seen.set(result.id, result);
    }
  }

  return Array.from(seen.values()).sort(
    (a, b) => b.relevance_score - a.relevance_score
  );
}

export async function retrieveRelevantKnowledge(
  supabase: any,
  workspaceId: string,
  query: string,
  options: { limit?: number; category?: string[] } = {}
): Promise<KnowledgeSearchResult[]> {
  if (!supabase || !workspaceId || !query || query.trim().length === 0) {
    return [];
  }

  const limit = options.limit ?? 5;
  const categories = options.category;

  const queryEmbedding = await generateEmbedding(query);
  const semanticResults = queryEmbedding
    ? await semanticSearch(supabase, workspaceId, queryEmbedding, limit)
    : [];

  if (semanticResults.length > 0) {
    return semanticResults.slice(0, limit);
  }

  const keywordResults = await keywordSearch(
    supabase,
    workspaceId,
    query,
    limit,
    categories
  );

  return keywordResults.slice(0, limit);
}

export function buildKnowledgeContext(
  results: KnowledgeSearchResult[]
): string {
  if (!results || results.length === 0) {
    return '';
  }

  const parts: string[] = [
    'Use the following knowledge base entries to answer the user\'s question. Always cite the source using the provided title and category.',
    '',
  ];

  for (const result of results) {
    const sourceInfo = result.original_filename
      ? `${result.title} (${result.category} — ${result.original_filename})`
      : `${result.title} (${result.category})`;

    parts.push(`[Source: ${sourceInfo}]`);
    parts.push(result.content.trim());
    parts.push('');
  }

  return parts.join('\n');
}
