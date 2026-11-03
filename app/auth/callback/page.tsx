'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const complete = async () => {
      try {
        // The OAuth provider redirects back with ?code=... (or ?error=...)
        // on the current window location.
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const code = params.get('code');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');

        if (errorParam) {
          setError(errorDescription || errorParam);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('Missing authorization code.');
          setLoading(false);
          return;
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          setLoading(false);
          return;
        }

        // On first sign-in the user may not have a profile/workspace yet.
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, onboarding_completed')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        if (!profile || !profile.onboarding_completed) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } catch (err: any) {
        setError(err?.message || 'Sign-in failed.');
      } finally {
        setLoading(false);
      }
    };

    complete();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-text-muted">Signing you in…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Mail className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 mx-auto text-primary h-8 w-8" />
        {error ? (
          <div>
            <h1 className="text-2xl font-semibold text-text-heading">Sign-in failed</h1>
            <p className="text-sm text-danger">{error}</p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold text-text-heading">Signed in</h1>
            <p className="text-sm text-text-muted">Redirecting to your workspace…</p>
          </div>
        )}
        <button
          onClick={() => router.push('/login')}
          className="rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-2 text-sm text-primary hover:bg-surface/60 transition"
        >
          Go to sign in
        </button>
      </div>
    </div>
  );
}
