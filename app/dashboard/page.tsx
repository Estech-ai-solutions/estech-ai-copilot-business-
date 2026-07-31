'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import { MessageSquare, FileText, Brain, CheckSquare, Target, Plus, TrendingUp, ArrowUpRight } from 'lucide-react';
import { PageHeader, StatCard, Section, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useSupabaseContext } from '@/providers/supabase-provider';

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
};

type Document = {
  id: string;
  title: string;
  type: string;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useSupabaseContext();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)
        .single();

      if (!workspace) {
        setLoading(false);
        return;
      }

      const workspaceId = workspace.id;

      const [docData, taskData, knowledgeData, leadsData] = await Promise.all([
        supabase.from('documents').select('*').eq('workspace_id', workspaceId),
        supabase.from('tasks').select('*').eq('workspace_id', workspaceId),
        supabase.from('knowledge').select('*').eq('workspace_id', workspaceId),
        supabase.from('leads').select('*').eq('workspace_id', workspaceId),
      ]);

      if (docData.data) setDocuments(docData.data as Document[]);
      if (taskData.data) setTasks(taskData.data as Task[]);
      if (knowledgeData.data) setKnowledge(knowledgeData.data as KnowledgeEntry[]);
      if (leadsData.data) setLeads(leadsData.data as Lead[]);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const hotLeads = leads.filter((l) => l.lead_score >= 80).length;
  const pipelineLeads = leads.filter((l) =>
    ['contacted', 'interested', 'proposal_sent'].includes(l.status)
  ).length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;

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
            title="Dashboard"
            description="Your business at a glance"
          />

          <div className="mb-6 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={MessageSquare} value={tasks.length} label="Tasks" />
            <StatCard icon={FileText} value={documents.length} label="Documents" />
            <StatCard icon={CheckSquare} value={completedTasks} label="Completed" />
            <StatCard icon={Target} value={hotLeads} label="Hot Leads" />
          </div>

          <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              <Section title="Business Health">
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted mb-1">Lead Pipeline</p>
                      <p className="text-xl font-semibold text-text-heading lg:text-2xl">{pipelineLeads || 'No data yet'}</p>
                    </div>
                    <Badge variant={pipelineLeads > 0 ? 'success' : 'default'}>
                      {pipelineLeads > 0 ? 'Growing' : 'Empty'}
                    </Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-background-secondary/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, (pipelineLeads / Math.max(1, leads.length)) * 100)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 pt-2">
                    <MetricCard label="Knowledge entries" value={knowledge.length || 0} icon={Brain} />
                    <MetricCard label="Task completion" value={tasks.length > 0 ? `${Math.round((completedTasks / tasks.length) * 100)}%` : '0%'} icon={TrendingUp} />
                  </div>
                </div>
              </Section>

              <Section title="AI Insights">
                <div className="space-y-2 lg:space-y-3">
                  {knowledge.length > 0 ? (
                    <InsightItem
                      icon={Brain}
                      iconClassName="bg-primary/10"
                      iconColor="text-primary"
                      title="Knowledge Base Active"
                      description={`${knowledge.length} knowledge entries power your AI responses with accurate business context.`}
                    />
                  ) : (
                    <InsightItem
                      icon={Brain}
                      iconClassName="bg-warning/10"
                      iconColor="text-warning"
                      title="Knowledge Needed"
                      description="Add knowledge to your business brain for more accurate AI suggestions."
                    />
                  )}
                  {leads.length > 0 ? (
                    <InsightItem
                      icon={Target}
                      iconClassName="bg-success/10"
                      iconColor="text-success"
                      title="Lead Generation Active"
                      description={`${hotLeads} hot leads ready for outreach. Prioritize high-score prospects first.`}
                    />
                  ) : (
                    <InsightItem
                      icon={Target}
                      iconClassName="bg-warning/10"
                      iconColor="text-warning"
                      title="Lead Generation Needed"
                      description="Start finding leads to build your pipeline."
                    />
                  )}
                </div>
              </Section>
            </div>

            <div className="space-y-4 lg:space-y-6">
              <Section title="Quick Actions">
                <div className="space-y-2">
                  <QuickAction href="/knowledge" icon={Plus} label="Add knowledge entry" description="Improve AI accuracy" />
                  <QuickAction href="/leads" icon={Target} label="Find leads" description="Discover prospects" />
                  <QuickAction href="/responses" icon={MessageSquare} label="Write reply" description="Craft response" />
                  <QuickAction href="/documents" icon={FileText} label="Create document" description="Generate quote or proposal" />
                </div>
              </Section>

              <Section title="Recent Activity">
                <div className="space-y-1.5 lg:space-y-2 max-h-64 overflow-y-auto">
                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-sm py-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate text-text-heading">{doc.title}</span>
                      </div>
                      <span className="text-xs text-text-muted">{doc.type}</span>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <p className="text-sm text-text-muted text-center py-2">No recent activity</p>
                  )}
                </div>
              </Section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-xl border border-border/30 bg-background-secondary/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="text-[0.65rem] text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-semibold text-text-heading">{value}</p>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, description }: { href: string; icon: any; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-border/30 bg-background-secondary/30 p-3.5 transition-all duration-200 hover:bg-surface/50"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-medium text-text-heading">{label}</p>
          <p className="text-[0.65rem] text-text-muted">{description}</p>
        </div>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-text-muted" />
    </Link>
  );
}

function InsightItem({ icon: Icon, iconClassName, iconColor, title, description }: {
  icon: any;
  iconClassName: string;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${iconClassName}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <p className="text-sm text-text-muted leading-6">{description}</p>
    </div>
  );
}