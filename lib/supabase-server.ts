import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

type CookieSetter = {
  set: (name: string, value: string, options?: any) => void;
  delete: (name: string, options?: any) => void;
};

export const createClient = (request: NextRequest, response: NextResponse) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const cookies: Record<string, string> = {};
  request.cookies.getAll().forEach((cookie) => {
    cookies[cookie.name] = cookie.value;
  });

  const cookieSetter: CookieSetter = {
    set: (name: string, value: string, options?: any) => {
      response.cookies.set(name, value, options);
    },
    delete: (name: string, options?: any) => {
      // @ts-ignore Next.js Response cookies typing is stricter than runtime here
      response.cookies.delete(name, options);
    },
  };

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => cookies[name],
      set: (name: string, value: string, options?: any) => {
        cookies[name] = value;
        cookieSetter.set(name, value, options);
      },
      delete: (name: string, options?: any) => {
        delete cookies[name];
        cookieSetter.delete(name, options);
      },
    },
  });
};