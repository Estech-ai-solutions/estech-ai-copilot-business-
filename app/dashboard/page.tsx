'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/site-nav';

type Counts = { knowledgeEntries: number; tasks: number; documents: number };
type Profile = { id: number; name: string; description?: string; created_at?: string };
type Usage = { totalTokens: number; totalRequests: number };

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('authToken') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/profile', { headers }).then((r) => r.json()),
      fetch('/api/usage', { headers }).then((r) => r.json())
    ])
      .then(([profileData, usageData]) => {
        if (profileData.profile) {
          setProfile(profileData.profile);
          setCounts(profileData.counts);
        }
        if (usageData.usage) {
          setUsage(usageData.usage);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav />
      <section className="section-container py-16">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
              📊
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Control Center</p>
              <h1 className="mt-1 text-3xl font-bold text-white">{profile?.name || 'Your Business'} Workspace</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-slate-300">
            Manage your business knowledge, generate documents, and handle customer conversations.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Stats Cards */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-400">Knowledge</p>
            <p className="mt-2 text-3xl font-semibold text-white">{counts?.knowledgeEntries ?? 0}</p>
            <p className="mt-1 text-xs text-slate-400">business facts stored</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-400">Tasks</p>
            <p className="mt-2 text-3xl font-semibold text-white">{counts?.tasks ?? 0}</p>
            <p className="mt-1 text-xs text-slate-400">action items tracked</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-400">Documents</p>
            <p className="mt-2 text-3xl font-semibold text-white">{counts?.documents ?? 0}</p>
            <p className="mt-1 text-xs text-slate-400">generated for clients</p>
          </div>
        </div>

        {/* Usage */}
        {usage && (
          <div className="mt-8 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-400">AI Usage</p>
            <div className="mt-4 flex gap-8">
              <div>
                <p className="text-slate-400">Tokens used</p>
                <p className="mt-1 text-2xl font-semibold text-white">{usage.totalTokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">Requests</p>
                <p className="mt-1 text-2xl font-semibold text-white">{usage.totalRequests}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/responses" className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition hover:border-slate-700">
              <p className="text-sm font-medium text-sky-400">✉️ Generate Reply</p>
              <p className="mt-2 text-slate-300">Customer response with your business context</p>
            </Link>
            <Link href="/documents" className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition hover:border-slate-700">
              <p className="text-sm font-medium text-sky-400">📄 Create Document</p>
              <p className="mt-2 text-slate-300">Quotes, invoices, proposals, contracts</p>
            </Link>
            <Link href="/knowledge" className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition hover:border-slate-700">
              <p className="text-sm font-medium text-sky-400">🧠 Knowledge Base</p>
              <p className="mt-2 text-slate-300">Update your business information</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}