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
  const allDocs = await db.documents(businessProfileId ?? undefined);
  return NextResponse.json({ documents: allDocs });
}

export async function POST(request: Request) {
  const businessProfileId = getBusinessProfileId(request);
  const body = await request.json();
  const { title, type, content } = body || {};

  if (!title || !type || !content) {
    return NextResponse.json({ error: 'title, type, and content are required' }, { status: 400 });
  }

  const doc = {
    id: Date.now(),
    business_profile_id: businessProfileId,
    title,
    type,
    content,
    created_at: new Date().toISOString()
  };

  const allDocs = await db.documents(businessProfileId ?? undefined);
  allDocs.push(doc);
  await db.saveDocuments(allDocs);

  return NextResponse.json({ document: doc });
}