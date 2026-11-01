'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSupabaseContext } from '@/providers/supabase-provider';
import {
  Bot, X, Minus, Maximize2, Send, Loader2,
} from 'lucide-react';

type ChatMsg = { id: string; role: 'user' | 'assistant'; content: string };

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/verify-email', '/reset-password', '/about', '/contact', '/privacy', '/terms', '/offline', '/sitemap'];

export default function AskEstech() {
  const { user } = useSupabaseContext();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));

  useEffect(() => {
    if (!open || conversationId) return;
    let cancelled = false;
    fetch('/api/copilot/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Ask Estech' }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.conversation?.id) setConversationId(d.conversation.id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, conversationId]);

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
    if (!conversationId) {
      setError('Conversation not ready yet. Please try again.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text, pageContext: pathname }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to get response');
      setMessages((prev) => [
        ...prev,
        { id: json?.message?.id || crypto.randomUUID(), role: 'assistant', content: json?.message?.content || '' },
      ]);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  if (!user || isPublic) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary/90"
        aria-label="Ask Estech"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-primary/90"
        >
          <Bot className="h-4 w-4" /> Ask Estech
        </button>
      </div>
    );
  }

  const panelClass = expanded
    ? 'fixed inset-4 z-50 flex flex-col rounded-2xl border border-border bg-background shadow-2xl'
    : 'fixed bottom-4 right-4 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border bg-background shadow-2xl h-[520px] max-h-[calc(100vh-2rem)]';

  return (
    <div className={panelClass}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-text-heading">Ask Estech</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(true)} className="rounded-lg p-1.5 text-text-muted transition hover:text-text-heading" aria-label="Minimize">
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={() => setExpanded((e) => !e)} className="rounded-lg p-1.5 text-text-muted transition hover:text-text-heading" aria-label="Expand">
            <Maximize2 className="h-4 w-4" />
          </button>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-text-muted transition hover:text-text-heading" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="text-sm text-text-muted">
            <p className="mb-2">Ask anything about your business, leads, or documents.</p>
            <div className="flex flex-wrap gap-2">
              {['What are my open leads?', 'Draft a customer reply', 'Summarize my business knowledge'].map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="rounded-full border border-border px-3 py-1 text-xs transition hover:bg-surface/60"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-white'
                  : 'border border-border/40 bg-surface/80 text-text-heading'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && <div className="text-xs text-text-muted">Thinking…</div>}
        {error && <div className="text-xs text-danger">{error}</div>}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask Estech..."
            className="flex-1 rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text-heading focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
