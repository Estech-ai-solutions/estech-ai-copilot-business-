'use client';

import { useState, type FormEvent } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { PenTool, Copy } from 'lucide-react';

type ContentType = 'social' | 'description' | 'email' | 'campaign';

export default function ContentPage() {
  const [contentType, setContentType] = useState<ContentType>('social');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function handleGenerate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setGeneratedContent('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          prompt: `Generate a ${contentType === 'social' ? 'social media post' : contentType === 'description' ? 'product description' : contentType === 'email' ? 'email campaign' : 'marketing campaign'} about: ${topic}\n\nPlatform: ${platform}\n\nMake it engaging and business-appropriate.`
        })
      });
      const json = await res.json();
      setGeneratedContent(json.text || json.error || 'No response generated.');
    } catch {
      setGeneratedContent('Failed to generate content.');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedContent);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />
      
      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <PenTool className="h-8 w-8 text-sky-400" />
              <h1 className="text-2xl font-bold text-white">Content Studio</h1>
            </div>
            <p className="mt-2 text-slate-400">
              Create social posts, product descriptions, email copy, and campaign ideas.
            </p>
          </div>

          {/* Main Grid */}
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Input Panel */}
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-200">Content type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                >
                  <option value="social">Social Media Post</option>
                  <option value="description">Product Description</option>
                  <option value="email">Email Campaign</option>
                  <option value="campaign">Marketing Campaign</option>
                </select>
              </div>

              {contentType === 'social' && (
                <div>
                  <label className="block text-sm font-medium text-slate-200">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-200">Topic / Subject</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What should the content be about?"
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
              >
                {loading ? 'Generating...' : 'Generate content'}
              </button>
            </form>

            {/* Output Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Generated content</h2>
                {generatedContent && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                )}
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 min-h-[200px] text-sm">
                {generatedContent ? (
                  <pre className="whitespace-pre-wrap break-words leading-relaxed text-slate-200">{generatedContent}</pre>
                ) : (
                  <p className="text-slate-400">Your generated content will appear here.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}