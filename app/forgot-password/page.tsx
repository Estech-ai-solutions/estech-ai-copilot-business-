'use client';

import Link from 'next/link';
import { Bot, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center gap-2 justify-center">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-text-heading">Estech AI</span>
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-text-heading">Password reset</h1>
          <p className="text-sm text-text-muted mt-1">
            Email delivery is not currently configured.
          </p>
        </div>

        <div className="rounded-xl border border-border/40 bg-background-secondary/60 p-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <h3 className="text-base font-medium text-text-heading">
                Password reset by email is unavailable
              </h3>
              <p className="text-sm text-text-muted">
                Estech cannot send password-reset emails until custom SMTP (for example Resend) is
                configured. Please use one of the sign-in options below instead.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              href="/login"
              className="w-full rounded-xl border border-border/40 bg-background-secondary/60 px-4 py-3 text-sm font-medium text-text-heading hover:bg-surface/60 transition text-center"
            >
              Go to sign in
            </Link>
          </div>
        </div>

        <p className="text-xs text-text-muted text-center">
          Once email delivery is configured, a password-reset link will be available here. Until then,
          please sign in with your connected account or contact your workspace administrator.
        </p>

        <Link href="/" className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text-heading transition">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
