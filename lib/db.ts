import { createClient } from '@supabase/supabase-js';
import { localDb } from './local-db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
export let useSupabase = false;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    useSupabase = true;
  } catch (e) {
    console.warn('Supabase connection failed, falling back to local storage:', e);
  }
}

export const db = {
  // Users
  async users() {
    if (useSupabase && supabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (error) return localDb.users();
      return data || [];
    }
    return localDb.users();
  },

  async saveUsers(data: any[]) {
    if (useSupabase && supabase) {
      const { error } = await supabase.from('users').upsert(data);
      if (!error) return;
    }
    return localDb.saveUsers(data);
  },

  // Profiles
  async profiles() {
    if (useSupabase && supabase) {
      const { data, error } = await supabase.from('business_profiles').select('*');
      if (error) return localDb.profiles();
      return data || [];
    }
    return localDb.profiles();
  },

  async saveProfiles(data: any[]) {
    if (useSupabase && supabase) {
      const { error } = await supabase.from('business_profiles').upsert(data);
      if (!error) return;
    }
    return localDb.saveProfiles(data);
  },

  // Knowledge
  async knowledge(businessProfileId?: number) {
    if (useSupabase && supabase && businessProfileId) {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('business_profile_id', businessProfileId);
      if (error) return localDb.knowledge(businessProfileId);
      return data || [];
    }
    return localDb.knowledge(businessProfileId);
  },

  async saveKnowledge(data: any[]) {
    if (useSupabase && supabase) {
      const { error } = await supabase.from('knowledge_base').upsert(data);
      if (!error) return;
    }
    return localDb.saveKnowledge(data);
  },

  // Tasks
  async tasks(businessProfileId?: number) {
    if (useSupabase && supabase && businessProfileId) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('business_profile_id', businessProfileId);
      if (error) return localDb.tasks(businessProfileId);
      return data || [];
    }
    return localDb.tasks(businessProfileId);
  },

  async saveTasks(data: any[]) {
    if (useSupabase && supabase) {
      const { error } = await supabase.from('tasks').upsert(data);
      if (!error) return;
    }
    return localDb.saveTasks(data);
  },

  // Documents
  async documents(businessProfileId?: number) {
    if (useSupabase && supabase && businessProfileId) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('business_profile_id', businessProfileId);
      if (error) return localDb.documents(businessProfileId);
      return data || [];
    }
    return localDb.documents(businessProfileId);
  },

  async saveDocuments(data: any[]) {
    if (useSupabase && supabase) {
      const { error } = await supabase.from('documents').upsert(data);
      if (!error) return;
    }
    return localDb.saveDocuments(data);
  },

  // Usage logs
  async usageLogs(businessProfileId?: number) {
    if (useSupabase && supabase && businessProfileId) {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('business_profile_id', businessProfileId);
      if (error) return localDb.usageLogs(businessProfileId);
      return data || [];
    }
    return localDb.usageLogs(businessProfileId);
  },

  async saveUsageLogs(data: any[]) {
    if (useSupabase && supabase) {
      const { error } = await supabase.from('usage_logs').upsert(data);
      if (!error) return;
    }
    return localDb.saveUsageLogs(data);
  }
};