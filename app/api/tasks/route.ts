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
  const allTasks = await db.tasks(businessProfileId ?? undefined);
  return NextResponse.json({ tasks: allTasks });
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title || '').trim();
  const priority = String(body.priority || 'Medium').trim();
  const dueDate = body.due_date ? String(body.due_date).trim() : null;

  if (!title) {
    return NextResponse.json({ error: 'Task title is required.' }, { status: 400 });
  }

  const businessProfileId = getBusinessProfileId(request);
  const task = {
    id: Date.now(),
    business_profile_id: businessProfileId,
    title,
    priority: priority || 'Medium',
    due_date: dueDate,
    status: 'Pending',
    created_at: new Date().toISOString()
  };

  const allTasks = await db.tasks(businessProfileId ?? undefined);
  allTasks.push(task);
  await db.saveTasks(allTasks);
  return NextResponse.json({ task });
}