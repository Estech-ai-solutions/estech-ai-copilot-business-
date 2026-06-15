'use client';

import { useState, type FormEvent } from 'react';
import SiteNav from '@/components/site-nav';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AssistantPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse('');

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ prompt })
    });

    const json = await res.json();
    setResponse(json.text || json.error || 'No response from AI.');
    setLoading(false);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(response);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav />
      <section className="section-container py-16">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
              🤖
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-400">AI Copilot</p>
              <h1 className="mt-1 text-3xl font-bold text-white">Ask your business AI assistant</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-slate-300">
            The AI knows your business and generates accurate, on-brand responses.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            {/* Input Panel */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-200">Your request</label>
              <textarea
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                rows={6}
                placeholder="e.g. How should I respond to pricing questions?"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate response'}
              </button>
            </form>

            {/* Output Panel */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">AI Response</h2>
                {response && (
                  <button
                    onClick={copyToClipboard}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-6 min-h-[200px] font-sans text-sm">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-slate-800" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-slate-800" />
                  </div>
                ) : response ? (
                  <pre className="whitespace-pre-wrap break-words leading-relaxed text-slate-200">{response}</pre>
                ) : (
                  <p className="text-slate-400">Your AI response will appear here.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}