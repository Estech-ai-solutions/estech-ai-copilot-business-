'use client';

import { useState, type FormEvent } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { FileText, Copy, Download } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />
      
      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-sky-400" />
              <h1 className="text-2xl font-bold text-white">Document Studio</h1>
            </div>
            <p className="mt-2 text-slate-400">
              Generate quotes, invoices, proposals, contracts, and reports ready for clients.
            </p>
          </div>

          {/* Main Grid */}
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Input Panel */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-200">Document type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
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
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Additional details</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Client name, services, timeline, terms..."
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate as any}
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Generating...' : 'Generate document'}
              </button>
            </div>

            {/* Output Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Preview</h2>
                {generatedDoc && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedDoc)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                    <button
                      onClick={downloadTXT}
                      className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-sky-400"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 min-h-[300px] font-mono text-sm">
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
                  className="text-xs text-sky-400 underline hover:text-sky-300"
                >
                  Save to document library
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}