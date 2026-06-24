'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SidebarNav from '@/components/sidebar-nav';
import { Search, Target, MessageSquare, Edit3, Trash2, FileText, ChevronRight } from 'lucide-react';

type Lead = {
  id: number;
  business_name: string;
  website?: string;
  location: string;
  industry: string;
  lead_score: number;
  reason: string;
  opportunity?: string;
  suggested_service?: string;
  status: 'New' | 'Contacted' | 'Awaiting Reply' | 'Interested' | 'Proposal Sent' | 'Won' | 'Lost';
};

type LeadSearch = {
  id: number;
  target_industry: string;
  target_location: string;
  ideal_customer_description?: string;
  search_query: string;
  results_found: number;
  created_at: string;
};

const industries = ['Restaurants', 'Law Firms', 'Schools', 'Churches', 'Construction', 'E-commerce', 'Healthcare', 'Finance', 'Real Estate', 'Technology'];
const locations = ['Nigeria', 'Lagos', 'Abuja', 'London', 'United States', 'New York', 'California'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searches, setSearches] = useState<LeadSearch[]>([]);
  const [targetIndustry, setTargetIndustry] = useState('Restaurants');
  const [targetLocation, setTargetLocation] = useState('Nigeria');
  const [idealCustomer, setIdealCustomer] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function loadLeads() {
    try {
      const res = await fetch('/api/leads', { headers: getAuthHeaders() });
      const json = await res.json();
      setLeads(json.leads ?? []);
    } catch {}
  }

  async function loadSearches() {
    try {
      const res = await fetch('/api/searches', { headers: getAuthHeaders() });
      const json = await res.json();
      setSearches(json.searches ?? []);
    } catch {}
  }

  useEffect(() => {
    loadLeads();
    loadSearches();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    try {
      const searchQuery = `${targetIndustry} in ${targetLocation} ${idealCustomer ? `- ${idealCustomer}` : ''}`;
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          targetIndustry,
          targetLocation,
          idealCustomer
        })
      });
      const json = await res.json();
      if (json.leads) setLeads(json.leads);
      loadSearches();
    } catch {}
    setSearching(false);
  }

  async function updateLeadStatus(id: number, status: Lead['status']) {
    try {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id, status })
      });
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    } catch {}
  }

  async function deleteLead(id: number) {
    try {
      await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id })
      });
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch {}
  }

  const hotLeads = leads.filter((l) => l.lead_score >= 80).length;
  const pipelineLeads = leads.filter((l) => ['Contacted', 'Awaiting Reply', 'Interested', 'Proposal Sent'].includes(l.status)).length;
  const wonLeads = leads.filter((l) => l.status === 'Won').length;

  return (
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />

      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Lead Intelligence</h1>
              <p className="mt-1 text-slate-400">Find and convert prospects into customers.</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{hotLeads}</p>
                <p className="text-xs text-slate-400">Hot Leads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{pipelineLeads}</p>
                <p className="text-xs text-slate-400">In Pipeline</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{wonLeads}</p>
                <p className="text-xs text-slate-400">Won</p>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-8 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Lead Search</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-200">Industry</label>
                <select
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                >
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200">Location</label>
                <select
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-slate-200">Ideal Customer</label>
                <input
                  value={idealCustomer}
                  onChange={(e) => setIdealCustomer(e.target.value)}
                  placeholder="e.g. businesses needing websites"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={searching}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {searching ? 'Finding Leads...' : 'Find Leads'}
            </button>
          </form>

          {/* Leads Table */}
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Leads</h2>
            <div className="mt-4 divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900/50">
              {leads.length === 0 ? (
                <p className="p-6 text-slate-400">No leads found. Use the search form above to discover prospects.</p>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 transition hover:bg-slate-900/60">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-white">{lead.business_name}</p>
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          lead.lead_score >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                          lead.lead_score >= 50 ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          Score: {lead.lead_score}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{lead.industry} • {lead.location}</p>
                      <p className="mt-2 max-w-2xl text-sm text-slate-300 line-clamp-2">{lead.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Awaiting Reply">Awaiting Reply</option>
                        <option value="Interested">Interested</option>
                        <option value="Proposal Sent">Proposal Sent</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                      <Link href={`/leads/${lead.id}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}