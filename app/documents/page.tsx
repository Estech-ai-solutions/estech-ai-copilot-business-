'use client';

import { useState, type FormEvent } from 'react';
import SiteNav from '@/components/site-nav';

export default function DocumentsPage() {
  const [docType, setDocType] = useState<'Quote' | 'Invoice' | 'Proposal' | 'Report' | 'Contract'>('Quote');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [loading, setLoading] = useState(false);

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function handleGenerate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setGeneratedDoc('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          prompt: `Generate a professional ${docType.toLowerCase()} for a small business. Document title: ${title || docType}

Additional details: ${content}

Format the response as a clean business document:
- Use clear section headers
- Separate sections with lines (----)
- Include proper business formatting
- No markdown formatting, use clean text
- Make it ready to copy and send to clients`
        })
      });
      const json = await res.json();
      setGeneratedDoc(json.text || json.error || 'Failed to generate document.');
    } catch {
      setGeneratedDoc('Could not generate document. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!generatedDoc) return;
    try {
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title: title || `${docType} ${new Date().toLocaleDateString()}`, type: docType, content: generatedDoc })
      });
      alert('Document saved to your library!');
    } catch {
      alert('Failed to save document.');
    }
  }

  function downloadTXT() {
    if (!generatedDoc) return;
    
    const blob = new Blob([generatedDoc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType.toLowerCase().replace(' ', '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav />
      <section className="section-container py-16">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
              📄
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Document Studio</p>
              <h1 className="mt-1 text-3xl font-bold text-white">Create professional business documents</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-slate-300">
            Generate quotes, invoices, proposals, contracts, and reports. Every document is formatted for clients and ready to download.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            {/* Input Panel */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200">Document type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                >
                  <option value="Quote">Quote</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Report">Report</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Document title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Website Design Quote for ABC Corp"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Additional details</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Client name, services, timeline, terms..."
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate as any}
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Generating...' : 'Generate document'}
              </button>
            </div>

            {/* Output Panel */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Document preview</h2>
                {generatedDoc && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedDoc)}
                      className="rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Copy
                    </button>
                    <button
                      onClick={downloadTXT}
                      className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-sky-400"
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-6 min-h-[300px] font-mono text-sm">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800" />
                    <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-slate-800" />
                  </div>
                ) : generatedDoc ? (
                  <pre className="whitespace-pre-wrap break-words leading-relaxed text-slate-200">{generatedDoc}</pre>
                ) : (
                  <p className="text-slate-400">Your professional document will appear here.</p>
                )}
              </div>

              {generatedDoc && (
                <button
                  onClick={handleSave}
                  className="mt-4 text-xs text-sky-400 underline hover:text-sky-300"
                >
                  Save to document library
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}