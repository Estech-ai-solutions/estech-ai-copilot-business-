'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';
import { getOAuthProviderConfigs } from '@/lib/auth-helpers';
import { OAuthProviderButton } from '@/components/auth/oauth-provider-button';

export default function RegisterPage() {
  const [providers, setProviders] = useState<ReturnType<typeof getOAuthProviderConfigs>>(
    [],
  );

  useEffect(() => {
    setProviders(getOAuthProviderConfigs());
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center gap-2 justify-center">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-text-heading">Estech AI</span>
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-text-heading">Account creation</h1>
          <p className="text-sm text-text-muted mt-1">
            Public email and password registration is currently disabled while
            email delivery is being configured.
          </p>
        </div>

        <div className="rounded-xl border border-border/40 bg-background-secondary/60 p-5">
          <h3 className="text-base font-medium text-text-heading mb-3">Sign in instead</h3>
          <p className="text-sm text-text-muted mb-4">
            If you already have an account, sign in with your email and password or a connected account below.
          </p>

          <div className="space-y-2">
            {providers.map((p) => (
              <OAuthProviderButton
                key={p.id}
                id={p.id}
                label={p.label}
                scopes={p.scopes}
                iconColor={p.iconColor}
              />
            ))}
          </div>

          <div className="border-t border-border/40 pt-4 space-y-1 text-center">
            <Link
              href="/login"
              className="w-full rounded-xl border border-border/40 bg-background-secondary/60 px-4 py-3 text-sm font-medium text-text-heading hover:bg-surface/60 transition text-center"
            >
              Go to sign in
            </Link>
          </div>
        </div>

        <p className="text-xs text-text-muted text-center">
          New accounts can be created using a connected account (Google, Microsoft, or GitHub) once the
          corresponding provider is enabled. Email confirmation is required before signing in with a
          password.
        </p>

        <Link href="/" className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text-heading transition">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
