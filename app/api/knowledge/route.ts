import { NextResponse } from 'next/server';
import { getTokenFromHeader, verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

function getBusinessProfileId(request: Request) {
  const token = getTokenFromHeader(request);
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    return payload.businessProfileId ? Number(payload.businessProfileId) : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const businessProfileId = getBusinessProfileId(request);
  if (!businessProfileId) {
    return NextResponse.json({ entries: [] });
  }
  const entries = await db.knowledge(businessProfileId);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, type, content } = body || {};
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  }

  const businessProfileId = getBusinessProfileId(request);
  if (!businessProfileId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const entry = {
    id: Date.now(),
    business_profile_id: businessProfileId,
    type: type ?? 'general',
    title,
    content,
    created_at: new Date().toISOString()
  };

  const allEntries = await db.knowledge();
  allEntries.push(entry);
  await db.saveKnowledge(allEntries);
  return NextResponse.json({ entry });
}