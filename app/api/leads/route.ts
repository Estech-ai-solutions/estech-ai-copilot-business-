import { NextRequest, NextResponse } from 'next/server';
import { getUserAndWorkspace } from '@/lib/auth-server';

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
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: leads || [] });
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

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  const body = await request.json();
  const { business_name, contact_name, email, phone, website, location, address, city, state, industry, description, source_url, status, lead_score } = body || {};

  if (!business_name) {
    return NextResponse.json({ error: 'business_name is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      business_name,
      contact_name,
      email,
      phone,
      website,
      location,
      address,
      city,
      state,
      industry,
      description,
      source_url,
      status: status || 'new',
      lead_score: lead_score || 60,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead: data });
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
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ lead: data });
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
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
