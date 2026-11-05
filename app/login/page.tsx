'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Bot, Mail, Lock, ArrowLeft, AlertCircle, Loader2,
} from 'lucide-react';
import { Turnstile } from '@/components/auth/turnstile';
import { OAuthProviderButton } from '@/components/auth/oauth-provider-button';
import { getOAuthProviderConfigs, getSiteUrl, isCaptchaConfigured, isGuestDemoEnabled } from '@/lib/auth-helpers';
function classifyAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('captcha')) {
    return 'Please complete the CAPTCHA verification and try again.';
  }
  if (
    normalized.includes('not confirmed') ||
    normalized.includes('email not confirmed') ||
    normalized.includes('email_not_confirmed')
  ) {
    return 'Please verify your email before signing in. Check your inbox for the verification link.';
  }
  if (
    normalized.includes('too many requests') ||
    normalized.includes('too_many_requests') ||
    normalized.includes('rate limit')
  ) {
    return 'Too many sign-in attempts. Please wait a few minutes and try again.';
  }
  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid_credentials')
  ) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (normalized.includes('user not found') || normalized.includes('user_not_found')) {
    return 'No account found with this email. Please contact your workspace administrator or sign in with a connected account.';
  }
  if (
    normalized.includes('password should be at least') ||
    normalized.includes('weak_password')
  ) {
    return 'Password does not meet requirements. Please use a stronger password.';
  }
  return message;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);
  const router = useRouter();
  const captchaConfigured = isCaptchaConfigured();
  const providers = getOAuthProviderConfigs();
  const guestDemoEnabled = isGuestDemoEnabled();

  const handleOAuthStart = () => {
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResendMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: captchaConfigured ? captchaToken ?? undefined : undefined,
        },
      });

      if (error) {
        setError(classifyAuthError(error.message));
        turnstileRef.current?.reset();
        setCaptchaToken(null);
      } else if (data.user) {
        const onboardingRes = await fetch('/api/onboarding/status');
        const onboardingJson = await onboardingRes.json();

        if (!onboardingJson.completed) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      turnstileRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    setResendLoading(true);
    setResendMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          captchaToken: captchaConfigured ? captchaToken ?? undefined : undefined,
        },
      });
      if (error) {
        setError(error.message);
        turnstileRef.current?.reset();
        setCaptchaToken(null);
      } else {
        setResendMessage('Verification email sent! Check your inbox.');
      }
    } catch {
      setError('Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleDemo = () => {
    sessionStorage.setItem('estech_demo', 'true');
    router.push('/demo');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center gap-2 justify-center">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-text-heading">Estech AI</span>
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-text-heading">Welcome back</h1>
          <p className="text-sm text-text-muted mt-1">Sign in to your workspace</p>
        </div>

        <div className="space-y-3">
          {providers.map((p) => (
            <OAuthProviderButton
              key={p.id}
              id={p.id}
              label={p.label}
              scopes={p.scopes}
              iconColor={p.iconColor}
              loading={loading}
            />
          ))}

          {providers.length > 0 && (
            <div className="border-t border-border/40 pt-3 mb-2 text-center">
              <span className="text-xs text-text-muted">Or sign in with email</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-heading mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full pl-10 rounded-xl border border-border/60 bg-background-secondary/60 px-4 py-3 text-sm text-text-heading placeholder:text-text-muted outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-heading mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  disabled={loading}
                  className="w-full pl-10 rounded-xl border border-border/60 bg-background-secondary/60 px-4 py-3 text-sm text-text-heading placeholder:text-text-muted outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {captchaConfigured && (
              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
                  onVerify={setCaptchaToken}
                  onError={setError}
                  action="login"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (captchaConfigured && !captchaToken)}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-danger" />
              <span className="text-sm text-danger">{error}</span>
            </div>
          )}

          {resendMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-success/10 border border-success/20 px-4 py-3">
              <span className="text-sm text-success">{resendMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resendLoading || (captchaConfigured && !captchaToken)}
            className="text-sm text-primary hover:underline"
          >
            {resendLoading ? 'Sending...' : 'Resend verification email'}
          </button>

          <div className="border-t border-border/40 pt-4 space-y-2 text-center">
            <p className="text-xs text-text-muted">
              New to Estech?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Create your account
              </Link>{' '}
              using a connected account above.
            </p>
            <p className="text-xs text-text-muted">
              Email confirmation is required before signing in with email and password.
            </p>
          </div>
        </div>

        {guestDemoEnabled && (
          <div className="border-t border-border/40 pt-4 space-y-1 text-center">
            <button
              onClick={handleDemo}
              className="w-full rounded-xl border border-border/40 bg-background-secondary/60 px-4 py-3 text-sm font-medium text-text-heading hover:bg-surface/60 transition flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span className="text-xs font-bold text-primary">DEMO</span>
              Explore the demo
            </button>
            <p className="text-xs text-text-muted">
              Read-only demo with sample data. No account required.
            </p>
          </div>
        )}

        <Link href="/" className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text-heading transition">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
