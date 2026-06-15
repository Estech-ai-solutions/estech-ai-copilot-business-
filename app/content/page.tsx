'use client';

import { useState, type FormEvent } from 'react';
import SiteNav from '@/components/site-nav';

type ContentType = 'social' | 'description' | 'email' | 'campaign';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ContentPage() {
  const [contentType, setContentType] = useState<ContentType>('social');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);

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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav />
      <section className="section-container py-16">
        <div className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">AI Content Studio</p>
          <h1 className="mt-4 text-4xl font-bold text-white">Generate marketing and business content instantly.</h1>
          <p className="mt-4 text-slate-300 leading-8">
            Create social posts, product descriptions, email copy, and campaign ideas from one place.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleGenerate} className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200">Content type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
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
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
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
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Generating...' : 'Generate content'}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Generated content</h2>
              {generatedContent && (
                <button
                  onClick={copyToClipboard}
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:border-slate-500"
                >
                  Copy
                </button>
              )}
            </div>
            <div className="mt-4 min-h-[200px] rounded-2xl border border-slate-800/80 bg-slate-950 p-4 text-slate-200">
              {generatedContent ? (
                <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">{generatedContent}</pre>
              ) : (
                <p className="text-slate-400">Your generated content will appear here.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}