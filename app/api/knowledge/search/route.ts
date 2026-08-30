import { NextRequest, NextResponse } from 'next/server';
import { retrieveRelevantKnowledge } from '@/lib/knowledge/retrieval';
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

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  const body = await request.json();
  const { question, categories, tags, limit = 5 } = body || {};

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

  const searchTerm = question.trim();
  const queryLimit = Math.min(20, Math.max(1, parseInt(limit as string) || 5));

  const categoryFilter = Array.isArray(categories) && categories.length > 0 ? categories : undefined;

  const results = await retrieveRelevantKnowledge(
    supabase,
    workspaceId,
    searchTerm,
    {
      limit: queryLimit,
      category: categoryFilter,
    }
  );

  const formattedResults = results.map((entry) => ({
    id: entry.id,
    title: entry.title,
    content: entry.content,
    category: entry.category,
    source_id: entry.source_id ?? null,
    original_filename: entry.original_filename ?? null,
    source_type: entry.source_type,
    relevanceScore: entry.relevance_score,
  }));

  return NextResponse.json({
    query: searchTerm,
    results: formattedResults.slice(0, queryLimit),
    count: formattedResults.length,
  });
}
