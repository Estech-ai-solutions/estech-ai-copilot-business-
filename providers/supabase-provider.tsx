'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Profile, Workspace } from '@/types';

type SupabaseContext = {
  user: User | null;
  profile: Profile | null;
  workspace: Workspace | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Context = createContext<SupabaseContext>({
  user: null,
  profile: null,
  workspace: null,
  loading: true,
  signOut: async () => {},
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(profileData);

        const { data: workspaceData } = await supabase
          .from('workspaces')
          .select('*')
          .eq('created_by', user.id)
          .limit(1)
          .single();

        setWorkspace(workspaceData);
      }

      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
        supabase
          .from('workspaces')
          .select('*')
          .eq('created_by', session.user.id)
          .limit(1)
          .single()
          .then(({ data }) => setWorkspace(data));
      } else {
        setProfile(null);
        setWorkspace(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Context.Provider value={{ user, profile, workspace, loading, signOut }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabaseContext = () => useContext(Context);