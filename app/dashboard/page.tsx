'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/site-nav';

type Counts = { knowledgeEntries: number; tasks: number; documents: number };
type Profile = { id: number; name: string; description?: string; created_at?: string };
type Usage = { totalTokens: number; totalRequests: number };

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

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

  const timeOfDay = getTimeOfDay();
  const businessName = profile?.name || 'Your Business';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav />
      
      <section className="section-container py-12">
        {/* Hero Section */}
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            {timeOfDay}, {profile?.name?.split(' ')[0] || ''}
          </h1>
          <p className="mt-4 text-xl text-slate-300">
            Estech AI Copilot is ready.
          </p>
          <p className="mt-6 text-sm text-slate-400">
            Today your AI workforce has:
          </p>
          
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <span className="text-slate-300">• Documents generated: {counts?.documents ?? 0}</span>
            <span className="text-slate-300">• Customer conversations: {usage?.totalRequests ?? 0}</span>
            <span className="text-slate-300">• Knowledge available: {counts?.knowledgeEntries ?? 0}</span>
            <span className="text-sky-400">• Estimated hours saved: {Math.floor((usage?.totalRequests ?? 0) * 0.25)}</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon="📧"
            title="Conversations"
            value={usage?.totalRequests ?? 0}
            trend="+12% this week"
            subtitle="messages processed"
          />
          <KpiCard
            icon="📄"
            title="Documents"
            value={counts?.documents ?? 0}
            trend="+8% this week"
            subtitle="generated for clients"
          />
          <KpiCard
            icon="🧠"
            title="Knowledge"
            value={counts?.knowledgeEntries ?? 0}
            trend="base active"
            subtitle="business facts stored"
          />
          <KpiCard
            icon="✅"
            title="Tasks"
            value={counts?.tasks ?? 0}
            trend={counts?.tasks ? `${counts.tasks} active` : 'Ready to track'}
            subtitle="action items"
          />
        </div>

        {/* Main Workspace */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {/* Action Tiles */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-white">Workspaces</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <WorkspaceTile
                href="/responses"
                icon="💬"
                title="Communication Studio"
                description="Generate professional customer replies with your business context"
              />
              <WorkspaceTile
                href="/documents"
                icon="📄"
                title="Document Studio"
                description="Create quotes, invoices, proposals clients can download"
              />
              <WorkspaceTile
                href="/knowledge"
                icon="🧠"
                title="Business Brain"
                description="Store pricing, services, policies for accurate AI responses"
              />
              <WorkspaceTile
                href="/tasks"
                icon="✅"
                title="Task Manager"
                description="Track work and convert AI suggestions to action items"
              />
            </div>
          </div>

          {/* AI Status & Insights */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
              <h3 className="text-sm font-medium text-white">AI Status</h3>
              <div className="mt-4 space-y-3">
                <StatusRow label="Knowledge Connected" status="online" />
                <StatusRow label="Model Online" status="online" />
                <StatusRow label="Memory Ready" status="online" />
                <StatusRow label="Business Context" status={profile ? 'loaded' : 'needs setup'} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
              <h3 className="text-sm font-medium text-white">AI Insights</h3>
              <div className="mt-4 space-y-3 text-sm">
                {!profile && (
                  <p className="text-sky-400">Complete your business profile for personalized responses.</p>
                )}
                {counts?.knowledgeEntries === 0 && (
                  <p className="text-sky-400">Add knowledge base entries for accurate customer replies.</p>
                )}
                {counts?.tasks && counts.tasks > 0 && (
                  <p className="text-slate-300">You have {counts.tasks} tasks to manage today.</p>
                )}
                {counts?.documents > 0 && (
                  <p className="text-slate-300">Your documents library is growing. Keep creating.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ icon, title, value, trend, subtitle }: {
  icon: string;
  title: string;
  value: number | string;
  trend: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 transition hover:border-slate-700">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">{title}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-sky-400">{trend} • {subtitle}</p>
    </div>
  );
}

function WorkspaceTile({ href, icon, title, description }: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 transition-all hover:border-sky-500/50 hover:bg-slate-900/80">
      <div className="flex items-start justify-between">
        <div className="text-2xl">{icon}</div>
        <span className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">→</span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </Link>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  const isOnline = status === 'online' || status === 'loaded';
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-sky-400'}`}>
        {isOnline ? '✓ Ready' : status}
      </span>
    </div>
  );
}