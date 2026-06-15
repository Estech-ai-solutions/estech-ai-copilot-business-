import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const users = await db.users();
  const user = users.find((u: any) => u.email === email);
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const valid = verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const profiles = await db.profiles();
  const profile = profiles.find((p: any) => p.user_id === user.id);

  const businessProfileId = profile ? Number(profile.id) : null;
  const token = signToken({ userId: user.id, businessProfileId, email, name: user.name });

  return NextResponse.json({
    user: { id: user.id, email, name: user.name },
    businessProfile: profile || null,
    token
  });
}