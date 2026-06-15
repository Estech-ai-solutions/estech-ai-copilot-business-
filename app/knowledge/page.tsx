'use client';

import { useEffect, useState } from 'react';
import SiteNav from '@/components/site-nav';

type Entry = { title: string; type?: string; content: string; created_at?: string };

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const knowledgeTypes = ['Pricing', 'Services', 'FAQs', 'Policies', 'General'];

export default function KnowledgePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Pricing');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/knowledge', { headers: getAuthHeaders() });
      const json = await res.json();
      setEntries(json.entries ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav />
      <section className="section-container py-16">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
              🧠
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Business Brain</p>
              <h1 className="mt-1 text-3xl font-bold text-white">Your business knowledge storage</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-slate-300">
            Add your pricing, services, FAQs, and policies. The AI uses this to generate accurate responses.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Add Entry */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Add knowledge entry</h2>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-sky-500"
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
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Enter the details..."
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save to knowledge base'}
              </button>
            </div>
          </form>

          {/* Entries List */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Knowledge entries</h2>
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {entries.length === 0 && <p className="text-slate-400">No entries yet. Add your business information above.</p>}
              {entries.map((entry, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
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
      </section>
    </main>
  );
}