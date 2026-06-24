import { NextResponse } from 'next/server';
import { getTokenFromHeader, verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateAiResponse } from '@/lib/ai';

function getUserId(request: Request): number | null {
  const token = getTokenFromHeader(request);
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    return payload.userId ? Number(payload.userId) : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ leads: [] });
  }
  const leads = await db.leads(userId ?? undefined);
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const userId = getUserId(request);
  const body = await request.json();
  const { business_name, website, location, industry, lead_score, reason, opportunity, suggested_service, status } = body;

  if (!business_name || !location || !industry) {
    return NextResponse.json({ error: 'business_name, location, and industry are required' }, { status: 400 });
  }

  const lead = {
    id: Date.now(),
    user_id: userId ?? 0,
    business_name,
    website: website || '',
    location,
    industry,
    lead_score: lead_score || Math.floor(Math.random() * 40) + 60,
    reason: reason || 'Potential customer match',
    opportunity,
    suggested_service,
    status: status || 'New',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const allLeads = await db.leads(userId ?? undefined);
  allLeads.push(lead);
  await db.saveLeads(allLeads);

  return NextResponse.json({ lead });
}

export async function PUT(request: Request) {
  const userId = getUserId(request);
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const allLeads = await db.leads(userId ?? undefined);
  const idx = allLeads.findIndex((l: any) => l.id === id);
  if (idx >= 0) {
    allLeads[idx] = { ...allLeads[idx], ...updates, updated_at: new Date().toISOString() };
    await db.saveLeads(allLeads);
    return NextResponse.json({ lead: allLeads[idx] });
  }

  return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
}

export async function DELETE(request: Request) {
  const userId = getUserId(request);
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const allLeads = await db.leads(userId ?? undefined);
  const filtered = allLeads.filter((l: any) => l.id !== id);
  await db.saveLeads(filtered);

  return NextResponse.json({ success: true });
}