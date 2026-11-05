'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSiteUrl } from '@/lib/auth-helpers';
import { Loader2 } from 'lucide-react';

type OAuthProviderButtonProps = {
  id: 'google' | 'microsoft' | 'github';
  label: string;
  scopes: string;
  iconColor: string;
  loading?: boolean;
};

function toSupabaseProvider(id: OAuthProviderButtonProps['id']): 'azure' | 'github' | 'google' {
  if (id === 'microsoft') return 'azure';
  return id;
}

const GOOGLE_ICON = (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66v-2.77c-2.48-1.36-4.86-2.73-7.98-2.73-5.53 0-10.11 4.29-10.11 9.83v2.77c4.06 0 7.53-2.24 9.11-3.58 0-.01-.01-.03-.01-.04 0-.02.01-.04.01-.06z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.26-1.37-.25-2.85.08-4.15h2.75v2.26c-.89.57-1.64 1.35-2.06 2.26-.22.45-.36.92-.36 1.45 0 .92.23 1.8.56 2.57H3.27c1.38-2.07 3.52-3.51 6.06-3.51 1.37 0 2.61.37 3.66 1.02 1.05.65 1.84 1.53 2.3 2.56H7.52c-.69-.57-1.19-1.4-1.4-2.31-.17-.68-.17-1.38-.18-2.06z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64 1.15 1.08 1.82 2.55 1.82 4.21s-.67 3.13-1.82 4.21c-1.15 1.08-2.59 1.64-4.21 1.64s-3.06-.56-4.21-1.64c-1.15-1.08-1.82-2.55-1.82-4.21s.67-3.13 1.82-4.21c1.15-1.08 2.59-1.64 4.21-1.64zM12 1c-4.97 0-9.11 3.29-9.11 7.33s3.29 7.33 9.11 7.33 9.11-3.29 9.11-7.33c0-2.3-.58-4.48-1.5-6.35-1.14-2.33-3.37-3.96-5.9-3.96-1.59 0-3.06.6-4.17 1.56-.84.73-1.34 1.72-1.34 2.76 0 1.24.62 2.34 1.52 3.11 1.06.9 2.4 1.46 3.85 1.46s2.79-.56 3.85-1.46c.9-.78 1.52-1.87 1.52-3.11 0-1.04-.5-2.04-1.34-2.76-1.11-.96-2.58-1.56-4.17-1.56z"
    />
  </svg>
);

const MICROSOFT_ICON = (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="10" height="10" fill="#F25022" rx="1" />
    <rect x="12" y="2" width="10" height="10" fill="#7FBA00" rx="1" />
    <rect x="2" y="12" width="10" height="10" fill="#00A4EF" rx="1" />
    <rect x="12" y="12" width="10" height="10" fill="#FFB900" rx="1" />
  </svg>
);

const GITHUB_ICON = (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="#24292F"
      d="M12 2c-4.42 0-8 3.58-8 8 0 3.53 2.29 6.53 5.47 7.59 0.4 0.07 0.55-0.17 0.55-0.38 0-0.19-0.01-0.82-0.01-1.49-2.23 0.48-2.71-1.07-2.71-1.07-0.37-0.94-0.91-1.19-0.91-1.19-0.74-0.51 0.06-0.5 0.06-0.5 0.82 0.06 1.25 0.84 1.25 0.84 0.73 1.21 1.87 0.86 2.33 0.66 0.07-0.52 0.27-0.87 0.49-1.07-2.21-0.11-4.54-1.1-4.54-4.9 0-1.09 0.39-2.01 1.03-2.72-0.1-0.25-0.45-1.24 0.05-2.58 0 0 0.84-0.27 2.75 1.02 0.79-0.22 1.65-0.33 2.53-0.33 0.88 0 1.72 0.11 2.53 0.33 1.91-1.29 2.75-1.02 2.75-1.02 0.5 1.34 0.15 2.33 0.05 2.58 0.64 0.71 1.03 1.63 1.03 2.72 0 3.8-2.34 4.78-4.56 4.89 0.36 0.31 0.68 0.92 0.68 1.85 0 1.34-0.01 2.42-0.01 2.75 0 0.21 0.15 0.46 0.55 0.38 3.18-1.05 5.47-4.06 5.47-7.59 0-4.42-3.58-8-8-8z"
    />
  </svg>
);

function providerIcon(id: OAuthProviderButtonProps['id']) {
  if (id === 'google') return GOOGLE_ICON;
  if (id === 'microsoft') return MICROSOFT_ICON;
  return GITHUB_ICON;
}

export function OAuthProviderButton({
  id,
  label,
  scopes,
  iconColor,
  loading = false,
}: OAuthProviderButtonProps) {
  const router = useRouter();
  const [started, setStarted] = useState(false);

  const handleSignIn = async () => {
    if (started) return;
    setStarted(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: toSupabaseProvider(id),
        options: {
          scopes,
          redirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      setStarted(false);
      // eslint-disable-next-line no-alert
      alert(err?.message || `${id} sign-in failed. Please try again.`);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={loading || started}
      className={`flex items-center justify-center gap-2 w-full rounded-xl border border-border/60 bg-background-secondary/60 px-4 py-3 text-sm font-medium text-text-heading hover:bg-surface/60 transition disabled:opacity-50 min-h-[44px]`}
    >
      {loading || started ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        providerIcon(id)
      )}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}
