'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import { MessageSquare, Copy, Download, Send, X, List, Target, FileText, ArrowUpRight } from 'lucide-react';
import { PageHeader, EmptyState, Section, Badge, Button, TextArea } from '@/components/ui';
import { useSupabaseContext } from '@/providers/supabase-provider';
import { cleanMarkdown, formatResponseText } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function ResponsesPageContent() {
  const searchParams = useSearchParams();
  const { profile, workspace } = useSupabaseContext();

  type ResponseTone = 'Professional' | 'Friendly' | 'Sales-focused' | 'Support';

  type StructuredResponse = {
    subject: string;
    message: string;
    suggestedAction: string;
  };

  const [customerMessage, setCustomerMessage] = useState(searchParams.get('message') || '');
  const [tone, setTone] = useState<ResponseTone>('Professional');
  const [loading, setLoading] = useState(false);
  const [structured, setStructured] = useState<StructuredResponse | null>(null);
  const [rawResponse, setRawResponse] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const res = await fetch('/api/responses/history');
      const json = await res.json();
      setHistory(json.history ?? []);
    } catch {}
  }

  const buildPrompt = useCallback(() => {
    const toneInstruction = {
      'Professional': 'Use a professional, formal tone suitable for business communication.',
      'Friendly': 'Use a warm, friendly tone while maintaining professionalism.',
      'Sales-focused': 'Use a persuasive, sales-oriented tone focused on value and benefits.',
      'Support': 'Use an empathetic, helpful tone focused on solving the customer\'s problem.',
    };

    let contextBlock = '';

    if (workspace?.name || workspace?.description) {
      contextBlock += `\n\nBusiness Context:
- Company: ${workspace?.name || 'Not specified'}
- Description: ${workspace?.description || 'Not specified'}`;
    }

    if (profile) {
      contextBlock += `\n- User: ${profile.full_name || 'User'}`;
    }

    return `You are an expert business communication assistant.

Tone: ${toneInstruction[tone]}

Task: Write a professional reply to the following customer message.
The reply should be:
- Concise and clear
- Personalized to the customer
- Include a clear next step or call-to-action
- Reflect the company's voice and brand style${contextBlock}

Customer message:
"${customerMessage}"

Return your response in the following JSON format only (no markdown, no extra text):
{
  "subject": "string - a clear, actionable subject line",
  "message": "string - the full reply message",
  "suggestedAction": "string - the recommended next step for the business owner"
}`;
  }, [tone, customerMessage, workspace, profile]);

  async function handleGenerate() {
    if (!customerMessage.trim()) return;
    setLoading(true);
    setStructured(null);
    setRawResponse('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: buildPrompt(),
          maxTokens: 38000,
        }),
      });
      const json = await res.json();
      const text = json.text || json.error || 'No response generated.';

      const trimmed = text.trim();
      let parsed: { subject?: string; message?: string; suggestedAction?: string } | null = null;

      if (trimmed) {
        let candidate = trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

        const jsonMatch = candidate.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            parsed = null;
          }
        }
      }

      if (parsed) {
        setStructured({
          subject: parsed.subject || 'No subject',
          message: parsed.message || '',
          suggestedAction: parsed.suggestedAction || '',
        });
        setRawResponse('');
      } else {
        const cleanedText = cleanMarkdown(text);
        setRawResponse(cleanedText);
      }
    } catch {
      setRawResponse('Failed to generate.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveResponse() {
    if (!customerMessage || !structured?.message) return;
    setSaving(true);
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerMessage, tone, response: structured.message }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 5000);
  }

  function downloadResponse() {
    const content = structured
      ? `Subject: ${structured.subject}\n\n${structured.message}\n\nSuggested Action: ${structured.suggestedAction}`
      : rawResponse;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tones: ResponseTone[] = ['Professional', 'Friendly', 'Sales-focused', 'Support'];

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          <PageHeader
            title="Communication Studio"
            description="Generate professional replies with the right tone"
            action={
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="rounded-xl p-2.5 text-text-muted hover:bg-surface/60 transition"
                aria-label="Toggle history"
              >
                <List className="h-4 w-4" />
              </button>
            }
          />

          <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4 lg:space-y-5">
              <Section title="Customer Message">
                <TextArea
                  value={customerMessage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerMessage(e.target.value)}
                  placeholder="Paste the customer message here..."
                  rows={5}
                />
                <div className="mt-4">
                  <p className="text-xs font-medium text-text-muted mb-2">Tone</p>
                  <div className="flex flex-wrap gap-2">
                    {tones.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t)}
                        className={`rounded-xl border px-3.5 py-1.5 text-xs font-medium transition min-h-[44px] ${
                          tone === t
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-border/60 text-text-muted hover:bg-surface/60'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-5">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !customerMessage.trim()}
                    variant="primary"
                    className="w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4" />
                    {loading ? 'Generating...' : 'Generate Reply'}
                  </Button>
                </div>
              </Section>

              {structured && (
                <Section title="Generated Response">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/40 bg-background-secondary/40 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Subject</p>
                        <button
                          onClick={() => copyToClipboard(structured.subject, 'subject')}
                          className="rounded-lg p-1.5 text-text-muted hover:text-text-heading transition"
                          title="Copy subject"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm text-text-heading font-medium">{structured.subject}</p>
                    </div>

                    <div className="rounded-xl border border-border/40 bg-background-secondary/40 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Message</p>
                        <button
                          onClick={() => copyToClipboard(structured.message, 'message')}
                          className="rounded-lg p-1.5 text-text-muted hover:text-text-heading transition"
                          title="Copy message"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div
                        className="text-sm text-text-heading leading-6"
                        dangerouslySetInnerHTML={{ __html: formatResponseText(structured.message) }}
                      />
                    </div>

                    {structured.suggestedAction && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Suggested Action</p>
                        <div
                          className="text-sm text-text-heading leading-6"
                          dangerouslySetInnerHTML={{ __html: formatResponseText(structured.suggestedAction) }}
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => copyToClipboard(structured.message, 'full')}
                          className="w-full sm:w-auto"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedField === 'full' ? 'Copied!' : 'Copy Full Response'}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={downloadResponse}
                          className="w-full sm:w-auto"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleGenerate}
                          disabled={loading}
                          className="w-full sm:w-auto"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {loading ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleSaveResponse}
                        disabled={saving}
                        className="w-full sm:w-auto"
                      >
                        {saving ? 'Saving...' : 'Save to Library'}
                      </Button>
                    </div>
                  </div>
                </Section>
              )}

              {rawResponse && !structured && (
                <Section title={`${tone} Response`}>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/40 bg-background-secondary/40 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Response</p>
                        <button
                          onClick={() => copyToClipboard(rawResponse, 'raw')}
                          className="rounded-lg p-1.5 text-text-muted hover:text-text-heading transition"
                          title="Copy response"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div
                        className="text-sm text-text-heading leading-6"
                        dangerouslySetInnerHTML={{ __html: formatResponseText(rawResponse) }}
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                        <Button
                          variant="secondary"
                          onClick={downloadResponse}
                          className="w-full sm:w-auto"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleGenerate}
                          disabled={loading}
                          className="w-full sm:w-auto"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {loading ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleSaveResponse}
                        disabled={saving}
                        className="w-full sm:w-auto"
                      >
                        {saving ? 'Saving...' : 'Save to Library'}
                      </Button>
                    </div>
                  </div>
                </Section>
              )}
            </div>

            <div className="hidden lg:block space-y-5">
              <Section title="Quick Actions">
                <div className="space-y-2">
                  <Link
                    href="/leads"
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3 text-sm text-text-heading transition hover:bg-surface/60"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-primary" />
                      <span>Find leads</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-text-muted" />
                  </Link>
                  <Link
                    href="/documents"
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3 text-sm text-text-heading transition hover:bg-surface/60"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <span>Create document</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-text-muted" />
                  </Link>
                </div>
              </Section>

              <Section title="Templates">
                <div className="space-y-2">
                  <p className="text-sm text-text-muted">Customer onboarding</p>
                  <p className="text-sm text-text-muted">Follow-up sequence</p>
                  <p className="text-sm text-text-muted">Sales proposal</p>
                </div>
              </Section>
            </div>

            <div className="lg:hidden space-y-4">
              <Section title="Quick Actions">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/leads"
                    className="flex items-center gap-2 rounded-xl border border-border/40 bg-background-secondary/40 px-3 py-3 text-xs font-medium text-text-heading transition hover:bg-surface/60"
                  >
                    <Target className="h-4 w-4 text-primary" />
                    <span>Find leads</span>
                  </Link>
                  <Link
                    href="/documents"
                    className="flex items-center gap-2 rounded-xl border border-border/40 bg-background-secondary/40 px-3 py-3 text-xs font-medium text-text-heading transition hover:bg-surface/60"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Documents</span>
                  </Link>
                </div>
              </Section>
            </div>
          </div>
        </div>
      </main>

      {showHistory && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto border-l border-border/40 bg-background/90 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">History</p>
                <button
                  onClick={() => setShowHistory(false)}
                  className="rounded-xl p-1.5 text-text-muted hover:bg-surface/60 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {history.length > 0 ? (
                  history.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCustomerMessage(item.customerMessage);
                        setStructured({
                          subject: item.subject || 'No subject',
                          message: item.response,
                          suggestedAction: '',
                        });
                        setRawResponse('');
                        setShowHistory(false);
                      }}
                      className="w-full rounded-xl border border-border/40 bg-background-secondary/40 p-3.5 text-left transition hover:bg-surface/60"
                    >
                      <p className="truncate text-sm font-medium text-text-heading">{item.customerMessage}</p>
                      <p className="mt-1 text-xs text-primary">{item.tone}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-text-muted text-center py-8">No history yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResponsesPageSkeleton() {
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

export default function ResponsesPage() {
  return (
    <Suspense fallback={<ResponsesPageSkeleton />}>
      <ResponsesPageContent />
    </Suspense>
  );
}
