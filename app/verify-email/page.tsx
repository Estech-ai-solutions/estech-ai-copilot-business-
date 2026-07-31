'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bot, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const verify = async () => {
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const params = new URLSearchParams(hash);
        const token = params.get('token') || '';

        if (!token) {
          setError('Invalid verification link');
          setLoading(false);
          return;
        }

        // @ts-ignore auth-js typings are stricter than runtime here
        const { error } = await supabase.auth.verifyOtp({
          token,
          type: 'signup',
        });

        if (error) {
          setError(error.message);
        } else {
          setMessage('Email verified successfully! Redirecting...');
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      } catch {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Link href="/" className="flex items-center gap-2 justify-center">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-text-heading">Estech AI</span>
        </Link>

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 mx-auto">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-semibold text-text-heading">Verify your email</h1>

        {loading && (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-text-muted">Verifying...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-danger mx-auto mb-2" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {message && (
          <div className="rounded-xl bg-success/10 border border-success/20 px-4 py-3">
            <CheckCircle className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="text-sm text-success">{message}</p>
          </div>
        )}

        <Link href="/login" className="block text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}