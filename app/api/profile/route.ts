import { NextResponse } from 'next/server';
import { getTokenFromHeader, verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const token = getTokenFromHeader(request);
  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }

  const profiles = await db.profiles();
  const profile = profiles.find((p: any) => p.id === payload.businessProfileId);
  if (!profile) {
    return NextResponse.json({ error: 'Business profile not found.' }, { status: 404 });
  }

  const businessProfileId = payload.businessProfileId ? Number(payload.businessProfileId) : undefined;

  const knowledge = businessProfileId ? await db.knowledge(businessProfileId) : [];
  const knowledgeCount = knowledge.length;

  const tasks = businessProfileId ? await db.tasks(businessProfileId) : [];
  const taskCount = tasks.length;

  const documents = businessProfileId ? await db.documents(businessProfileId) : [];
  const documentCount = documents.length;

  return NextResponse.json({
    profile,
    counts: {
      knowledgeEntries: knowledgeCount,
      tasks: taskCount,
      documents: documentCount
    }
  });
}

export async function PUT(request: Request) {
  const token = getTokenFromHeader(request);
  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, business_type, products, services, pricing_info } = body;

  const profiles = await db.profiles();
  const profileIndex = profiles.findIndex((p: any) => p.id === payload.businessProfileId);

  if (profileIndex === -1) {
    return NextResponse.json({ error: 'Business profile not found.' }, { status: 404 });
  }

  profiles[profileIndex] = {
    ...profiles[profileIndex],
    name: name ?? profiles[profileIndex].name,
    description: description ?? profiles[profileIndex].description,
    business_type: business_type ?? profiles[profileIndex].business_type,
    products: products ?? profiles[profileIndex].products,
    services: services ?? profiles[profileIndex].services,
    pricing_info: pricing_info ?? profiles[profileIndex].pricing_info
  };

  await db.saveProfiles(profiles);
  return NextResponse.json({ profile: profiles[profileIndex] });
}