import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { generateAiResponse } from '@/lib/ai';

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
    return { error: 'Unauthorized', workspaceId: null, userId: null };
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('created_by', user.id)
    .limit(1)
    .single();

  return { supabase, userId: user.id, workspaceId: workspace?.id || null };
}

function buildDocumentsQuery(supabase: any, workspaceId: string, searchParams: URLSearchParams) {
  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId);

  const search = searchParams.get('search');
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const allowedSortFields = ['created_at', 'updated_at', 'title', 'type', 'status'];
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
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId } = result as any;

  if (!workspaceId) {
    return NextResponse.json({ documents: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  }

  const searchParams = request.nextUrl.searchParams;
  const { query, from, to, limit, page } = buildDocumentsQuery(supabase, workspaceId, searchParams);

  const { data: documents, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    documents: documents || [],
    total,
    page,
    limit,
    totalPages,
  });
}

export async function POST(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId, userId } = result as any;
  const body = await request.json();
  const { title, type, content, status } = body || {};

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  if (!title || !type || !content) {
    return NextResponse.json({ error: 'title, type, and content are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      workspace_id: workspaceId,
      title: title.trim(),
      type,
      content: content.trim(),
      status: status || 'draft',
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ document: data });
}

export async function PUT(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId, userId } = result as any;
  const body = await request.json();
  const { id, title, type, content, status } = body || {};

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updateData: any = { updated_by: userId };

  if (title !== undefined) updateData.title = title.trim();
  if (type !== undefined) updateData.type = type;
  if (content !== undefined) updateData.content = content.trim();
  if (status !== undefined) updateData.status = status;

  const { data, error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  return NextResponse.json({ document: data });
}

export async function DELETE(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, workspaceId } = result as any;
  const body = await request.json();
  const { id } = body || {};

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}