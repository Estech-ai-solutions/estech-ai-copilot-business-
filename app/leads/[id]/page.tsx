'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import SidebarNav from '@/components/sidebar-nav';
import { Building2, Globe, MapPin, MessageSquare, Copy, Send, Tag, ArrowUpRight, Check, Brain, ExternalLink, Mail, Phone, MapPinned } from 'lucide-react';
import { PageHeader, Section, Badge, Button, Input } from '@/components/ui';

type Lead = {
  id: string;
  business_name: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  location: string;
  industry: string;
  description?: string;
  lead_score: number;
  reason: string;
  opportunity?: string;
  suggested_service?: string;
  source_url?: string;
  status: 'new' | 'contacted' | 'interested' | 'proposal_sent' | 'converted' | 'rejected';
  notes?: string;
  created_at: string;
};

type Outreach = {
  id: string;
  lead_id: string;
  type: 'Email' | 'LinkedIn' | 'WhatsApp' | 'Cold Outreach';
  subject?: string;
  content: string;
  status: 'Draft' | 'Sent' | 'Replied';
  created_at: string;
};

type AIRecommendations = {
  whyGoodLead: string;
  outreachStrategy: string;
  suggestedService: string;
  openingEmail: string;
  objections: string;
  followUpStrategy: string;
};

