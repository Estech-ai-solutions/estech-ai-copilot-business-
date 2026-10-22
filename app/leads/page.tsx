'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import {
  Target, Search, Globe, MapPin, Trash2, Mail, Phone, Building2,
  Loader2, Sparkles, AlertCircle, X, ArrowUpRight, Briefcase, TrendingUp,
} from 'lucide-react';
import { PageHeader, EmptyState, Section, Badge, Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/toast';
import type { LeadSource } from '@/app/api/leads/search/route';

export const dynamic = 'force-dynamic';

const LEAD_SOURCES = [
  { id: 'web', label: 'Web', icon: Globe, hint: 'Official business sites' },
  { id: 'linkedin', label: 'LinkedIn', icon: Briefcase, hint: 'Company profiles' },
  { id: 'jobs', label: 'Hiring cos.', icon: TrendingUp, hint: 'Indeed · Glassdoor' },
  { id: 'directories', label: 'Directories', icon: Building2, hint: 'Verified listings' },
] as const;

const INDUSTRY_SUGGESTIONS = [
  'Restaurants', 'Cafes & Bakeries', 'Law Firms', 'Schools', 'Churches', 'Construction',
  'E-commerce', 'Healthcare', 'Dental Clinics', 'Finance', 'Real Estate', 'Technology',
  'Salons & Spas', 'Gyms & Fitness', 'Hotels', 'Logistics', 'Marketing Agencies',
  'Auto Repair', 'Accounting Firms', 'Interior Design',
];

const LOCATION_SUGGESTIONS = [
  'Nigeria', 'Lagos', 'Abuja', 'Port Harcourt', 'London', 'United Kingdom',
  'United States', 'New York', 'California', 'Texas', 'Toronto', 'Dubai', 'Accra', 'Nairobi',
];

type LeadStatus = 'new' | 'contacted' | 'interested' | 'proposal_sent' | 'converted' | 'rejected';

const STATUS_OPTIONS: { value: LeadStatus; label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' }[] = [
  { value: 'new', label: 'New', variant: 'default' },
  { value: 'contacted', label: 'Contacted', variant: 'primary' },
  { value: 'interested', label: 'Interested', variant: 'warning' },
  { value: 'proposal_sent', label: 'Proposal Sent', variant: 'warning' },
  { value: 'converted', label: 'Won', variant: 'success' },
  { value: 'rejected', label: 'Lost', variant: 'danger' },
];

function getStatusMeta(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

type Lead = {
  id: string;
  business_name: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  location: string;
  industry: string;
  lead_score: number;
  reason: string;
  opportunity?: string | null;
  suggested_service?: string | null;
  status: LeadStatus;
  city?: string | null;
  state?: string | null;
};

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-text-muted';
  const stroke = score >= 80 ? 'stroke-success' : score >= 60 ? 'stroke-warning' : 'stroke-slate-500';
  const circumference = 2 * Math.PI * 14;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg className="h-11 w-11 -rotate-90" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="none" strokeWidth="3" className="stroke-border" />
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className={cn('transition-all duration-700', stroke)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={cn('absolute inset-0 flex items-center justify-center text-xs font-semibold', tone)}>
        {score}
      </span>
    </div>
  );
}

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [targetIndustry, setTargetIndustry] = useState(searchParams.get('industry') || '');
  const [targetLocation, setTargetLocation] = useState(searchParams.get('location') || '');
  const [idealCustomer, setIdealCustomer] = useState(searchParams.get('customer') || '');
  const [sources, setSources] = useState<LeadSource[]>(['web']);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      const json = await res.json();
      setLeads((json.leads ?? []) as Lead[]);
    } catch {
      addToast('Could not load your leads.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!targetIndustry.trim() && !targetLocation.trim() && !idealCustomer.trim()) {
      setNotice({ type: 'error', text: 'Add an industry, a location, or describe your ideal customer to search.' });
      return;
    }

    setSearching(true);
    setNotice(null);

    try {
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetIndustry: targetIndustry.trim() || null,
          targetLocation: targetLocation.trim() || null,
          idealCustomer: idealCustomer.trim() || null,
          sources,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setNotice({ type: 'error', text: json.error || 'Search failed. Please try again.' });
        return;
      }

      if (json.message) {
        setNotice({ type: 'info', text: json.message });
      } else if (json.insertedCount) {
        setNotice({
          type: 'success',
          text: `Added ${json.insertedCount} new lead${json.insertedCount > 1 ? 's' : ''} to your list.`,
        });
      }

      await loadLeads();
    } catch {
      setNotice({ type: 'error', text: 'Search failed. Please check your connection and try again.' });
    } finally {
      setSearching(false);
    }
  }, [targetIndustry, targetLocation, idealCustomer, sources]);

  async function updateLeadStatus(id: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      addToast('Could not update lead status.', 'error');
      await loadLeads();
    }
  }

  async function deleteLead(id: string) {
    if (!window.confirm('Delete this lead?')) return;
    setLeads((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      addToast('Lead deleted.', 'success');
    } catch {
      addToast('Could not delete lead.', 'error');
      await loadLeads();
    }
  }

  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.lead_score >= 80).length;
  const pipelineLeads = leads.filter((l) => ['contacted', 'interested', 'proposal_sent', 'converted'].includes(l.status)).length;
  const hasFilters = Boolean(targetIndustry || targetLocation || idealCustomer);

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="pt-14 lg:pt-0">
        <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
          <PageHeader
            title="Lead Intelligence"
            description="Discover and qualify prospects from across the web"
            action={
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-muted hidden sm:inline">{totalLeads} total</span>
                <Badge variant={hotLeads > 0 ? 'success' : 'default'} className="text-xs">{hotLeads} hot</Badge>
                <Badge variant={pipelineLeads > 0 ? 'primary' : 'default'} className="text-xs">{pipelineLeads} active</Badge>
              </div>
            }
          />

          {/* Discovery */}
          <Section title="Find New Leads" className="mb-6">
            <form onSubmit={handleSearch} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Industry <span className="text-text-muted/60">(optional)</span>
                  </label>
                  <Input
                    value={targetIndustry}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetIndustry(e.target.value)}
                    placeholder="e.g. dental clinics, gyms, law firms…"
                    list="industry-suggestions"
                  />
                  <datalist id="industry-suggestions">
                    {INDUSTRY_SUGGESTIONS.map((ind) => <option key={ind} value={ind} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Location <span className="text-text-muted/60">(optional)</span>
                  </label>
                  <Input
                    value={targetLocation}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetLocation(e.target.value)}
                    placeholder="e.g. Lagos, London, anywhere…"
                    list="location-suggestions"
                  />
                  <datalist id="location-suggestions">
                    {LOCATION_SUGGESTIONS.map((loc) => <option key={loc} value={loc} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Describe your ideal customer <span className="text-text-muted/60">(optional)</span>
                </label>
                <textarea
                  value={idealCustomer}
                  onChange={(e) => setIdealCustomer(e.target.value)}
                  placeholder="e.g. owner-run restaurants with 5-20 staff who take phone orders and need a website"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border/60 bg-background-secondary/60 px-4 py-2.5 text-sm text-text-heading placeholder:text-text-muted outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

               <div>
                 <p className="text-xs font-medium text-text-muted mb-2">Search source</p>
                 <div className="flex flex-wrap gap-2">
                   {LEAD_SOURCES.map((s) => (
                     <button
                       key={s.id}
                       type="button"
                       onClick={() => {
                         setSources(prev => 
                           prev.includes(s.id) 
                             ? prev.filter(id => id !== s.id) 
                             : [...prev, s.id]
                         );
                       }}
                       className={cn(
                         'group flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition min-h-[44px]',
                         sources.includes(s.id)
                           ? 'border-primary bg-primary/15 text-primary'
                           : 'border-border/60 text-text-muted hover:bg-surface/60 hover:text-text-heading'
                       )}
                     >
                       <s.icon className="h-4 w-4" />
                       <span>{s.label}</span>
                       <span className="hidden sm:inline text-[0.65rem] opacity-60">{s.hint}</span>
                     </button>
                   ))}
                 </div>
               </div>

              {notice && (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-xl border px-4 py-3',
                    notice.type === 'success' && 'border-success/30 bg-success/10 text-success',
                    notice.type === 'error' && 'border-danger/30 bg-danger/10 text-danger',
                    notice.type === 'info' && 'border-primary/30 bg-primary/10 text-primary'
                  )}
                >
                  {notice.type === 'error' ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />}
                  <div className="flex-1 text-sm leading-6">{notice.text}</div>
                  <button onClick={() => setNotice(null)} className="shrink-0 opacity-60 hover:opacity-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-text-muted">
                  Leave everything blank to search broadly, or be specific for sharper matches.
                </p>
                <Button type="submit" variant="primary" disabled={searching} className="w-full sm:w-auto">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {searching ? 'Searching the web…' : 'Find Leads'}
                </Button>
              </div>
            </form>
          </Section>

          {/* Results */}
          <Section
            title="Your Leads"
            action={hasFilters ? <span className="text-[0.65rem] text-text-muted">sorted by newest</span> : undefined}
          >
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-36 animate-pulse rounded-xl border border-border/30 bg-background-secondary/40" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No leads yet"
                description="Enter an industry, a location, or describe your ideal customer above and we'll find matching businesses."
                action={
                  <Button variant="primary" onClick={() => document.querySelector<HTMLInputElement>('input[list="industry-suggestions"]')?.focus()} className="w-full sm:w-auto">
                    <Search className="h-4 w-4" />
                    Start searching
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {leads.map((lead) => {
                  const statusMeta = getStatusMeta(lead.status);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="group cursor-pointer rounded-xl border border-border/40 bg-background-secondary/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface/60 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <ScoreRing score={lead.lead_score} />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-text-heading">{lead.business_name}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] text-text-muted">
                            {lead.industry && (
                              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.industry}</span>
                            )}
                            {lead.location && lead.location !== 'Unspecified' && (
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.location}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                          className="shrink-0 rounded-lg p-1.5 text-text-muted opacity-0 transition hover:text-danger group-hover:opacity-100"
                          title="Delete lead"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <select
                          value={lead.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                          className={cn(
                            'rounded-full border-0 bg-surface px-2.5 py-1 text-[0.65rem] font-medium outline-none cursor-pointer',
                            statusMeta.variant === 'success' && 'text-success',
                            statusMeta.variant === 'warning' && 'text-warning',
                            statusMeta.variant === 'danger' && 'text-danger',
                            statusMeta.variant === 'primary' && 'text-primary',
                            statusMeta.variant === 'default' && 'text-text-muted'
                          )}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>

                        <div className="ml-auto flex items-center gap-1.5 text-text-muted">
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              onClick={(e) => e.stopPropagation()}
                              title={lead.email}
                              className="rounded-lg p-1.5 transition hover:bg-primary/15 hover:text-primary"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              title={lead.phone}
                              className="rounded-lg p-1.5 transition hover:bg-primary/15 hover:text-primary"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-60" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      </main>
    </div>
  );
}

function LeadsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="pt-14 lg:pt-0">
        <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-border/40 mb-3 lg:h-7 lg:w-56" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-border/40 lg:h-5 lg:w-80" />
        </div>
      </main>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsPageSkeleton />}>
      <LeadsPageContent />
    </Suspense>
  );
}
