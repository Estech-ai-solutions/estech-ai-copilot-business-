'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bot, Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash.includes('type=recovery')) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password updated successfully! Redirecting to sign in...');
        setTimeout(() => router.push('/login'), 2000);
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
          <h1 className="text-2xl font-semibold text-text-heading">New password</h1>
          <p className="text-sm text-text-muted mt-1">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-danger" />
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
            <label className="block text-xs font-medium text-text-heading mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                disabled={loading || !!message}
                className="w-full pl-10 rounded-xl border border-border/60 bg-background-secondary/60 px-4 py-3 text-sm text-text-heading placeholder:text-text-muted outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-heading mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
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
            Update password
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
