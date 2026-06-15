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

  let logs: any[] = [];
  if (businessProfileId) {
    logs = await db.usageLogs(businessProfileId);
  }

  const totalTokens = logs.reduce((sum: number, l: any) => sum + (l.tokens_used || 0), 0);
  const totalRequests = logs.length;

  const featureCounts: Record<string, number> = {};
  logs.forEach((l: any) => {
    featureCounts[l.feature] = (featureCounts[l.feature] || 0) + 1;
  });

  return NextResponse.json({
    usage: {
      totalTokens,
      totalRequests,
      features: featureCounts,
      logs: logs.slice(-20)
    }
  });
}