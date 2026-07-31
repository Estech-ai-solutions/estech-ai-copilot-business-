'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Brain, ArrowUpRight } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui';

type WorkspaceShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function WorkspaceShell({ title, description, children }: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-text-heading sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-text-muted leading-7">
            {description}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">{children}</div>
          
          <div className="space-y-6">
            <Card>
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <CardTitle>AI Recommendations</CardTitle>
                </div>
              </div>
              <div className="px-5 pb-4">
                <p className="text-sm text-text-muted">
                  Review priorities and update your knowledge base regularly.
                </p>
              </div>
            </Card>

            <Card>
              <div className="px-5 pt-4 pb-3">
                <CardTitle>Quick Links</CardTitle>
              </div>
              <div className="px-5 pb-4 space-y-2">
                <Link 
                  href="/dashboard" 
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-3.5 py-2.5 text-sm text-text-heading transition hover:bg-surface/60"
                >
                  <span>Dashboard</span>
                  <ArrowUpRight className="h-4 w-4 text-text-muted" />
                </Link>
                <Link 
                  href="/assistant" 
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-3.5 py-2.5 text-sm text-text-heading transition hover:bg-surface/60"
                >
                  <span>Ask Copilot</span>
                  <ArrowUpRight className="h-4 w-4 text-text-muted" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}