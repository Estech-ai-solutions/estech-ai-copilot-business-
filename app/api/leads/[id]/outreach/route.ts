import { NextResponse } from 'next/server';
import { getTokenFromHeader, verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserId(request);
  const leadId = Number(params.id);

  if (!userId) {
    return NextResponse.json({ outreach: [] }, { status: 401 });
  }

  const outreach = await db.outreach(leadId);
  return NextResponse.json({ outreach });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserId(request);
  const leadId = Number(params.id);
  const body = await request.json();
  const { type, content } = body;

  if (!type || !content) {
    return NextResponse.json({ error: 'type and content are required' }, { status: 400 });
  }

  const outreach = {
    id: Date.now(),
    lead_id: leadId,
    user_id: userId ?? 0,
    type,
    content,
    status: 'Draft',
    created_at: new Date().toISOString()
  };

  const allOutreach = await db.outreach(leadId);
  await db.saveOutreach([outreach, ...allOutreach]);

  return NextResponse.json({ outreach });
}