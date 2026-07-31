'use client';

import { useState, useEffect } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import {
  Megaphone, Copy, Download, Send, FileText, ArrowUpRight, X,
  Search, Filter, RefreshCw, Edit3, Trash2, CopyIcon, CheckCircle2,
  Type, Target, Users, MessageSquare, Sparkles
} from 'lucide-react';
import { PageHeader, EmptyState, Section, Badge, Button, Input, TextArea, Select } from '@/components/ui';
import { useSupabaseContext } from '@/providers/supabase-provider';
import { cn } from '@/lib/utils';
import { Content } from '@/types';

type ContentType = 'social_media_post' | 'facebook_ad' | 'instagram_caption' | 'linkedin_post' | 'email_campaign' | 'product_description' | 'blog_outline' | 'marketing_copy' | 'promotional_sms';

type QuickAction = 'rewrite' | 'shorter' | 'longer' | 'professional' | 'friendly' | 'translate';

const contentTypes = [
  { value: 'social_media_post', label: 'Social Media Post' },
  { value: 'facebook_ad', label: 'Facebook Ad' },
  { value: 'instagram_caption', label: 'Instagram Caption' },
  { value: 'linkedin_post', label: 'LinkedIn Post' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'product_description', label: 'Product Description' },
  { value: 'blog_outline', label: 'Blog Outline' },
  { value: 'marketing_copy', label: 'Marketing Copy' },
  { value: 'promotional_sms', label: 'Promotional SMS' },
] as const;

const quickActions: { value: QuickAction; label: string; prompt: string }[] = [
  { value: 'rewrite', label: 'Rewrite', prompt: 'Rewrite this content completely with a fresh perspective while maintaining the same core message and purpose.' },
  { value: 'shorter', label: 'Make Shorter', prompt: 'Rewrite this content to be more concise and direct while keeping all essential information. Remove unnecessary words and tighten the language.' },
  { value: 'longer', label: 'Make Longer', prompt: 'Expand this content with more detail, examples, and explanation. Make it more comprehensive while maintaining the original tone and style.' },
  { value: 'professional', label: 'More Professional', prompt: 'Rewrite this content in a more formal, professional tone suitable for business or corporate use. Use sophisticated language.' },
  { value: 'friendly', label: 'More Friendly', prompt: 'Rewrite this content in a warmer, more approachable tone while maintaining professionalism. Make it feel more personal and conversational.' },
  { value: 'translate', label: 'Translate', prompt: 'Translate this content to English. Preserve the formal business tone and all key information.' },
];

