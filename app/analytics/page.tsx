'use client';

import { useEffect, useState } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import {
  Target, FileText, Brain, CheckCircle2, MessageSquare, TrendingUp, ArrowUpRight,
  User, Briefcase, DollarSign, File, Check, MessageCircle, Search
} from 'lucide-react';
import { PageHeader, Section, Card, Badge, StatCard } from '@/components/ui';
import { useSupabaseContext } from '@/providers/supabase-provider';

type AnalyticsData = {
  stats: {
    totalLeads: number;
    hotLeads: number;
    documentsCreated: number;
    knowledgeEntries: number;
    completedTasks: number;
    aiConversations: number;
  };
  leadsByStatus: { status: string; count: number }[];
  documentsByType: { type: string; count: number }[];
  leadsOverTime: { date: string; count: number }[];
  tasksCompleted: { date: string; count: number }[];
  recentActivity: {
    type: string;
    title: string;
    time: string;
    icon: string;
  }[];
  insights: string[];
};

type StatCardItem = {
  label: string;
  value: number | string;
  icon: any;
  trend?: string;
  trendUp?: boolean;
};

const FILTERS = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

export default function AnalyticsPage() {
  const { user } = useSupabaseContext();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('30d');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/analytics?range=' + activeFilter);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, activeFilter]);

  const statCards: StatCardItem[] = data ? [
    { label: 'Total Leads', value: data.stats.totalLeads, icon: Target, trend: data.stats.totalLeads > 0 ? 'Active' : 'Empty', trendUp: data.stats.totalLeads > 0 },
    { label: 'Hot Leads', value: data.stats.hotLeads, icon: TrendingUp, trend: data.stats.hotLeads > 0 ? 'Needs action' : 'None', trendUp: false },
    { label: 'Documents', value: data.stats.documentsCreated, icon: FileText, trend: 'Created', trendUp: true },
    { label: 'Knowledge', value: data.stats.knowledgeEntries, icon: Brain, trend: 'Entries', trendUp: true },
    { label: 'Completed Tasks', value: data.stats.completedTasks, icon: CheckCircle2, trend: 'Done', trendUp: true },
    { label: 'AI Conversations', value: data.stats.aiConversations, icon: MessageSquare, trend: 'Total', trendUp: true },
  ] : [];

  const maxStatusCount = data?.leadsByStatus.length ? Math.max(...data.leadsByStatus.map(s => s.count)) : 1;
  const maxDocCount = data?.documentsByType.length ? Math.max(...data.documentsByType.map(d => d.count)) : 1;
  const maxLeadsTime = data?.leadsOverTime.length ? Math.max(...data.leadsOverTime.map(l => l.count)) : 1;
  const maxTasksCompleted = data?.tasksCompleted.length ? Math.max(...data.tasksCompleted.map(t => t.count)) : 1;

  const getIconComponent = (icon: string) => {
    switch (icon) {
      case 'message': return MessageCircle;
      case 'file': return FileText;
      case 'brain': return Brain;
      case 'check': return CheckCircle2;
      case 'target': return Target;
      default: return Briefcase;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileNav />
        <SidebarNav />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="px-4 py-6 lg:px-8 lg:py-8">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-border/40 mb-2" />
            <div className="h-4 w-72 animate-pulse rounded-lg bg-border/40 mb-6" />
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-border/40" />
              ))}
            </div>
            <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
              <div className="h-64 animate-pulse rounded-xl bg-border/40" />
              <div className="h-64 animate-pulse rounded-xl bg-border/40" />
            </div>
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
            title="Analytics"
            description="Business activity overview"
            action={
              <div className="flex items-center gap-2 bg-background-secondary/60 rounded-xl p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setActiveFilter(f.value)}
                    className={`
                      rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 min-h-[36px]
                      ${activeFilter === f.value
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-text-muted hover:text-text-heading hover:bg-surface/60'
                      }
                    `}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            }
          />

          {error && (
            <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
              {error}
            </div>
          )}

          {!data || !data.stats ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-10 w-10 text-text-muted mb-3 opacity-50" />
              <p className="text-sm text-text-muted">No analytics data available for this period.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {statCards.map((stat) => (
                  <StatCard
                    key={stat.label}
                    icon={stat.icon}
                    value={stat.value}
                    label={stat.label}
                    trend={stat.trend}
                    trendUp={stat.trendUp}
                  />
                ))}
              </div>

              <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
                <Section title="Leads by Status">
                  <div className="space-y-3">
                    {data.leadsByStatus.length === 0 ? (
                      <p className="text-sm text-text-muted text-center py-4">No leads yet</p>
                    ) : (
                      data.leadsByStatus.map((item) => (
                        <div key={item.status} className="flex items-center gap-3">
                          <div className="w-24 text-xs text-text-muted capitalize truncate">{item.status.replace('_', ' ')}</div>
                          <div className="flex-1 h-2.5 rounded-full bg-background-secondary/60 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                            />
                          </div>
                          <div className="w-8 text-xs text-text-heading text-right">{item.count}</div>
                        </div>
                      ))
                    )}
                  </div>
                </Section>

                <Section title="Documents by Type">
                  <div className="flex items-center gap-6">
                    {data.documentsByType.length === 0 ? (
                      <p className="text-sm text-text-muted text-center py-4 w-full">No documents yet</p>
                    ) : (
                      <>
                        <div className="relative w-32 h-32 shrink-0">
                          <div
                            className="w-full h-full rounded-full"
                            style={{
                              background: 'conic-gradient(' + data.documentsByType.map((d, i) => {
                                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
                                return colors[i % colors.length] + ' ' + (i === 0 ? '0deg' : getConicEnd(data.documentsByType, i, data.documentsByType.reduce((a, b) => a + b.count, 0)) + 'deg');
                              }).join(', ') + ')',
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
                              <span className="text-xs text-text-muted">{data.documentsByType.reduce((a, b) => a + b.count, 0)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          {data.documentsByType.map((item, i) => {
                            const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
                            return (
                              <div key={item.type} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                                <span className="text-xs text-text-heading capitalize flex-1 truncate">{item.type.replace('_', ' ')}</span>
                                <span className="text-xs text-text-muted">{item.count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </Section>

                <Section title="Leads Created Over Time">
                  <div className="h-48">
                    {data.leadsOverTime.length === 0 ? (
                      <p className="text-sm text-text-muted text-center py-8">No leads yet</p>
                    ) : (
                      <div className="flex items-end gap-1 h-full">
                        {data.leadsOverTime.map((item) => (
                          <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full rounded-t bg-primary/80 hover:bg-primary transition-all duration-200"
                              style={{ height: `${Math.max(4, (item.count / maxLeadsTime) * 100)}%`, minHeight: '4px' }}
                              title={item.count + ' leads'}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {data.leadsOverTime.length > 0 && (
                    <div className="mt-2 flex justify-between text-[0.6rem] text-text-muted">
                      <span>{data.leadsOverTime[0]?.date}</span>
                      <span>{data.leadsOverTime[data.leadsOverTime.length - 1]?.date}</span>
                    </div>
                  )}
                </Section>

                <Section title="Tasks Completed">
                  <div className="h-40">
                    {data.tasksCompleted.length === 0 ? (
                      <p className="text-sm text-text-muted text-center py-6">No completed tasks yet</p>
                    ) : (
                      <div className="flex items-end gap-1.5 h-full">
                        {data.tasksCompleted.map((item) => (
                          <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full rounded-t bg-success/80 hover:bg-success transition-all duration-200"
                              style={{ height: `${Math.max(4, (item.count / maxTasksCompleted) * 100)}%`, minHeight: '4px' }}
                              title={item.count + ' tasks'}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Section>
              </div>

              <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-3">
                <Section title="Recent Activity" className="lg:col-span-2">
                  <div className="space-y-2.5 max-h-72 overflow-y-auto">
                    {data.recentActivity.length === 0 ? (
                      <p className="text-sm text-text-muted text-center py-4">No activity yet</p>
                    ) : (
                      data.recentActivity.map((item, i) => {
                        const Icon = getIconComponent(item.icon);
                        return (
                          <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-heading truncate">{item.title}</p>
                              <p className="text-[0.65rem] text-text-muted capitalize">{item.type}</p>
                            </div>
                            <span className="text-[0.65rem] text-text-muted shrink-0">
                              {new Date(item.time).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Section>

                <Section title="Quick Insights">
                  <div className="space-y-3">
                    {data.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                          <TrendingUp className="h-3 w-3 text-primary" />
                        </div>
                        <p className="text-sm text-text-muted leading-6">{insight}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function getConicEnd(items: { type: string; count: number }[], index: number, total: number) {
  let degrees = 0;
  for (let i = 0; i < index; i++) {
    degrees += (items[i].count / total) * 360;
  }
  return Math.round(degrees);
}
