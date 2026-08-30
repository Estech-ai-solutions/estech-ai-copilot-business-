import { NextRequest, NextResponse } from 'next/server';
import { getUserAndWorkspace } from '@/lib/auth-server';
import { createKnowledgeChunks } from '@/lib/knowledge/indexing';

function buildKnowledgeQuery(supabase: any, workspaceId: string, searchParams: URLSearchParams) {
  let query = supabase
    .from('knowledge')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId);

  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const sourceType = searchParams.get('source_type');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (sourceType) {
    query = query.eq('source_type', sourceType);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const allowedSortFields = ['created_at', 'updated_at', 'title', 'category'];
  if (allowedSortFields.includes(sortBy)) {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { query, from, to, limit, page };
}

export async function GET(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;

  if (!workspaceId) {
    return NextResponse.json({ entries: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  }

  const searchParams = request.nextUrl.searchParams;
  const { query, from, to, limit, page } = buildKnowledgeQuery(supabase, workspaceId, searchParams);

  const { data: entries, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    entries: entries || [],
    total,
    page,
    limit,
    totalPages,
  });
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
  const { title, category, content, tags } = body || {};

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  }

  const normalizedTags = Array.isArray(tags)
    ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const { data, error } = await supabase
    .from('knowledge')
    .insert({
      workspace_id: workspaceId,
      title: title.trim(),
      category: category?.trim() || 'general',
      content: content.trim(),
      tags: normalizedTags,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A knowledge entry with this title and category already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await createKnowledgeChunks(supabase, data.id, null, content.trim(), category?.trim() || 'general');
  } catch (error) {
    console.error('[Knowledge] Failed to create chunks for manual entry:', error);
  }

  return NextResponse.json({ entry: data });
}

export async function PUT(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;
  const body = await request.json();
  const { id, title, category, content, tags } = body || {};

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updateData: any = { updated_by: userId };

  if (title !== undefined) updateData.title = title.trim();
  if (category !== undefined) updateData.category = category.trim() || 'general';
  if (content !== undefined) updateData.content = content.trim();
  if (tags !== undefined) {
    updateData.tags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : [];
  }

  const { data, error } = await supabase
    .from('knowledge')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A knowledge entry with this title and category already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  if (content !== undefined) {
    try {
      await supabase.from('knowledge_chunks').delete().eq('knowledge_id', id);
      await createKnowledgeChunks(supabase, id, null, content.trim(), category?.trim() || data.category);
    } catch (error) {
      console.error('[Knowledge] Failed to update chunks:', error);
    }
  }

  return NextResponse.json({ entry: data });
}

export async function DELETE(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId } = result;
  const body = await request.json();
  const { id } = body || {};

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('knowledge')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
