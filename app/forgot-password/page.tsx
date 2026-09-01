'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Bot, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a password reset link.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center gap-2 justify-center">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-text-heading">Estech AI</span>
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-text-heading">Reset password</h1>
          <p className="text-sm text-text-muted mt-1">We'll email you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3">
              <span className="text-sm text-danger">{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 rounded-xl bg-success/10 border border-success/20 px-4 py-3">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-success">{message}</span>
            </div>
          )}

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
                disabled={loading || !!message}
                className="w-full pl-10 rounded-xl border border-border/60 bg-background-secondary/60 px-4 py-3 text-sm text-text-heading placeholder:text-text-muted outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!message}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </button>
        </form>

        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text-heading transition">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
