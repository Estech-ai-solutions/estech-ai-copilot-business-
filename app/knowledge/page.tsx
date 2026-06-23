'use client';

import { useEffect, useState } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { Brain } from 'lucide-react';

type Entry = { id?: number; title: string; type?: string; content: string; created_at?: string };

const knowledgeTypes = ['Pricing', 'Services', 'FAQs', 'Policies', 'General'];

export default function KnowledgePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Pricing');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function load() {
    try {
      const res = await fetch('/api/knowledge', { headers: getAuthHeaders() });
      const json = await res.json();
      setEntries(json.entries ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title: title.trim(), type, content: content.trim() })
      });
      setTitle('');
      setContent('');
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />
      
      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-sky-400" />
              <h1 className="text-2xl font-bold text-white">Business Brain</h1>
            </div>
            <p className="mt-2 text-slate-400">
              Store pricing, services, FAQs, and policies for accurate AI responses.
            </p>
          </div>

          {/* Main Grid */}
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Add Entry */}
            <form onSubmit={handleSubmit} className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Add entry</h2>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                  >
                    {knowledgeTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Website Package Pricing"
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200">Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder="Enter the details..."
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
                >
                  {loading ? 'Saving...' : 'Save to knowledge base'}
                </button>
              </div>
            </form>

            {/* Entries List */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Knowledge entries</h2>
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {entries.length === 0 && <p className="text-slate-400">No entries yet. Add your business information above.</p>}
                {entries.map((entry, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{entry.title}</p>
                      <span className="text-xs text-sky-400">{entry.type}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300 line-clamp-2">{entry.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}