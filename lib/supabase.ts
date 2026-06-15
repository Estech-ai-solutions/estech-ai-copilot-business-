import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

let _supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e: any) {
    console.warn('Failed to initialize Supabase client:', e?.message ?? e);
    _supabase = null;
  }
}

export const supabase = _supabase;