export default function ContentPage() {
  const { user } = useSupabaseContext();
  const [contentItems, setContentItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [processingAction, setProcessingAction] = useState<QuickAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [contentType, setContentType] = useState<ContentType>('social_media_post');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [audience, setAudience] = useState('');
  const [instructions, setInstructions] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');
  const [editingItem, setEditingItem] = useState<Content | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterType) params.set('type', filterType);

      const res = await fetch('/api/content?' + params.toString(), {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load content');
      setContentItems(json.content ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'library') {
      loadContent();
    }
  }, [activeTab, searchQuery, filterType]);

  async function handleGenerate() {
    if (!instructions.trim() && !goal.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: contentTypes.find(c => c.value === contentType)?.label || contentType,
          goal: goal.trim() || undefined,
          audience: audience.trim() || undefined,
          instructions: instructions.trim() || undefined,
        }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate content');
      setGeneratedContent(json.content || '');
      setTitle(contentTypes.find(c => c.value === contentType)?.label || contentType);
      setSuccess('Content generated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!title.trim() || !generatedContent.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type: contentType,
          goal: goal.trim() || null,
          audience: audience.trim() || null,
          prompt: instructions.trim() || null,
          content: generatedContent.trim(),
        }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save content');
      setSuccess('Content saved successfully');
      setGeneratedContent('');
      setTitle('');
      setGoal('');
      setAudience('');
      setInstructions('');
      setEditingItem(null);
      setTimeout(() => setSuccess(null), 3000);
      if (activeTab === 'library') loadContent();
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editingItem || !title.trim() || !generatedContent.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          title: title.trim(),
          type: contentType,
          goal: goal.trim() || null,
          audience: audience.trim() || null,
          prompt: instructions.trim() || null,
          content: generatedContent.trim(),
        }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update content');
      setSuccess('Content updated successfully');
      setEditingItem(null);
      setGeneratedContent('');
      setTitle('');
      setGoal('');
      setAudience('');
      setInstructions('');
      setTimeout(() => setSuccess(null), 3000);
      await loadContent();
    } catch (err: any) {
      setError(err.message || 'Failed to update content');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this content?')) return;
    try {
      const res = await fetch('/api/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete content');
      }
      setSuccess('Content deleted');
      setTimeout(() => setSuccess(null), 3000);
      await loadContent();
    } catch (err: any) {
      setError(err.message || 'Failed to delete content');
    }
  }

  async function handleDuplicate(item: Content) {
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title + ' (Copy)',
          type: item.type,
          goal: item.goal,
          audience: item.audience,
          prompt: item.prompt,
          content: item.content,
        }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to duplicate content');
      setSuccess('Content duplicated');
      setTimeout(() => setSuccess(null), 3000);
      await loadContent();
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate content');
    }
  }

  async function handleQuickAction(action: QuickAction) {
    if (!generatedContent.trim()) return;
    setProcessingAction(action);
    setError(null);
    try {
      const actionConfig = quickActions.find(a => a.value === action);
      if (!actionConfig) return;

      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: contentTypes.find(c => c.value === contentType)?.label || contentType,
          existingContent: generatedContent,
          action: actionConfig.prompt,
        }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to apply action');
      setGeneratedContent(json.content || '');
      setSuccess(actionConfig.label + ' applied');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to apply action');
    } finally {
      setProcessingAction(null);
    }
  }

  function openEdit(item: Content) {
    setEditingItem(item);
    setTitle(item.title);
    setContentType(item.type as ContentType);
    setGoal(item.goal || '');
    setAudience(item.audience || '');
    setInstructions(item.prompt || '');
    setGeneratedContent(item.content);
    setActiveTab('generate');
  }

  function closeEdit() {
    setEditingItem(null);
    setTitle('');
    setContentType('social_media_post');
    setGoal('');
    setAudience('');
    setInstructions('');
    setGeneratedContent('');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  }

  const isEditing = !!editingItem;

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          <PageHeader
            title="Content Studio"
            description="Create high-quality marketing content in seconds"
            action={
              <div className="flex items-center p-1 rounded-xl bg-background-secondary/40">
                <button
                  onClick={() => { closeEdit(); setActiveTab('generate'); }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition min-h-[36px]',
                    activeTab === 'generate'
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:text-text-heading'
                  )}
                >
                  Generate
                </button>
                <button
                  onClick={() => { closeEdit(); setActiveTab('library'); }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition min-h-[36px]',
                    activeTab === 'library'
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:text-text-heading'
                  )}
                >
                  Library ({contentItems.length})
                </button>
              </div>
            }
          />

          {error && (
            <div className="mb-6 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-success/20 bg-success/10 px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-sm text-success">{success}</p>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-4 lg:space-y-5">
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full rounded-xl border border-border/60 bg-background-secondary/60 px-3 py-2.5 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    {contentTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Business Goal</label>
                  <Input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Promote new product, Get more customers..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Target Audience</label>
                  <Input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Small businesses, Restaurant owners..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Extra Instructions</label>
                  <TextArea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Any specific requirements, tone, or details..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating || (!instructions.trim() && !goal.trim())}
                  variant="primary"
                  className="w-full lg:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  {generating ? 'Generating...' : 'Generate Content'}
                </Button>

                {(generatedContent || isEditing) && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                    <Button
                      variant="primary"
                      onClick={isEditing ? handleUpdate : handleSave}
                      disabled={saving || !title.trim() || !generatedContent.trim()}
                      className="w-full sm:w-auto"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {saving ? 'Saving...' : isEditing ? 'Update Content' : 'Save Content'}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="secondary"
                        onClick={closeEdit}
                        className="w-full sm:w-auto"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 lg:space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-text-heading">
                      {isEditing ? 'Edit Content' : 'Generated Content'}
                    </label>
                    {generatedContent && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => copyToClipboard(generatedContent)}
                          className="rounded-lg p-1.5 text-text-muted hover:text-text-heading transition"
                          title="Copy"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([generatedContent], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${title || 'content'}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="rounded-lg p-1.5 text-text-muted hover:text-text-heading transition"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background-secondary/40 p-4 min-h-[200px] max-h-[500px] overflow-y-auto">
                    {generatedContent ? (
                      <pre className="text-sm text-text-heading whitespace-pre-wrap leading-6">{generatedContent}</pre>
                    ) : (
                      <p className="text-sm text-text-muted italic">Generated content will appear here...</p>
                    )}
                  </div>
                </div>

                {generatedContent && !isEditing && (
                  <Section title="Quick Actions">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.value}
                          onClick={() => handleQuickAction(action.value)}
                          disabled={processingAction !== null}
                          className="rounded-xl border border-border/60 bg-background-secondary/40 px-3 py-2 text-xs font-medium text-text-heading transition hover:bg-surface/60 disabled:opacity-50"
                        >
                          {processingAction === action.value ? 'Applying...' : action.label}
                        </button>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <Section title="Content Library">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex-1 min-w-0 sm:min-w-60">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search content..."
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-auto">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-xl border border-border/30 bg-background-secondary/30 px-3 py-2 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All types</option>
                    {contentTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <Button variant="secondary" onClick={loadContent} className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {loading && contentItems.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-border/40" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {contentItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3 text-sm transition hover:bg-surface/60"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => openEdit(item)}
                      >
                        <Megaphone className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-text-heading font-medium">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {item.type.replace(/_/g, ' ')}
                            </Badge>
                            {item.goal && (
                              <span className="text-xs text-text-muted truncate">{item.goal}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-1.5 text-text-muted hover:text-primary transition"
                          title="Open"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(item)}
                          className="rounded-lg p-1.5 text-text-muted hover:text-primary transition"
                          title="Duplicate"
                        >
                          <CopyIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-text-muted hover:text-danger transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {contentItems.length === 0 && !loading && (
                    <EmptyState
                      icon={Megaphone}
                      title="No content yet"
                      description="Generate your first marketing content to see it here"
                      action={
                        <Button variant="primary" onClick={() => setActiveTab('generate')} className="w-full sm:w-auto">
                          <Sparkles className="h-4 w-4" />
                          Create Content
                        </Button>
                      }
                    />
                  )}
                </div>
              )}
            </Section>
          )}
        </div>
      </main>
    </div>
  );
}
