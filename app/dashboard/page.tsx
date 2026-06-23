'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SidebarNav from '@/components/sidebar-nav';
import { 
  MessageSquare, 
  FileText, 
  Brain, 
  CheckSquare,
  ArrowUpRight,
  Activity,
  Cpu,
  Lightbulb
} from 'lucide-react';

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
        if (usageData.usage) setUsage(usageData.usage);
        if (docData.documents) setDocuments(docData.documents.slice(-3).reverse());
        if (taskData.tasks) setTasks(taskData.tasks.slice(-3).reverse());
        if (knowledgeData.entries) setKnowledge(knowledgeData.entries.slice(-3).reverse());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const timeOfDay = getTimeOfDay();

  return (
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />
      
      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Welcome Section */}
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {timeOfDay}, {profile?.name?.split(' ')[0] || ''}
            </h1>
            <p className="mt-2 text-lg text-slate-300">
              Estech AI Business Copilot is ready to assist.
            </p>
          </div>

          {/* KPI Grid */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={MessageSquare}
              title="Conversations"
              value={usage?.totalRequests ?? 0}
              trend="+12%"
              subtitle="this week"
              variant="primary"
            />
            <KpiCard
              icon={FileText}
              title="Documents"
              value={counts?.documents ?? 0}
              trend="+8%"
              subtitle="this week"
              variant="default"
            />
            <KpiCard
              icon={Brain}
              title="Knowledge"
              value={counts?.knowledgeEntries ?? 0}
              trend="base"
              subtitle="active entries"
              variant="default"
            />
            <KpiCard
              icon={CheckSquare}
              title="Tasks"
              value={counts?.tasks ?? 0}
              trend={counts?.tasks ? 'active' : 'ready'}
              subtitle="to manage"
              variant="default"
            />
          </div>

          {/* Main Content Grid */}
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {/* Workspaces + Activity */}
            <div className="space-y-8 lg:col-span-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Workspaces
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <WorkspaceTile
                    href="/responses"
                    icon={MessageSquare}
                    title="Communication Studio"
                    description="Generate professional replies"
                  />
                  <WorkspaceTile
                    href="/documents"
                    icon={FileText}
                    title="Document Studio"
                    description="Create invoices, quotes, proposals"
                  />
                  <WorkspaceTile
                    href="/knowledge"
                    icon={Brain}
                    title="Business Brain"
                    description="Store pricing, policies, FAQs"
                  />
                  <WorkspaceTile
                    href="/tasks"
                    icon={CheckSquare}
                    title="Task Manager"
                    description="Track action items"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Recent Activity
                </h2>
                <div className="mt-4 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/50">
                  {documents.map((doc) => (
                    <ActivityRow key={`doc-${doc.id}`} icon={FileText} label={doc.title} time={doc.created_at} />
                  ))}
                  {tasks.map((task) => (
                    <ActivityRow key={`task-${task.id}`} icon={CheckSquare} label={task.title} time={task.created_at} />
                  ))}
                  {knowledge.map((entry) => (
                    <ActivityRow key={`knowledge-${entry.id}`} icon={Brain} label={entry.title} time={entry.created_at} />
                  ))}
                  {documents.length === 0 && tasks.length === 0 && knowledge.length === 0 && (
                    <p className="p-6 text-sm text-slate-400">No activity yet. Start by adding knowledge or generating a document.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Insights + Status */}
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-white">AI Status</h3>
                </div>
                <div className="mt-4 space-y-3">
                  <StatusRow label="Knowledge Connected" status="online" />
                  <StatusRow label="Model Online" status="online" />
                  <StatusRow label="Memory Ready" status="online" />
                  <StatusRow label="Business Context" status={profile ? 'loaded' : 'needs setup'} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-white">AI Insights</h3>
                </div>
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
        </div>
      </main>
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, trend, subtitle, variant = 'default' }: {
  icon: React.ElementType;
  title: string;
  value: number | string;
  trend: string;
  subtitle: string;
  variant?: 'primary' | 'default';
}) {
  const trendColor = trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-400';
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${variant === 'primary' ? 'text-sky-400' : 'text-slate-400'}`} />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className={`mt-1 text-xs ${trendColor}`}>{trend} • {subtitle}</p>
    </div>
  );
}

function WorkspaceTile({ href, icon: Icon, title, description }: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-sky-500/50 hover:bg-slate-900/80">
      <div className="flex items-start justify-between">
        <Icon className="h-6 w-6 text-sky-400" />
        <ArrowUpRight className="h-4 w-4 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </Link>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  const isOnline = status === 'online' || status === 'loaded';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-300">{label}</span>
      <span className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-sky-400'}`}>
        {isOnline ? '✓ Ready' : status}
      </span>
    </div>
  );
}

function ActivityRow({ icon: Icon, label, time }: { icon: React.ElementType; label: string; time: string }) {
  const date = new Date(time);
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <div className="flex items-center gap-3 px-3 py-3 transition hover:bg-slate-900/60">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="flex-1 truncate text-sm text-slate-300">{label}</span>
      <span className="text-xs text-slate-500">{formatted}</span>
    </div>
  );
}