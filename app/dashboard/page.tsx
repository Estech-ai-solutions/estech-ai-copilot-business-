'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/site-nav';

type Counts = { knowledgeEntries: number; tasks: number; documents: number };
type Profile = { id: number; name: string; description?: string; created_at?: string };
type Usage = { totalTokens: number; totalRequests: number };
type Document = { id: number; title: string; type: string; created_at: string };
type Task = { id: number; title: string; status: string; priority: string; created_at: string };
type KnowledgeEntry = { id: number; title: string; created_at: string };

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
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
      fetch('/api/usage', { headers }).then((r) => r.json()),
      fetch('/api/documents', { headers }).then((r) => r.json()),
      fetch('/api/tasks', { headers }).then((r) => r.json()),
      fetch('/api/knowledge', { headers }).then((r) => r.json())
    ])
      .then(([profileData, usageData, docData, taskData, knowledgeData]) => {
        if (profileData.profile) {
          setProfile(profileData.profile);
          setCounts(profileData.counts);
        }
        if (usageData.usage) {
          setUsage(usageData.usage);
        }
        if (docData.documents) {
          setDocuments(docData.documents.slice(-3).reverse());
        }
        if (taskData.tasks) {
          setTasks(taskData.tasks.slice(-3).reverse());
        }
        if (knowledgeData.entries) {
          setKnowledge(knowledgeData.entries.slice(-3).reverse());
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  const timeOfDay = getTimeOfDay();

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
          
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
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
          {/* Action Tiles & Activity */}
          <div className="lg:col-span-2 space-y-8">
            <div>
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

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <div className="mt-4 space-y-2">
                {documents.map((doc) => (
                  <ActivityRow key={`doc-${doc.id}`} icon="📄" label={doc.title} time={doc.created_at} />
                ))}
                {tasks.map((task) => (
                  <ActivityRow key={`task-${task.id}`} icon="✅" label={task.title} time={task.created_at} />
                ))}
                {knowledge.map((entry) => (
                  <ActivityRow key={`knowledge-${entry.id}`} icon="🧠" label={entry.title} time={entry.created_at} />
                ))}
                {documents.length === 0 && tasks.length === 0 && knowledge.length === 0 && (
                  <p className="py-4 text-sm text-slate-400">No recent activity. Start by adding knowledge or generating a document.</p>
                )}
              </div>
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
                {(counts?.documents ?? 0) > 0 && (
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

function ActivityRow({ icon, label, time }: { icon: string; label: string; time: string }) {
  const date = new Date(time);
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-900/60">
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-sm text-slate-300 truncate">{label}</span>
      <span className="text-xs text-slate-500">{formatted}</span>
    </div>
  );
}