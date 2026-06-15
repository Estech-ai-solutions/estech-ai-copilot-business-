import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
const JWT_EXPIRES_IN = '7d';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
let useSupabase = false;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    useSupabase = true;
  } catch {
    // Fall through to local auth
  }
}

export function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
}

export function verifyPassword(password: string, hash: string) {
  return hashPassword(password) === hash;
}

export function signToken(payload: Record<string, any>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as Record<string, any>;
}

export function getTokenFromHeader(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function getUser(request?: Request): Promise<{ id: number; email: string; name?: string } | null> {
  const token = request
    ? getTokenFromHeader(request)
    : typeof window !== 'undefined'
      ? window.localStorage.getItem('authToken')
      : null;

  if (!token) return null;

  try {
    const payload = verifyToken(token);
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name
    };
  } catch {
    return null;
  }
}

export async function signInWithSupabase(email: string, password: string) {
  if (!useSupabase || !supabase) return { error: 'Supabase not configured' };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  return { user: data.user, session: data.session };
}

export async function signUpWithSupabase(email: string, password: string, name?: string) {
  if (!useSupabase || !supabase) return { error: 'Supabase not configured' };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  if (error) return { error: error.message };

  return { user: data.user };
}

export async function signOut() {
  if (useSupabase && supabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('authToken');
  }
}