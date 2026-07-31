import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
    return { error: 'Unauthorized', workspaceId: null };
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('created_by', user.id)
    .limit(1)
    .single();

  return { supabase, workspaceId: workspace?.id || null };
}

export async function POST(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId } = result as any;

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

  let query = supabase
    .from('knowledge')
    .select('id, title, category, content, tags, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(queryLimit);

  if (categories && Array.isArray(categories) && categories.length > 0) {
    query = query.in('category', categories);
  }

  if (tags && Array.isArray(tags) && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  const { data: entries, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  return NextResponse.json({
    query: searchTerm,
    results: results.slice(0, queryLimit),
    count: results.length,
  });
}