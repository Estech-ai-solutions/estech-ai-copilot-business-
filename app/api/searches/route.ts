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

export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ searches: [] });
  }
  const searches = await db.leadSearches(userId);
  return NextResponse.json({ searches });
}