'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import {
  Bot, Send, TrendingUp, Target, FileText, CheckSquare, Brain,
  Loader2, ArrowUpRight, Sparkles, ChevronRight
} from 'lucide-react';
import { PageHeader, StatCard, Section, Badge, Button, Input, Alert } from '@/components/ui';
import { useSupabaseContext } from '@/providers/supabase-provider';
import { supabase } from '@/lib/supabase';
import { formatResponseText } from '@/lib/utils';

type Lead = {
  id: string;
  business_name: string;
  status: string;
  lead_score: number;
};

type KnowledgeEntry = {
  id: string;
  title: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
};

type Document = {
  id: string;
  title: string;
  type: string;
};

type Recommendation = {
  id: string;
  type: 'leads_without_outreach' | 'follow_ups_due' | 'new_documents' | 'knowledge_gaps';
  title: string;
  description: string;
  action: string;
  href: string;
  count?: number;
};

type AiSuggestion = {
  message: string;
  intent: string;
  action?: {
    type: string;
    href: string;
    params?: Record<string, string>;
    label: string;
  };
};

export default function DashboardPage() {
  const { user, loading: authLoading, workspace } = useSupabaseContext();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [businessName, setBusinessName] = useState<string>('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: ws } = await supabase
          .from('workspaces')
          .select('id, name')
          .eq('created_by', user.id)
          .limit(1)
          .single();

        if (!ws) {
          setLoading(false);
          return;
        }

        const workspaceId = ws.id;
        setBusinessName((ws.name || 'your business').trim());

        const [docData, taskData, knowledgeData, leadsData] = await Promise.all([
          supabase.from('documents').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(5),
          supabase.from('tasks').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(10),
          supabase.from('knowledge').select('*').eq('workspace_id', workspaceId).limit(5),
          supabase.from('leads').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(10),
        ]);

        if (docData.data) setDocuments(docData.data as Document[]);
        if (taskData.data) setTasks(taskData.data as Task[]);
        if (knowledgeData.data) setKnowledge(knowledgeData.data as KnowledgeEntry[]);
        if (leadsData.data) setLeads(leadsData.data as Lead[]);

        generateRecommendations(leadsData.data as Lead[] | null, tasks, documents);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  function generateRecommendations(leadsData: Lead[] | null, tasksData: Task[], docs: Document[]) {
    const recs: Recommendation[] = [];
    const currentLeads = leadsData || leads;

    // Check for leads without outreach
    if (currentLeads.length > 0) {
      const newLeads = currentLeads.filter(l => l.status === 'new').length;
      if (newLeads > 0) {
        recs.push({
          id: 'leads_no_outreach',
          type: 'leads_without_outreach',
          title: `${newLeads} new lead${newLeads > 1 ? 's' : ''} waiting`,
          description: 'These leads haven\'t received any outreach yet.',
          action: 'Review leads',
          href: '/leads',
          count: newLeads,
        });
      }
    }

    // Check for follow-up tasks
    const followUpTasks = tasksData.filter(t => 
      t.status !== 'done' && t.due_date && new Date(t.due_date) <= new Date()
    ).length;
    if (followUpTasks > 0) {
      recs.push({
        id: 'follow_ups',
        type: 'follow_ups_due',
        title: `${followUpTasks} follow-up${followUpTasks > 1 ? 's' : ''} due`,
        description: 'These tasks need your attention.',
        action: 'View tasks',
        href: '/tasks',
        count: followUpTasks,
      });
    }

    // Check for empty knowledge base
    if (knowledge.length === 0) {
      recs.push({
        id: 'knowledge_gaps',
        type: 'knowledge_gaps',
        title: 'Add your business knowledge',
        description: 'Help Estech understand your business better.',
        action: 'Add knowledge',
        href: '/knowledge',
      });
    }

    setRecommendations(recs);
  }

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
      if (!res.ok) {
        throw new Error(json.error || 'Failed to get response');
      }

      setAiSuggestion(json.suggestion);
    } catch (err: any) {
      setAiSuggestion({
        message: err.message || 'Something went wrong. Please try again.',
        intent: 'error',
      });
    } finally {
      setAiLoading(false);
    }
  }

  function handleAiAction() {
    if (!aiSuggestion?.action || !aiSuggestion.action.href) return;
    const { href, params } = aiSuggestion.action;
    const url = params ? `${href}?${new URLSearchParams(params).toString()}` : href;
    if (url) {
      router.push(url);
    }
  }

  const hotLeads = leads.filter(l => l.lead_score >= 80).length;
  const pipelineLeads = leads.filter(l => ['contacted', 'interested', 'proposal_sent'].includes(l.status)).length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileNav />
        <SidebarNav />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="px-4 py-6 lg:px-8 lg:py-8">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-border/40 mb-3 lg:h-7 lg:w-56" />
            <div className="h-4 w-64 animate-pulse rounded-lg bg-border/40 lg:h-5 lg:w-80" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          <PageHeader
            title={`Welcome back${businessName ? ` to ${businessName}` : ''}`}
            description="Your AI-powered business assistant"
          />

          {/* AI Interaction Area */}
          <div className="mb-8">
            <div className="rounded-2xl border border-border/40 bg-surface/80 backdrop-blur-xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-heading">What can I help you with?</h3>
                  <p className="text-xs text-text-muted">Ask me anything about your business</p>
                </div>
              </div>

              <form onSubmit={handleAiSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    value={aiInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiInput(e.target.value)}
                    placeholder="Ask Estech about your business..."
                    className="pr-12 min-h-[48px] text-sm"
                    disabled={aiLoading}
                  />
                  <button
                    type="submit"
                    disabled={!aiInput.trim() || aiLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
                    aria-label="Send message"
                  >
                    {aiLoading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </form>

              {aiSuggestion && (
                <div className="mt-4 rounded-xl border border-border/40 bg-background-secondary/40 p-4">
                  <div
                    className="text-sm text-text-heading leading-6 mb-3"
                    dangerouslySetInnerHTML={{ __html: formatResponseText(aiSuggestion.message) }}
                  />
                  {aiSuggestion.action && (
                    <Button
                      onClick={handleAiAction}
                      variant="primary"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {aiSuggestion.action.label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">
                Estech recommends
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map(rec => (
                  <button
                    key={rec.id}
                    onClick={() => router.push(rec.href)}
                    className="rounded-xl border border-border/40 bg-background-secondary/40 p-4 text-left transition hover:bg-surface/60 hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-text-heading">{rec.title}</h4>
                      {rec.count !== undefined && (
                        <Badge variant="primary" className="text-xs">{rec.count}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mb-3">{rec.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      {rec.action}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Business Snapshot */}
          <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              <Section title="Business Overview">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={Target} value={leads.length} label="Total Leads" />
                  <StatCard icon={Target} value={hotLeads} label="Hot Leads" />
                  <StatCard icon={CheckSquare} value={completedTasks} label="Tasks Done" />
                  <StatCard icon={FileText} value={documents.length} label="Documents" />
                </div>
              </Section>

              <Section title="Recent Activity">
                {documents.length === 0 && tasks.length === 0 && leads.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-text-muted mb-4">No activity yet</p>
                    <Button
                      onClick={() => setAiInput('I need to find potential customers')}
                      variant="primary"
                      size="sm"
                    >
                      Ask Estech for help
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.slice(0, 3).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between text-sm py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate text-text-heading">{doc.title}</span>
                        </div>
                        <span className="text-xs text-text-muted capitalize">{doc.type}</span>
                      </div>
                    ))}
                    {tasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center justify-between text-sm py-2">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate text-text-heading">{task.title}</span>
                        </div>
                        <span className="text-xs text-text-muted capitalize">{task.status}</span>
                      </div>
                    ))}
                    {leads.slice(0, 3).map(lead => (
                      <div key={lead.id} className="flex items-center justify-between text-sm py-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate text-text-heading">{lead.business_name}</span>
                        </div>
                        <span className="text-xs text-text-muted">Score: {lead.lead_score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <div className="space-y-4 lg:space-y-6">
              <Section title="Quick Actions">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setAiInput('I need to find potential customers');
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3 text-sm text-text-heading transition hover:bg-surface/60"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-primary" />
                      <span>Find leads</span>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-text-muted" />
                  </button>
                  <button
                    onClick={() => {
                      setAiInput('I need to reply to a customer');
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3 text-sm text-text-heading transition hover:bg-surface/60"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>Reply to customer</span>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-text-muted" />
                  </button>
                  <button
                    onClick={() => {
                      setAiInput('Create a quotation or proposal');
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3 text-sm text-text-heading transition hover:bg-surface/60"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>Create document</span>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-text-muted" />
                  </button>
                  <button
                    onClick={() => {
                      setAiInput('Add a task or reminder');
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3 text-sm text-text-heading transition hover:bg-surface/60"
                  >
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-4 w-4 text-primary" />
                      <span>Add task</span>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-text-muted" />
                  </button>
                </div>
              </Section>

              {knowledge.length > 0 && (
                <Section title="Business Brain">
                  <div className="space-y-2">
                    {knowledge.slice(0, 3).map(entry => (
                      <div key={entry.id} className="flex items-center gap-2 text-sm">
                        <Brain className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate text-text-heading">{entry.title}</span>
                      </div>
                    ))}
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
