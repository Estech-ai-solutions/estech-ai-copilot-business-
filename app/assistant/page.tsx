'use client';

import { useState, useEffect, type FormEvent } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { Send, Copy, Trash2, Bot, User } from 'lucide-react';

type Message = { id: number; role: 'user' | 'assistant'; content: string; timestamp: Date };

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now(), role: 'user', content: input, timestamp: new Date() };
    setMessages((m) => [...m, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ prompt: input })
      });
      const json = await res.json();
      const aiMessage: Message = { id: Date.now() + 1, role: 'assistant', content: json.text || json.error || 'No response from AI.', timestamp: new Date() };
      setMessages((m) => [...m, aiMessage]);
    } catch {
      const errorMsg: Message = { id: Date.now() + 1, role: 'assistant', content: 'Failed to get response. Please try again.', timestamp: new Date() };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
  }

  function copyMessage(content: string) {
    navigator.clipboard.writeText(content);
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <SidebarNav />
      
      <main className="flex flex-1 flex-col lg:pl-64">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-sm lg:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-sky-400" />
              <h1 className="text-lg font-semibold text-white">AI Copilot</h1>
            </div>
            {messages.length > 0 && (
              <button onClick={clearChat} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300">
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-12">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <Bot className="mx-auto h-12 w-12 text-slate-600" />
                  <p className="mt-3 text-slate-400">How can I help your business today?</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                      <Bot className="h-4 w-4 text-sky-400" />
                    </div>
                  )}
                  <div className={`group relative max-w-[80%] rounded-xl px-4 py-3 ${
                    msg.role === 'user' ? 'bg-sky-500 text-slate-950' : 'border border-slate-800 bg-slate-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyMessage(msg.content)}
                        className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-800"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800">
                      <User className="h-4 w-4 text-slate-300" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                  <Bot className="h-4 w-4 text-sky-400" />
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                  <div className="space-y-2">
                    <div className="h-4 w-48 animate-pulse rounded bg-slate-800" />
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-sm lg:px-12">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about contracts, pricing, customer replies..."
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-sm text-slate-100 outline-none focus:border-sky-500 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute bottom-2 right-2 rounded-lg p-2 text-sky-400 transition hover:bg-slate-800 disabled:text-slate-600"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}