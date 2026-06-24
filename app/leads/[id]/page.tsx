'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SidebarNav from '@/components/sidebar-nav';
import { Building2, Globe, MapPin, MessageSquare, Copy } from 'lucide-react';

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
  notes?: string;
  created_at: string;
};

type Outreach = {
  id: number;
  lead_id: number;
  type: 'Email' | 'LinkedIn' | 'WhatsApp' | 'Cold Outreach';
  subject?: string;
  content: string;
  status: 'Draft' | 'Sent' | 'Replied';
  created_at: string;
};

const outreachTypes = ['Email', 'LinkedIn', 'WhatsApp', 'Cold Outreach'] as const;

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id ? Number(params.id) : 0;
  const [lead, setLead] = useState<Lead | null>(null);
  const [outreach, setOutreach] = useState<Outreach[]>([]);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [selectedOutreachType, setSelectedOutreachType] = useState<typeof outreachTypes[number]>('Email');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function loadLead() {
    if (!leadId) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.lead) {
        setLead(json.lead);
        setNotes(json.lead.notes || '');
      }
    } catch (e) {
      console.error('Failed to load lead:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadOutreach() {
    if (!leadId) return;
    try {
      const res = await fetch(`/api/leads/${leadId}/outreach`, { headers: getAuthHeaders() });
      const json = await res.json();
      setOutreach(json.outreach ?? []);
    } catch {}
  }

  useEffect(() => {
    loadLead();
    loadOutreach();
  }, [leadId]);

  async function generateOutreach() {
    if (!lead) return;
    setGeneratingOutreach(true);
    setGeneratedMessage('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          prompt: `Generate a personalized ${selectedOutreachType.toLowerCase()} outreach message for:

Lead: ${lead.business_name}
Industry: ${lead.industry}
Location: ${lead.location}
Lead Score: ${lead.lead_score}
Opportunity: ${lead.opportunity || lead.reason}
Suggested Service: ${lead.suggested_service || 'Our services'}

Style: Professional, concise, value-focused
Include: 
- Personalized greeting
- Specific mention of their business
- Clear value proposition
- Call to action
- Professional sign-off`
        })
      });
      const json = await res.json();
      setGeneratedMessage(json.text || '');
    } catch {
      setGeneratedMessage('Failed to generate outreach message.');
    } finally {
      setGeneratingOutreach(false);
    }
  }

  async function saveOutreachMessage() {
    if (!generatedMessage || !lead) return;

    try {
      const res = await fetch(`/api/leads/${leadId}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          type: selectedOutreachType,
          content: generatedMessage
        })
      });
      const json = await res.json();
      setOutreach((prev) => [json.outreach, ...prev]);
      setGeneratedMessage('');
    } catch {
      alert('Failed to save outreach message.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <SidebarNav />
        <main className="lg:pl-64">
          <div className="px-6 py-8 lg:px-12">
            <p className="text-slate-400">Loading lead...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-slate-950">
        <SidebarNav />
        <main className="lg:pl-64">
          <div className="px-6 py-8 lg:px-12">
            <p className="text-slate-400">Lead not found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />

      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{lead.business_name}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{lead.location}</span>
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{lead.industry}</span>
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-400 hover:underline">
                    <Globe className="h-4 w-4" />
                    {lead.website}
                  </a>
                )}
              </div>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              lead.lead_score >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
              lead.lead_score >= 50 ? 'bg-amber-500/20 text-amber-300' :
              'bg-slate-700 text-slate-300'
            }`}>
              Lead Score: {lead.lead_score}
            </span>
          </div>

          {/* Status */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-200 mb-2">Status</label>
            <select
              value={lead.status}
              onChange={async (e) => {
                const newStatus = e.target.value as Lead['status'];
                await fetch('/api/leads', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                  body: JSON.stringify({ id: lead.id, status: newStatus })
                });
                setLead({ ...lead, status: newStatus });
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 outline-none focus:border-sky-500"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Awaiting Reply">Awaiting Reply</option>
              <option value="Interested">Interested</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Lead Details */}
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Opportunity Analysis</h2>
                <p className="mt-3 text-slate-300">{lead.reason}</p>
                {lead.opportunity && (
                  <p className="mt-3 text-slate-300">{lead.opportunity}</p>
                )}
                {lead.suggested_service && (
                  <p className="mt-3 text-sm text-sky-400">{lead.suggested_service}</p>
                )}
              </div>

              {/* Outreach Generator */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Outreach Generator</h2>
                <div className="mt-4 flex gap-2">
                  {outreachTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedOutreachType(type)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        selectedOutreachType === type
                          ? 'bg-sky-500 text-slate-950'
                          : 'border border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <button
                  onClick={generateOutreach}
                  disabled={generatingOutreach}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
                >
                  <MessageSquare className="h-4 w-4" />
                  {generatingOutreach ? 'Generating...' : 'Generate Outreach'}
                </button>

                {generatedMessage && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white">{selectedOutreachType} Message</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(generatedMessage)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={saveOutreachMessage}
                          className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-slate-950"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                    <pre className="mt-3 max-h-64 overflow-y-auto rounded-lg bg-slate-950/50 p-4 text-sm text-slate-300">{generatedMessage}</pre>
                  </div>
                )}
              </div>
            </div>

            <div>
              {/* Outreach History */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Outreach History</h2>
                <div className="mt-4 space-y-3">
                  {outreach.length === 0 ? (
                    <p className="text-slate-400">No outreach messages yet.</p>
                  ) : (
                    outreach.map((o) => (
                      <div key={o.id} className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-sky-400">{o.type}</span>
                          <span className="text-xs text-slate-400">{o.status}</span>
                        </div>
                        <pre className="mt-2 max-h-24 overflow-y-auto text-xs text-slate-300">{o.content.slice(0, 100)}...</pre>
                      </div>
                    ))
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