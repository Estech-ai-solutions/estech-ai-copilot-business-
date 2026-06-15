import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name = String(body.name || '').trim();
  const businessName = String(body.businessName || '').trim();
  const description = String(body.description || '').trim();

  if (!email || !password || !businessName) {
    return NextResponse.json({ error: 'Email, password, and business name are required.' }, { status: 400 });
  }

  const users = await db.users();
  if (users.some((u: any) => u.email === email)) {
    return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 400 });
  }

  const userId = Date.now();
  const passwordHash = hashPassword(password);
  const user = { id: userId, email, password_hash: passwordHash, name, created_at: new Date().toISOString() };
  users.push(user);
  await db.saveUsers(users);

  const profiles = await db.profiles();
  const businessProfileId = Date.now() + 1;
  const profile = { id: businessProfileId, user_id: userId, name: businessName, description, created_at: new Date().toISOString() };
  profiles.push(profile);
  await db.saveProfiles(profiles);

  const token = signToken({ userId, businessProfileId, email, name });

  return NextResponse.json({
    user: { id: userId, email, name },
    businessProfile: { id: businessProfileId, name: businessName, description },
    token
  });
}