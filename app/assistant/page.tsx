'use client';

import { useState, type FormEvent } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { MessageSquare, Copy } from 'lucide-react';

export default function AssistantPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

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
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />
      
      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-sky-400" />
              <h1 className="text-2xl font-bold text-white">AI Copilot</h1>
            </div>
            <p className="mt-2 text-slate-400">
              The AI knows your business and generates accurate, on-brand responses.
            </p>
          </div>

          {/* Main Grid */}
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Input Panel */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-200">Your request</label>
                <textarea
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                  rows={6}
                  placeholder="e.g. How should I respond to pricing questions?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate response'}
              </button>
            </form>

            {/* Output Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">AI Response</h2>
                {response && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                )}
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 min-h-[200px] font-sans text-sm">
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
      </main>
    </div>
  );
}