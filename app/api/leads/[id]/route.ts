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
    return NextResponse.json({ lead: null }, { status: 401 });
  }

  const allLeads = await db.leads(userId ?? undefined);
  const lead = allLeads.find((l: any) => l.id === leadId);

  if (!lead) {
    return NextResponse.json({ lead: null }, { status: 404 });
  }

  return NextResponse.json({ lead });
}