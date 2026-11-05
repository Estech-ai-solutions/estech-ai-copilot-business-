'use client';

import Link from 'next/link';
import { Bot, ShieldAlert, Target, Brain, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';

const DEMO_LEADS = [
  { id: 'd1', business: 'Acme Design Co.', contact: 'Jordan Lee', status: 'New', score: 82, enquiry: 'Website redesign proposal' },
  { id: 'd2', business: 'Northwind Consulting', contact: 'Sam Rivera', status: 'Contacted', score: 65, enquiry: 'Retainer for monthly reporting' },
  { id: 'd3', business: 'Brightline IT', contact: 'Alex Kim', status: 'Proposal Sent', score: 90, enquiry: 'Managed services quote' },
];

const DEMO_FOLLOW_UPS = [
  { id: 'f1', lead: 'Acme Design Co.', action: 'Send proposal', due: 'Today', status: 'pending' },
  { id: 'f2', lead: 'Brightline IT', action: 'Follow-up call', due: 'Tomorrow', status: 'pending' },
  { id: 'f3', lead: 'Northwind Consulting', action: 'Invoice review', due: 'This week', status: 'done' },
];

const DEMO_DOCUMENTS = [
  { id: 'd1', title: 'Acme Design Proposal', type: 'Proposal', updated: '2 days ago' },
  { id: 'd2', title: 'Northwind Retainer Agreement', type: 'Agreement', updated: '5 days ago' },
  { id: 'd3', title: 'Q3 Service Report', type: 'Report', updated: '1 week ago' },
];

const DEMO_ACTIVITY = [
  { action: 'Proposal sent', subject: 'Acme Design Co.', time: '2 hours ago' },
  { action: 'Follow-up scheduled', subject: 'Brightline IT', time: '1 day ago' },
  { action: 'Document updated', subject: 'Northwind Retainer Agreement', time: '3 days ago' },
];

const DEMO_BRAIN = [
  { item: 'Services: Web design, branding, SEO', status: 'indexed' },
  { item: 'Pricing: Standard & retainer packages', status: 'indexed' },
  { item: 'Policies: Refund & SLA', status: 'indexed' },
  { item: 'Brand voice: Professional yet approachable', status: 'indexed' },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        {/* Demo banner */}
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 mb-8 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-text-heading flex items-center gap-2">
              <span className="text-xs font-bold bg-warning/20 text-warning rounded px-2 py-0.5">DEMO</span>
              Estech Demo Workspace
            </h2>
            <p className="text-sm text-text-muted">
              Read-only demo with sample data. No account required and no real records are accessed
              or modified. Sign in or create an account to work with your own data.
            </p>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-text-heading">Explore Estech</h1>
          <p className="text-sm text-text-muted mt-1">
            Browse a sample dashboard with leads, follow-ups, documents, analytics, and Business Brain.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-xl border border-border/40 bg-surface/60 p-4">
            <p className="text-xs font-medium text-text-muted">Sample Leads</p>
            <p className="text-2xl font-semibold text-text-heading">{DEMO_LEADS.length}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-surface/60 p-4">
            <p className="text-xs font-medium text-text-muted">Pending Follow-ups</p>
            <p className="text-2xl font-semibold text-text-heading">{DEMO_FOLLOW_UPS.filter(f => f.status === 'pending').length}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-surface/60 p-4">
            <p className="text-xs font-medium text-text-muted">Sample Documents</p>
            <p className="text-2xl font-semibold text-text-heading">{DEMO_DOCUMENTS.length}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-surface/60 p-4">
            <p className="text-xs font-medium text-text-muted">Business Brain Items</p>
            <p className="text-2xl font-semibold text-text-heading">{DEMO_BRAIN.length}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Leads */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-text-heading">Sample Leads</h3>
              <Link
                href="/leads"
                className="text-xs text-primary hover:underline"
              >
                View all leads <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-xl border border-border/40 bg-surface/60">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="border-b border-border/40 bg-text-muted/5 px-3 py-2 text-xs font-medium text-text-muted">Business</th>
                      <th className="border-b border-border/40 bg-text-muted/5 px-3 py-2 text-xs font-medium text-text-muted">Contact</th>
                      <th className="border-b border-border/40 bg-text-muted/5 px-3 py-2 text-xs font-medium text-text-muted">Status</th>
                      <th className="border-b border-border/40 bg-text-muted/5 px-3 py-2 text-xs font-medium text-text-muted">Score</th>
                      <th className="border-b border-border/40 bg-text-muted/5 px-3 py-2 text-xs font-medium text-text-muted">Enquiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_LEADS.map((l) => (
                      <tr key={l.id} className="border-b border-border/40 hover:bg-text-muted/5">
                        <td className="border-b border-border/40 px-3 py-2.5 text-text-heading">{l.business}</td>
                        <td className="border-b border-border/40 px-3 py-2.5 text-text-muted">{l.contact}</td>
                        <td className="border-b border-border/40 px-3 py-2.5">
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium border-border/40 text-text-muted">{l.status}</span>
                        </td>
                        <td className="border-b border-border/40 px-3 py-2.5 text-text-muted">{l.score}</td>
                        <td className="border-b border-border/40 px-3 py-2.5 text-text-muted">{l.enquiry}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Follow-ups */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-text-heading">Pending Follow-ups</h3>
              <Link
                href="/tasks"
                className="text-xs text-primary hover:underline"
              >
                View all <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-xl border border-border/40 bg-surface/60 p-3">
              <div className="space-y-3">
                {DEMO_FOLLOW_UPS.filter((f) => f.status === 'pending').map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded border border-border/40 bg-background-secondary/40 text-sm">
                    <div className="flex-1">
                      <div className="text-text-heading font-medium">{f.action}</div>
                      <div className="text-xs text-text-muted">{f.lead}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{f.due}</span>
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium border-success/20 text-success bg-success/5">{f.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documents + Brain */}
          <div className="lg:col-span-1 space-y-4">
            <div className="space-y-4">
              <div className="rounded-xl border border-border/40 bg-surface/60 p-4">
                <h3 className="text-base font-medium text-text-heading mb-3">Sample Documents</h3>
                <ul className="space-y-2">
                  {DEMO_DOCUMENTS.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between text-sm">
                      <span className="text-text-heading">{doc.title}</span>
                      <span className="text-xs text-text-muted">{doc.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border/40 bg-surface/60 p-4">
                <h3 className="text-base font-medium text-text-heading mb-3">Business Brain</h3>
                <ul className="space-y-2">
                  {DEMO_BRAIN.map((b) => (
                    <li key={b.item} className="flex items-center justify-between text-sm">
                      <span className="text-text-heading">{b.item}</span>
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium border-success/20 text-success bg-success/5">{b.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="mt-8 rounded-xl border border-border/40 bg-surface/60 p-6">
          <h3 className="text-base font-medium text-text-heading mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {DEMO_ACTIVITY.map((a) => (
              <div key={a.action} className="flex items-center justify-between p-2 rounded border border-border/40 bg-background-secondary/40 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-text-heading">{a.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{a.subject}</span>
                  <span className="text-xs text-text-muted">{a.time}</span>
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <span className="text-xs text-text-muted">Activity is simulated for demonstration purposes.</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="text-base font-medium text-text-heading mb-2">Ready to work with your own data?</h3>
          <p className="text-sm text-text-muted mb-4">
            Sign in to your existing workspace or create an account to connect your real leads, documents,
            and Business Brain.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 transition min-w-[160px]"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-background-secondary/60 px-4 py-3 text-sm font-medium text-text-heading hover:bg-surface/60 transition min-w-[160px]"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
