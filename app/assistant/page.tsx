'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import {
  Send, Copy, Bot, User, Plus, MessageCircle, RefreshCw, Search, Edit3, Trash2, X, Menu
} from 'lucide-react';
import { PageHeader, Button, TextArea, ResponseDisplay, Alert } from '@/components/ui';
import { useSupabaseContext } from '@/providers/supabase-provider';
import { Conversation, Message } from '@/types';

const STORAGE_KEY = 'copilot_sidebar_collapsed';
const LAST_CONVERSATION_KEY = 'copilot_last_conversation';

export default function AssistantPage() {
  const { user } = useSupabaseContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    try {
      const collapsed = localStorage.getItem(STORAGE_KEY);
      if (collapsed !== null) {
        setSidebarCollapsed(JSON.parse(collapsed));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!user || !isInitialMount.current) return;
    isInitialMount.current = false;
    
    const lastConvId = localStorage.getItem(LAST_CONVERSATION_KEY);
    if (lastConvId) {
      fetch('/api/copilot/conversations/' + lastConvId + '/messages')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.messages) {
            setActiveConversation({ id: lastConvId } as Conversation);
            setMessages(data.messages);
          }
        })
        .catch(() => {})
        .finally(() => {
          loadConversations();
        });
    } else {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (activeConversation) {
      localStorage.setItem(LAST_CONVERSATION_KEY, activeConversation.id);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function loadConversations() {
    if (!user) return;
    setLoadingConversations(true);
    try {
      const res = await fetch('/api/copilot/conversations');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setConversations(json.conversations || []);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadMessages(conversationId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/copilot/conversations/' + conversationId + '/messages');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessages(json.messages || []);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleNewConversation() {
    if (sending) return;
    setError(null);
    try {
      const res = await fetch('/api/copilot/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const newConv = json.conversation;
      setConversations(prev => [newConv, ...prev]);
      setActiveConversation(newConv);
      setMessages([]);
      setSidebarOpen(false);
    } catch (err: any) {
      showError(err.message);
    }
  }

  async function handleSelectConversation(conversation: Conversation) {
    if (sending) return;
    setActiveConversation(conversation);
    setSidebarOpen(false);
    await loadMessages(conversation.id);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || !activeConversation || sending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      conversation_id: activeConversation.id,
      role: 'user',
      content: trimmedInput,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          message: trimmedInput,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const assistantMsg = json.message;
      setMessages(prev => [...prev, assistantMsg]);
      
      setConversations(prev => prev.map(c => 
        c.id === activeConversation.id 
          ? { ...c, updated_at: new Date().toISOString() }
          : c
      ));
    } catch (err: any) {
      showError(err.message);
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setLoading(false);
      setSending(false);
    }
  }

  async function handleRename(conversationId: string) {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch('/api/copilot/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: conversationId, title: trimmedTitle }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setConversations(prev => prev.map(c => c.id === conversationId ? json.conversation : c));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(json.conversation);
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(conversationId: string) {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/copilot/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: conversationId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err: any) {
      showError(err.message);
    }
  }

  function showError(message: string) {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    return date.toLocaleDateString();
  }

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(c => c.title.toLowerCase().includes(query));
  }, [conversations, searchQuery]);

  const lastMessagePreview = useCallback((conv: Conversation) => {
    const msgs = messages.filter(m => m.conversation_id === conv.id);
    if (msgs.length === 0) return 'No messages yet';
    const last = msgs[msgs.length - 1];
    const preview = last.content.length > 35 ? last.content.slice(0, 35) + '...' : last.content;
    return last.role === 'user' ? 'You: ' + preview : preview;
  }, [messages]);

  return (
    <div className="flex h-screen min-h-screen flex-col bg-background">
      <MobileNav />
      <SidebarNav />

      <div className="flex flex-1 lg:pl-64 pt-14 lg:pt-0">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={
          'fixed inset-y-0 left-0 z-40 w-80 border-r border-border/40 bg-background/95 backdrop-blur-xl ' +
          'transform transition-transform duration-300 ease-in-out lg:static lg:z-0 lg:translate-x-0 lg:transition-none ' +
          (sidebarOpen ? 'translate-x-0' : '-translate-x-full') + ' ' +
          (sidebarCollapsed ? 'hidden lg:block lg:w-16' : 'lg:w-80')
        }>
          <div className="flex h-16 items-center justify-between px-4 border-b border-border/40">
            {!sidebarCollapsed && (
              <h2 className="text-sm font-semibold text-text-heading uppercase tracking-wider">Conversations</h2>
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden rounded-lg p-1.5 text-text-muted hover:text-text-heading transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3">
            <Button
              onClick={handleNewConversation}
              variant="primary"
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              {!sidebarCollapsed && <span className="ml-2">New Conversation</span>}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-xl border border-border/60 bg-background-secondary/60 pl-9 pr-4 py-2 text-xs text-text-heading placeholder:text-text-muted outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto px-3 pb-4 space-y-1" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
            {loadingConversations ? (
              <div className="space-y-2 px-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-border/40" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <MessageCircle className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs text-text-muted">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={handleNewConversation}
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                  >
                    <Plus className="h-4 w-4" />
                    Start one
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConversation?.id === conv.id;
                const preview = lastMessagePreview(conv);
                
                return (
                  <div
                    key={conv.id}
                    className={
                      'group relative rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200 ' +
                      (isActive ? 'bg-primary/15 text-primary' : 'text-text-muted hover:bg-surface/60 hover:text-text-heading')
                    }
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="flex items-start gap-2.5">
                      <MessageCircle className={'h-4 w-4 shrink-0 mt-0.5 ' + (isActive ? 'text-primary' : 'text-text-muted')} />
                      <div className="flex-1 min-w-0">
                        {editingId === conv.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleRename(conv.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(conv.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="w-full rounded-lg border border-primary/40 bg-background px-2 py-1 text-xs text-text-heading outline-none"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <p className="text-sm font-medium truncate leading-tight">{conv.title}</p>
                            <p className="text-[0.65rem] text-text-muted mt-0.5 truncate leading-tight">{preview}</p>
                            <p className="text-[0.6rem] text-text-muted/70 mt-0.5">{formatDate(conv.updated_at)}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {!editingId && (
                      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-0.5 bg-background/80 rounded-lg p-0.5 backdrop-blur-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(conv.id);
                            setEditTitle(conv.title);
                          }}
                          className="rounded-md p-1 text-text-muted hover:text-primary transition"
                          title="Rename"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(conv.id);
                          }}
                          className="rounded-md p-1 text-text-muted hover:text-danger transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex flex-1 flex-col min-w-0 h-[calc(100vh-3.5rem)] lg:h-screen">
          <div className="flex-shrink-0 border-b border-border/40 px-4 py-3 lg:px-6 lg:py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden rounded-lg p-1.5 text-text-muted hover:text-text-heading transition"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                <Bot className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base lg:text-lg font-semibold text-text-heading truncate">
                  {activeConversation ? activeConversation.title : 'AI Copilot'}
                </h1>
                <p className="text-[0.65rem] lg:text-xs text-text-muted hidden sm:block">
                  {activeConversation ? 'Continue the conversation' : 'Your intelligent business assistant'}
                </p>
              </div>
              {activeConversation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadConversations}
                  className="hidden sm:flex"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6 scroll-smooth">
            <div className="mx-auto max-w-3xl space-y-4 lg:space-y-5">
              {error && (
                <Alert variant="error" title="Error" description={error} className="mb-4" />
              )}

              {!activeConversation ? (
                <EmptyState onNewConversation={handleNewConversation} />
              ) : messages.length === 0 && !loading ? (
                <WelcomeState onPrompt={(prompt) => setInput(prompt)} />
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  
                  {loading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-border/40 px-4 py-3 lg:px-6 lg:py-4">
            <form onSubmit={handleSendMessage} className="mx-auto max-w-3xl">
              <div className="relative flex items-end gap-2">
                <TextArea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeConversation ? 'Continue the conversation...' : 'Ask Estech anything...'}
                  rows={1}
                  disabled={!activeConversation}
                  className="flex-1 pr-12 min-h-[44px] max-h-32"
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim() || !activeConversation}
                  className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  {sending ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              {!activeConversation && (
                <p className="text-[0.65rem] text-text-muted mt-2 text-center">
                  Select or create a conversation to start chatting
                </p>
              )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const isUser = message.role === 'user';
  
  return (
    <div className={'flex gap-2.5 lg:gap-3 ' + (isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-xl bg-primary/15 shrink-0 mt-1">
          <Bot className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
        </div>
      )}
      
      <div className={
        'max-w-[85%] lg:max-w-[80%] rounded-2xl px-3.5 py-2.5 lg:px-4 lg:py-3 text-sm leading-relaxed ' +
        'transition-all duration-200 break-words overflow-wrap-anywhere ' +
        (isUser ? 'bg-primary text-white rounded-br-md' : 'border border-border/40 bg-surface/80 text-text-heading rounded-bl-md')
      }>
        {!isUser && <ResponseDisplay content={message.content} compact />}
        {isUser && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        
        {!isUser && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
            <span className="text-[0.65rem] text-text-muted">
              {formatTime(message.created_at)}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(message.content)}
              className="inline-flex items-center gap-1 text-[0.65rem] text-primary hover:underline opacity-70 hover:opacity-100 transition-opacity"
            >
              <Copy className="h-3 w-3" />
              Copy
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-xl bg-surface/80 shrink-0 border border-border/40 mt-1">
          <User className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-text-muted" />
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 lg:gap-3 items-center">
      <div className="flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-xl bg-primary/15 shrink-0">
        <Bot className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
      </div>
      <div className="flex items-center gap-1.5 bg-surface/80 border border-border/40 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-0.3s' }} />
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-0.15s' }} />
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  );
}

function EmptyState({ onNewConversation }: { onNewConversation: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center lg:py-16">
      <div className="flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl bg-primary/15 mb-4 lg:mb-5">
        <Bot className="h-6 w-6 lg:h-7 lg:w-7 text-primary" />
      </div>
      <h2 className="text-base font-medium text-text-heading mb-2">AI Copilot</h2>
      <p className="text-sm text-text-muted max-w-md leading-6 px-4 lg:px-0">
        Your intelligent business assistant. Create a conversation to get started.
      </p>
      <div className="mt-6 grid gap-2.5 grid-cols-1 sm:grid-cols-2 w-full lg:w-auto">
        <QuickPrompt onClick={onNewConversation}>
          Start new conversation
        </QuickPrompt>
        <QuickPrompt onClick={() => {}}>
          Get business insights
        </QuickPrompt>
      </div>
    </div>
  );
}

function WelcomeState({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center lg:py-16">
      <div className="flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl bg-primary/15 mb-4 lg:mb-5">
        <Bot className="h-6 w-6 lg:h-7 lg:w-7 text-primary" />
      </div>
      <h2 className="text-base font-medium text-text-heading mb-2">Start the conversation</h2>
      <p className="text-sm text-text-muted max-w-md leading-6 px-4 lg:px-0">
        Ask about your leads, draft documents, analyze your knowledge base, or get recommendations.
      </p>
      <div className="mt-6 grid gap-2.5 grid-cols-1 sm:grid-cols-2 w-full lg:w-auto">
        <QuickPrompt onClick={() => onPrompt('Find leads in my workspace')}>
          Find leads
        </QuickPrompt>
        <QuickPrompt onClick={() => onPrompt('Draft a professional proposal')}>
          Draft a proposal
        </QuickPrompt>
        <QuickPrompt onClick={() => onPrompt('Summarize my knowledge base')}>
          Summarize knowledge
        </QuickPrompt>
        <QuickPrompt onClick={() => onPrompt('What should I focus on today?')}>
          Get priorities
        </QuickPrompt>
      </div>
    </div>
  );
}

function QuickPrompt({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border/40 bg-background-secondary/40 px-3.5 py-3 lg:px-4 lg:py-3 text-left text-sm text-text-heading transition hover:bg-surface/60 min-h-[44px] hover:border-primary/30"
    >
      {children}
    </button>
  );
}
