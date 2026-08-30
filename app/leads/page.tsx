'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import { Target, Copy, Download, Send, Plus, X, Brain, Filter, ArrowUpRight, Globe, MapPin, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState, Section, Badge, Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Lead = {
  id: string;
  business_name: string;
  website?: string;
  location: string;
  industry: string;
  lead_score: number;
  reason: string;
  opportunity?: string;
  suggested_service?: string;
  status: 'new' | 'contacted' | 'interested' | 'proposal_sent' | 'converted' | 'rejected';
  value?: number;
};

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const industries = ['Restaurants', 'Law Firms', 'Schools', 'Churches', 'Construction', 'E-commerce', 'Healthcare', 'Finance', 'Real Estate', 'Technology'];
  const locations = ['Nigeria', 'Lagos', 'Abuja', 'London', 'United States', 'New York', 'California'];

  const [leads, setLeads] = useState<Lead[]>([]);
  const [targetIndustry, setTargetIndustry] = useState(searchParams.get('industry') || 'Restaurants');
  const [targetLocation, setTargetLocation] = useState(searchParams.get('location') || 'Nigeria');
  const [idealCustomer, setIdealCustomer] = useState(searchParams.get('customer') || '');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [generatingAdvice, setGeneratingAdvice] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      const json = await res.json();
      setLeads(json.leads ?? []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    try {
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetIndustry, targetLocation, idealCustomer })
      });
      const json = await res.json();
      if (json.leads) setLeads(json.leads);
    } catch {
      // Handle error
    } finally {
      setSearching(false);
    }
  }

  async function updateLeadStatus(id: string, status: Lead['status']) {
    try {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch {
      // Handle error
    }
  }

  async function deleteLead(id: string) {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch {
      // Handle error
    }
  }

  async function generateAiAdvice(lead: Lead) {
    setGeneratingAdvice(true);
    setAiAdvice('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze lead: ${lead.business_name}, ${lead.industry}, ${lead.location}. Score: ${lead.lead_score}. Provide 3 actionable outreach recommendations.`
        })
      });
      const json = await res.json();
      setAiAdvice(json.text || json.error || 'Unable to generate.');
    } catch {
      setAiAdvice('Failed.');
    } finally {
      setGeneratingAdvice(false);
    }
  }

  function openLeadDetail(lead: Lead) {
    setSelectedLead(lead);
    setShowDetail(true);
  }

  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.lead_score >= 80).length;
  const pipelineLeads = leads.filter((l) => ['contacted', 'interested', 'proposal_sent'].includes(l.status)).length;

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          <PageHeader
            title="Lead Intelligence"
            description="Discover and qualify prospects for your business"
            action={
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-muted hidden sm:inline">{totalLeads} total</span>
                <Badge variant={hotLeads > 0 ? 'success' : 'default'} className="text-xs">
                  {hotLeads} hot
                </Badge>
                <Badge variant={pipelineLeads > 0 ? 'primary' : 'default'} className="text-xs">
                  {pipelineLeads} active
                </Badge>
              </div>
            }
          />

          <Section title="Search Filters" className="mb-6">
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-medium text-text-muted mb-1.5">Industry</label>
                   <select
                     value={targetIndustry}
                     onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetIndustry(e.target.value)}
                  className="w-full rounded-xl border border-border/30 bg-background-secondary/30 px-3 py-2 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                >
                  {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-medium text-text-muted mb-1.5">Location</label>
                <select
                  value={targetLocation}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetLocation(e.target.value)}
                  className="w-full rounded-xl border border-border/30 bg-background-secondary/30 px-3 py-2 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                >
                  {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-0 sm:min-w-60">
                <label className="block text-xs font-medium text-text-muted mb-1.5">Ideal Customer Profile</label>
                <Input
                  value={idealCustomer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdealCustomer(e.target.value)}
                  placeholder="Describe your ideal customer..."
                />
              </div>
              <Button
                type="submit"
                disabled={searching}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4" />
                Search
              </Button>
            </form>
          </Section>

          <Section title="Leads">
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-4 py-3 text-left font-medium text-text-muted text-[0.65rem] uppercase tracking-wider">Lead</th>
                    <th className="px-4 py-3 text-center font-medium text-text-muted text-[0.65rem] uppercase tracking-wider">Score</th>
                    <th className="px-4 py-3 text-center font-medium text-text-muted text-[0.65rem] uppercase tracking-wider">Status</th>
                    <th className="w-20 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border/20 last:border-0 hover:bg-surface/40 transition cursor-pointer"
                      onClick={() => router.push(`/leads/${lead.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-text-heading">{lead.business_name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[0.65rem] text-text-muted flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lead.location}
                            </span>
                            <span className="text-[0.65rem] text-text-muted flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {lead.industry}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Badge
                            variant={lead.lead_score >= 80 ? 'success' : lead.lead_score >= 60 ? 'warning' : 'default'}
                          >
                            {lead.lead_score}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Badge variant="outline" className="text-[0.65rem]">{lead.status}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                          className="rounded-lg p-1.5 text-text-muted hover:text-danger transition"
                          title="Delete lead"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-3">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  onDelete={() => deleteLead(lead.id)}
                />
              ))}
            </div>

            {leads.length === 0 && !loading && (
              <EmptyState
                icon={Target}
                title="No leads found"
                description="Use the search filters above to discover prospects for your business"
                action={
                  <Button variant="primary" onClick={() => {}} className="w-full sm:w-auto">
                    Find leads
                  </Button>
                }
              />
            )}
          </Section>
        </div>
      </main>

      {showDetail && selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setShowDetail(false)}
          onStatusChange={updateLeadStatus}
          onGenerateAdvice={generateAiAdvice}
          aiAdvice={aiAdvice}
          generatingAdvice={generatingAdvice}
        />
      )}
    </div>
  );
}

function LeadCard({ lead, onClick, onDelete }: {
  lead: Lead;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-border/30 bg-background-secondary/30 p-4 cursor-pointer hover:bg-surface/50 transition"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-text-heading flex-1 pr-2">{lead.business_name}</h3>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded-lg p-1.5 text-text-muted hover:text-danger transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <Badge
          variant={lead.lead_score >= 80 ? 'success' : lead.lead_score >= 60 ? 'warning' : 'default'}
          className="text-xs"
        >
          {lead.lead_score}
        </Badge>
        <Badge variant="outline" className="text-[0.65rem]">{lead.status}</Badge>
      </div>
      <div className="flex items-center gap-4 text-[0.65rem] text-text-muted">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.location}</span>
        <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {lead.industry}</span>
      </div>
    </div>
  );
}

function LeadDetailModal({
  lead,
  onClose,
  onStatusChange,
  onGenerateAdvice,
  aiAdvice,
  generatingAdvice
}: {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (id: string, status: Lead['status']) => void;
  onGenerateAdvice: (lead: Lead) => void;
  aiAdvice: string;
  generatingAdvice: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border/30 bg-surface/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-4 sm:px-6 sm:py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-heading">{lead.business_name}</h2>
            <p className="text-sm text-text-muted">{lead.industry} • {lead.location}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-text-muted hover:text-text-heading hover:bg-surface/60 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-5 sm:p-6 sm:space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
            <Badge variant={lead.lead_score >= 80 ? 'success' : lead.lead_score >= 60 ? 'warning' : 'default'}>
              Score: {lead.lead_score}
            </Badge>
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-muted mb-1.5">Status</label>
                 <select
                   value={lead.status}
                   onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onStatusChange(lead.id, e.target.value as Lead['status'])}
                className="w-full rounded-xl border border-border/30 bg-background-secondary/30 px-3 py-2.5 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              >
                <option>New</option>
                <option>Contacted</option>
                <option>Awaiting Reply</option>
                <option>Interested</option>
                <option>Proposal Sent</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted mb-2">Opportunity</p>
            <p className="text-sm text-text-heading leading-6">{lead.opportunity || lead.reason}</p>
          </div>

          <Button
            onClick={() => onGenerateAdvice(lead)}
            disabled={generatingAdvice}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Brain className="h-4 w-4" />
            {generatingAdvice ? 'Generating...' : 'Generate AI Advice'}
          </Button>

          {aiAdvice && (
            <div className="rounded-xl border border-border/30 bg-background-secondary/30 p-4">
              <p className="text-sm text-text-heading whitespace-pre-wrap leading-6">{aiAdvice}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadsPageSkeleton() {
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

export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsPageSkeleton />}>
      <LeadsPageContent />
    </Suspense>
  );
}
