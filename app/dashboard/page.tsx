'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import {
  Bot, Send, TrendingUp, Target, FileText, CheckSquare, Brain,
  Loader2, ArrowUpRight, Sparkles, ChevronRight, Users, Zap,
  Megaphone, BarChart3, Plus, Clock
} from 'lucide-react';
import { PageHeader, StatCard, Section, Badge, Button, Input } from '@/components/ui';
import { useSupabaseContext } from '@/providers/supabase-provider';
import { supabase } from '@/lib/supabase';
import { formatResponseText } from '@/lib/utils';

type Lead = { id: string; business_name: string; status: string; lead_score: number; created_at: string };
type KnowledgeEntry = { id: string; title: string };
type Task = { id: string; title: string; status: string; due_date: string | null; created_at?: string };
type Document = { id: string; title: string; type: string; created_at: string };
type ContentItem = { id: string; title: string; type: string; created_at: string };

type NextStep = { title: string; description: string; href: string; action: string };

export default function DashboardPage() {
  const { user, loading: authLoading, workspace } = useSupabaseContext();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ message: string; intent: string; action?: { type: string; href: string; params?: Record<string, string>; label: string } } | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [hour, setHour] = useState<number>(12);

  useEffect(() => { setHour(new Date().getHours()); }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: ws } = await supabase
          .from('workspaces')
          .select('id, name')
          .eq('created_by', user.id)
          .limit(1)
          .single();

        if (!ws) { setLoading(false); return; }
        const workspaceId = ws.id;
        setBusinessName((ws.name || 'your business').trim());

        const [docData, taskData, knowledgeData, leadsData, contentData] = await Promise.all([
          supabase.from('documents').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(5),
          supabase.from('tasks').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(10),
          supabase.from('knowledge').select('*').eq('workspace_id', workspaceId).limit(5),
          supabase.from('leads').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(10),
          supabase.from('content').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(5),
        ]);

        if (docData.data) setDocuments(docData.data as Document[]);
        if (taskData.data) setTasks(taskData.data as Task[]);
        if (knowledgeData.data) setKnowledge(knowledgeData.data as KnowledgeEntry[]);
        if (leadsData.data) setLeads(leadsData.data as Lead[]);
        if (contentData.data) setContent(contentData.data as ContentItem[]);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  async function handleAiSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await fetch('/api/dashboard/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: aiInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to get response');
      setAiSuggestion(json.suggestion);
    } catch (err: any) {
      setAiSuggestion({ message: err.message || 'Something went wrong. Please try again.', intent: 'error' });
    } finally {
      setAiLoading(false);
    }
  }

  function handleAiAction() {
    if (!aiSuggestion?.action?.href) return;
    const { href, params } = aiSuggestion.action;
    const url = params ? `${href}?${new URLSearchParams(params).toString()}` : href;
    if (url) router.push(url);
  }

  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const hotLeads = leads.filter(l => l.lead_score >= 80).length;
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const newLeads = leads.filter(l => l.status === 'new').length;

  let nextStep: NextStep | null = null;
  if (knowledge.length === 0) {
    nextStep = { title: 'Set up your Business Brain', description: 'Add your services, pricing and policies so Estech can generate relevant content and replies.', href: '/knowledge', action: 'Improve Business Brain' };
  } else if (overdueTasks.length > 0) {
    nextStep = { title: `${overdueTasks.length} overdue follow-up${overdueTasks.length > 1 ? 's' : ''}`, description: 'Review and complete overdue tasks to keep work moving.', href: '/tasks', action: 'View follow-ups' };
  } else if (newLeads > 0) {
    nextStep = { title: `${newLeads} new lead${newLeads > 1 ? 's' : ''} to review`, description: 'Decide which leads to contact next.', href: '/leads', action: 'Review leads' };
  } else if (content.length === 0) {
    nextStep = { title: 'Create your first content', description: 'Generate a social post or marketing copy using your business knowledge.', href: '/content', action: 'Create content' };
  } else if (pendingTasks.length > 0) {
    nextStep = { title: `${pendingTasks.length} pending follow-up${pendingTasks.length > 1 ? 's' : ''}`, description: 'Keep your commitments on track.', href: '/tasks', action: 'View tasks' };
  }

  const recentActivity = [
    ...documents.slice(0, 3).map(d => ({ key: `doc-${d.id}`, icon: FileText, label: d.title, meta: d.type, href: '/documents', time: d.created_at })),
    ...tasks.slice(0, 2).map(t => ({ key: `task-${t.id}`, icon: CheckSquare, label: t.title, meta: t.status, href: '/tasks', time: t.created_at || '' })),
    ...leads.slice(0, 2).map(l => ({ key: `lead-${l.id}`, icon: Target, label: l.business_name, meta: `Score ${l.lead_score}`, href: '/leads', time: l.created_at })),
    ...content.slice(0, 2).map(c => ({ key: `content-${c.id}`, icon: Megaphone, label: c.title, meta: c.type, href: '/content', time: c.created_at })),
  ].sort((a, b) => (b.time || '').localeCompare(a.time || '')).slice(0, 8);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileNav />
        <SidebarNav />
        <main className="pt-14 lg:pt-0 lg:pl-64">
          <div className="px-4 py-6 lg:px-8 lg:py-8">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-border/40 mb-3" />
            <div className="h-4 w-64 animate-pulse rounded-lg bg-border/40" />
          </div>
        </main>
      </div>
    );
  }

  const quickActions = [
    { label: 'Create content', icon: Megaphone, href: '/content' },
    { label: 'Find leads', icon: Target, href: '/leads' },
    { label: 'Draft reply', icon: Sparkles, href: '/responses' },
    { label: 'Create proposal', icon: FileText, href: '/documents' },
    { label: 'View analytics', icon: BarChart3, href: '/analytics' },
    { label: 'Schedule follow-up', icon: Clock, href: '/tasks' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="pt-14 lg:pt-0 lg:pl-64">
        <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-text-heading sm:text-3xl">
                {greeting}{businessName ? `, ${businessName}` : ''}.
              </h1>
              <p className="mt-1 text-sm text-text-muted">Here&apos;s what&apos;s happening in your business today.</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => router.push(a.href)}
                className="flex items-center gap-2 rounded-xl border border-border/40 bg-surface/60 px-3 py-2.5 text-sm text-text-heading transition hover:bg-surface/90 hover:border-primary/30"
              >
                <a.icon className="h-4 w-4 text-primary" />
                <span className="truncate">{a.label}</span>
              </button>
            ))}
          </div>

          {nextStep && (
            <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Your next best step</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-medium text-text-heading">{nextStep.title}</h3>
                  <p className="text-sm text-text-muted">{nextStep.description}</p>
                </div>
                <Button onClick={() => router.push(nextStep.href)} variant="primary" size="sm" className="shrink-0">
                  {nextStep.action}
                </Button>
              </div>
            </div>
          )}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Target} value={leads.length} label="Total Leads" />
            <StatCard icon={Target} value={hotLeads} label="Hot Leads" />
            <StatCard icon={CheckSquare} value={pendingTasks.length} label="Pending Follow-ups" />
            <StatCard icon={FileText} value={documents.length} label="Documents" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Section title="Recent activity">
                {recentActivity.length === 0 ? (
                  <div className="py-6 text-center text-sm text-text-muted">No activity yet. Start by adding a lead or creating content.</div>
                ) : (
                  <div className="space-y-1">
                    {recentActivity.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => router.push(a.href)}
                        className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm transition hover:bg-surface/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <a.icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate text-text-heading">{a.label}</span>
                        </div>
                        <span className="text-xs text-text-muted shrink-0 ml-2">{a.meta}</span>
                      </button>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Continue working">
                {documents.length === 0 && content.length === 0 && leads.length === 0 ? (
                  <div className="py-6 text-center text-sm text-text-muted">Nothing to resume yet.</div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {documents.slice(0, 2).map((d) => (
                      <button key={d.id} onClick={() => router.push('/documents')} className="flex items-center gap-2 rounded-xl border border-border/40 bg-background-secondary/40 px-3 py-2.5 text-sm text-text-heading transition hover:bg-surface/60">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="truncate">{d.title}</span>
                      </button>
                    ))}
                    {content.slice(0, 2).map((c) => (
                      <button key={c.id} onClick={() => router.push('/content')} className="flex items-center gap-2 rounded-xl border border-border/40 bg-background-secondary/40 px-3 py-2.5 text-sm text-text-heading transition hover:bg-surface/60">
                        <Megaphone className="h-4 w-4 text-primary" />
                        <span className="truncate">{c.title}</span>
                      </button>
                    ))}
                    {leads.slice(0, 2).map((l) => (
                      <button key={l.id} onClick={() => router.push(`/leads/${l.id}`)} className="flex items-center gap-2 rounded-xl border border-border/40 bg-background-secondary/40 px-3 py-2.5 text-sm text-text-heading transition hover:bg-surface/60">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="truncate">{l.business_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border/40 bg-surface/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-text-heading">Ask Estech</span>
                </div>
                <form onSubmit={handleAiSubmit} className="space-y-2">
                  <Input
                    value={aiInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiInput(e.target.value)}
                    placeholder="Ask about your business..."
                    className="min-h-[40px] text-sm"
                    disabled={aiLoading}
                  />
                  <Button type="submit" variant="primary" size="sm" className="w-full" disabled={!aiInput.trim() || aiLoading}>
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
                {aiSuggestion && (
                  <div className="mt-3 rounded-xl border border-border/40 bg-background-secondary/40 p-3">
                    <div className="text-xs text-text-heading leading-5 mb-2" dangerouslySetInnerHTML={{ __html: formatResponseText(aiSuggestion.message) }} />
                    {aiSuggestion.action?.href && (
                      <Button onClick={handleAiAction} variant="primary" size="sm" className="flex items-center gap-1">
                        {aiSuggestion.action.label}
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {knowledge.length > 0 && (
                <Section title="Business Brain">
                  <div className="space-y-2">
                    {knowledge.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="flex items-center gap-2 text-sm">
                        <Brain className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate text-text-heading">{entry.title}</span>
                      </div>
                    ))}
                    <Button onClick={() => router.push('/knowledge')} variant="secondary" size="sm" className="mt-2 w-full">
                      Manage knowledge
                    </Button>
                  </div>
                </Section>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