const outreachTypes = ['Email', 'LinkedIn', 'WhatsApp', 'Cold Outreach'] as const;

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [outreach, setOutreach] = useState<Outreach[]>([]);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [selectedOutreachType, setSelectedOutreachType] = useState<typeof outreachTypes[number]>('Email');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);

  async function loadLead() {
    if (!leadId) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const json = await res.json();
      if (json.lead) {
        setLead(json.lead);
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
      const res = await fetch(`/api/leads/${leadId}/outreach`);
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
        headers: { 'Content-Type': 'application/json' },
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

  async function generateRecommendations() {
    if (!lead) return;
    setGeneratingRecommendations(true);
    setRecommendations(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze this lead and provide detailed recommendations for outreach.

Lead Information:
- Business Name: ${lead.business_name}
- Industry: ${lead.industry}
- Location: ${lead.location}
- Website: ${lead.website || 'Not provided'}
- Email: ${lead.email || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Lead Score: ${lead.lead_score}
- Reason: ${lead.reason}
- Opportunity: ${lead.opportunity || 'Not specified'}
- Suggested Service: ${lead.suggested_service || 'Not specified'}
- Description: ${lead.description || 'Not provided'}

Provide your response in the following JSON format only (no markdown, no extra text):
{
  "whyGoodLead": "string - 2-3 sentences explaining why this is a valuable lead",
  "outreachStrategy": "string - the best first outreach strategy (channel, timing, approach)",
  "suggestedService": "string - the specific service to pitch and why",
  "openingEmail": "string - a complete example opening email (100-150 words)",
  "objections": "string - likely objections and how to handle them",
  "followUpStrategy": "string - follow-up sequence and timing"
}`
        })
      });
      const json = await res.json();
      const text = json.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          setRecommendations(JSON.parse(jsonMatch[0]));
        } catch {
          setRecommendations({
            whyGoodLead: text,
            outreachStrategy: '',
            suggestedService: '',
            openingEmail: '',
            objections: '',
            followUpStrategy: '',
          });
        }
      }
    } catch {
      setRecommendations({
        whyGoodLead: 'Failed to generate recommendations.',
        outreachStrategy: '',
        suggestedService: '',
        openingEmail: '',
        objections: '',
        followUpStrategy: '',
      });
    } finally {
      setGeneratingRecommendations(false);
    }
  }

  async function saveOutreachMessage() {
    if (!generatedMessage || !lead) return;

    try {
      const res = await fetch(`/api/leads/${leadId}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="lg:pl-64">
          <div className="px-6 py-8 lg:px-8">
            <p className="text-text-muted">Loading lead...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="lg:pl-64">
          <div className="px-6 py-8 lg:px-8">
            <p className="text-text-muted">Lead not found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav />

      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-8">
          <PageHeader
            title={lead.business_name}
            description={`${lead.industry} • ${lead.location}`}
            action={
              <div className="flex items-center gap-3">
                <Badge
                  variant={lead.lead_score >= 80 ? 'success' : lead.lead_score >= 50 ? 'warning' : 'default'}
                >
                  Score: {lead.lead_score}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                  Back
                </Button>
              </div>
            }
          />

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Section title="Lead Details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Business Name" value={lead.business_name} />
                  {lead.website && (
                    <DetailField
                      label="Website"
                      value={lead.website}
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      icon={ExternalLink}
                    />
                  )}
                  {lead.email && (
                    <DetailField label="Email" value={lead.email} icon={Mail} />
                  )}
                  {lead.phone && (
                    <DetailField label="Phone" value={lead.phone} icon={Phone} />
                  )}
                  {lead.address && (
                    <DetailField label="Address" value={lead.address} icon={MapPinned} />
                  )}
                  {lead.city && (
                    <DetailField label="City" value={lead.city} />
                  )}
                  {lead.state && (
                    <DetailField label="State" value={lead.state} />
                  )}
                  <DetailField label="Industry" value={lead.industry} />
                  {lead.description && (
                    <div className="sm:col-span-2">
                      <DetailField label="Description" value={lead.description} />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1.5">Status</p>
                    <select
                      value={lead.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value as Lead['status'];
                        await fetch('/api/leads', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: lead.id, status: newStatus })
                        });
                        setLead({ ...lead, status: newStatus });
                      }}
                      className="w-full rounded-xl border border-border/60 bg-background-secondary/60 px-3.5 py-2.5 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
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
                  {lead.source_url && (
                    <DetailField
                      label="Source URL"
                      value={lead.source_url}
                      href={lead.source_url.startsWith('http') ? lead.source_url : `https://${lead.source_url}`}
                      icon={ExternalLink}
                    />
                  )}
                </div>
              </Section>

              <Section title="Lead Analysis">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-2">Reason for Score</p>
                    <p className="text-sm text-text-heading leading-6">{lead.reason}</p>
                  </div>
                  {lead.opportunity && (
                    <div>
                      <p className="text-xs font-medium text-text-muted mb-2">Opportunity</p>
                      <p className="text-sm text-text-heading leading-6">{lead.opportunity}</p>
                    </div>
                  )}
                  {lead.suggested_service && (
                    <div>
                      <p className="text-xs font-medium text-text-muted mb-2">Suggested Service</p>
                      <p className="text-sm text-primary leading-6">{lead.suggested_service}</p>
                    </div>
                  )}
                </div>
              </Section>

              <Section title="AI Recommendations">
                {!recommendations && !generatingRecommendations && (
                  <Button
                    onClick={generateRecommendations}
                    variant="primary"
                    className="w-full sm:w-auto"
                  >
                    <Brain className="h-4 w-4" />
                    Generate AI Recommendations
                  </Button>
                )}

                {generatingRecommendations && (
                  <p className="text-sm text-text-muted">Generating recommendations...</p>
                )}

                {recommendations && (
                  <div className="space-y-4">
                    <RecommendationCard title="Why This Lead" content={recommendations.whyGoodLead} />
                    <RecommendationCard title="Best Outreach Strategy" content={recommendations.outreachStrategy} />
                    <RecommendationCard title="Suggested Service to Pitch" content={recommendations.suggestedService} />
                    <RecommendationCard title="Example Opening Email" content={recommendations.openingEmail} onCopy={() => copyToClipboard(recommendations.openingEmail)} />
                    <RecommendationCard title="Possible Objections" content={recommendations.objections} />
                    <RecommendationCard title="Follow-Up Strategy" content={recommendations.followUpStrategy} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateRecommendations}
                    >
                      Regenerate
                    </Button>
                  </div>
                )}
              </Section>

              <Section title="Outreach Generator">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium text-text-heading mb-2">Outreach Type</p>
                    <div className="flex flex-wrap gap-2">
                      {outreachTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedOutreachType(type)}
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                            selectedOutreachType === type
                              ? 'bg-primary text-white'
                              : 'border border-border/60 bg-background-secondary/40 text-text-muted hover:bg-surface/60'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={generateOutreach}
                    disabled={generatingOutreach}
                    variant="primary"
                  >
                    <Send className="h-4 w-4" />
                    {generatingOutreach ? 'Generating...' : 'Generate Outreach'}
                  </Button>

                  {generatedMessage && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-text-muted">{selectedOutreachType} Message</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(generatedMessage)}
                            className="rounded-xl p-1.5 text-text-muted hover:bg-surface/60 transition"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <Button
                            variant="secondary"
                            onClick={saveOutreachMessage}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                      <pre className="max-h-72 overflow-y-auto rounded-xl border border-border/60 bg-background-secondary/40 p-4 text-sm text-text-heading whitespace-pre-wrap leading-6">
                        {generatedMessage}
                      </pre>
                    </div>
                  )}
                </div>
              </Section>
            </div>

            <div className="space-y-6">
              <Section title="Outreach History">
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {outreach.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-8">No outreach messages yet</p>
                  ) : (
                    outreach.map((o) => (
                      <div key={o.id} className="rounded-xl border border-border/40 bg-background-secondary/40 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-primary">{o.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {o.status}
                          </Badge>
                        </div>
                        <pre className="max-h-32 overflow-y-auto text-xs text-text-heading whitespace-pre-wrap leading-5">
                          {o.content}
                        </pre>
                      </div>
                    ))
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

function DetailField({ label, value, href, icon: Icon }: {
  label: string;
  value: string;
  href?: string;
  icon?: any;
}) {
  const content = (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />}
      <div>
        <p className="text-xs font-medium text-text-muted mb-1">{label}</p>
        <p className="text-sm text-text-heading break-all">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <div>
        <p className="text-xs font-medium text-text-muted mb-1.5">{label}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline break-all flex items-center gap-1"
        >
          {value}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-text-muted mb-1.5">{label}</p>
      <p className="text-sm text-text-heading break-all">{value}</p>
    </div>
  );
}

function RecommendationCard({ title, content, onCopy }: {
  title: string;
  content: string;
  onCopy?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-background-secondary/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</p>
        {onCopy && (
          <button
            onClick={onCopy}
            className="rounded-lg p-1 text-text-muted hover:text-text-heading transition"
            title="Copy to clipboard"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="text-sm text-text-heading leading-6 whitespace-pre-wrap">{content}</p>
    </div>
  );
}