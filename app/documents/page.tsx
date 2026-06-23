'use client';

import { useState, useEffect, type FormEvent } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { FileText, Copy, Download, Plus, Search } from 'lucide-react';

type Document = { id: number; title: string; type: string; content: string; created_at: string };

export default function DocumentsPage() {
  const [docType, setDocType] = useState<'Quote' | 'Invoice' | 'Proposal' | 'Report' | 'Contract'>('Quote');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');

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
      loadDocuments();
      setGeneratedDoc('');
      setTitle('');
      setContent('');
      setActiveTab('library');
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

  async function loadDocuments() {
    try {
      const res = await fetch('/api/documents', { headers: getAuthHeaders() });
      const json = await res.json();
      setDocuments(json.documents ?? []);
    } catch {}
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />
      
      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Document Studio</h1>
              <p className="mt-1 text-slate-400">Generate and manage professional business documents.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('generate')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'generate' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                Generate
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'library' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                Library ({documents.length})
              </button>
            </div>
          </div>

          {activeTab === 'generate' ? (
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
          ) : (
            <div className="mt-8">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-10 pr-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-4">
                {filteredDocs.length === 0 ? (
                  <p className="text-slate-400">No documents found. Generate one above.</p>
                ) : (
                  filteredDocs.map((doc) => (
                    <div key={doc.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{doc.title}</p>
                          <p className="mt-1 text-sm text-slate-400">{doc.type} • {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => navigator.clipboard.writeText(doc.content)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button onClick={() => {
                            const blob = new Blob([doc.content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${doc.title.toLowerCase().replace(/\s+/g, '-')}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }} className="rounded-lg p-2 text-sky-400 hover:bg-slate-800">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <pre className="mt-4 max-h-32 overflow-y-auto rounded-lg bg-slate-950/50 p-4 text-xs text-slate-300">{doc.content.slice(0, 300)}...</pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}