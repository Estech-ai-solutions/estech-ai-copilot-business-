'use client';

import { useEffect, useState, useCallback } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import { Brain, Plus, Trash2, Edit3, X, Tag, BookOpen, FileText, Search, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader, EmptyState, Section, Badge, Button, Input, TextArea } from '@/components/ui';

const categories = [
  { value: 'pricing', label: 'Pricing', icon: Tag },
  { value: 'services', label: 'Services', icon: BookOpen },
  { value: 'faqs', label: 'FAQs', icon: FileText },
  { value: 'policies', label: 'Policies', icon: FileText },
  { value: 'products', label: 'Products', icon: Tag },
  { value: 'general', label: 'General', icon: Brain },
] as const;

type KnowledgeEntry = {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);

      const res = await fetch(`/api/knowledge?${params}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load entries');
      }
      setEntries(json.entries ?? []);
      setTotalPages(json.totalPages || 1);
      setTotal(json.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedCategory]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setSubmitting(true);
    try {
      const payload: any = {
        title: formTitle.trim(),
        category: formCategory,
        content: formContent.trim(),
      };

      if (formTags.trim()) {
        payload.tags = formTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      }

      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save entry');
      }

      resetForm();
      setShowAdd(false);
      await loadEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEntry) return;

    setSubmitting(true);
    try {
      const payload: any = {
        id: editingEntry.id,
        title: formTitle.trim(),
        category: formCategory,
        content: formContent.trim(),
      };

      if (formTags.trim()) {
        payload.tags = formTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      }

      const res = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update entry');
      }

      resetForm();
      setEditingEntry(null);
      await loadEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to update entry');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this knowledge entry?')) return;
    try {
      const res = await fetch('/api/knowledge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete entry');
      }

      await loadEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry');
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', formCategory);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

      if (formTags.trim()) {
        formData.append('tags', formTags);
      }

      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to upload file');
      }

      resetForm();
      setShowAdd(false);
      await loadEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function openEdit(entry: KnowledgeEntry) {
    setEditingEntry(entry);
    setFormTitle(entry.title);
    setFormCategory(entry.category);
    setFormContent(entry.content);
    setFormTags(entry.tags?.join(', ') || '');
  }

  function resetForm() {
    setFormTitle('');
    setFormCategory('general');
    setFormContent('');
    setFormTags('');
  }

  function handleSearch(e: React.FormEvent) {
    setPage(1);
    loadEntries();
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          <PageHeader
            title="Business Brain"
            description="Store business context for accurate AI responses"
            action={
              <Button variant="primary" onClick={() => { resetForm(); setShowAdd(true); }} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add entry
              </Button>
            }
          />

          {error && (
            <div className="mb-6 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <Section title="Search & Filter" className="mb-6">
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex-1 min-w-0 sm:min-w-60">
                <label className="block text-xs font-medium text-text-muted mb-1.5">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search knowledge..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-medium text-text-muted mb-1.5">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                  className="w-full rounded-xl border border-border/30 bg-background-secondary/30 px-3 py-2 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </Section>

          <Section title={`Knowledge Base (${total} entries)`}>
            {loading && entries.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-border/40" />
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="group rounded-xl border border-border/40 bg-background-secondary/40 p-4 transition-all duration-200 hover:bg-surface/60"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {categories.find((c) => c.value === entry.category)?.icon && (
                              (() => {
                                const Icon = categories.find((c) => c.value === entry.category)!.icon;
                                return <Icon className="h-4 w-4 text-primary" />;
                              })()
                            )}
                            <h3 className="font-medium text-text-heading truncate">{entry.title}</h3>
                          </div>
                          <p className="text-xs text-text-muted line-clamp-2 leading-5 mb-3">{entry.content}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs capitalize">
                              {entry.category}
                            </Badge>
                            {entry.tags?.map((tag) => (
                              <Badge key={tag} variant="default" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={() => openEdit(entry)}
                            className="rounded-lg p-1.5 text-text-muted hover:text-primary transition"
                            title="Edit entry"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="rounded-lg p-1.5 text-text-muted hover:text-danger transition"
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {entries.length === 0 && !loading && (
                    <EmptyState
                      icon={Brain}
                      title="No knowledge entries yet"
                      description="Add your business context to improve AI responses"
                      action={
                        <Button variant="primary" onClick={() => { resetForm(); setShowAdd(true); }} className="w-full sm:w-auto">
                          <Plus className="h-4 w-4" />
                          Add your first entry
                        </Button>
                      }
                    />
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
                    <p className="text-xs text-text-muted">
                      Page {page} of {totalPages} ({total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Section>
        </div>
      </main>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border/40 bg-surface/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-4 sm:px-6 sm:py-4">
              <h2 className="text-lg font-semibold text-text-heading">Add Knowledge Entry</h2>
              <button
                onClick={() => { setShowAdd(false); resetForm(); }}
                className="rounded-xl p-2 text-text-muted hover:text-text-heading hover:bg-surface/60 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 sm:p-6 sm:space-y-5">
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background-secondary/60 px-3 py-2.5 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                >
                  {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Title</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Entry title..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Content</label>
                <TextArea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Entry content..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Tags (comma-separated)</label>
                <Input
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. pricing, enterprise, q1-2024"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Upload File (PDF, DOCX, TXT, Markdown)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background-secondary/40 px-4 py-3 text-sm text-text-muted cursor-pointer hover:border-primary/40 hover:text-primary transition"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Processing...' : 'Click to upload file'}
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowAdd(false); resetForm(); }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || !formTitle.trim() || !formContent.trim()}
                  className="w-full sm:w-auto"
                >
                  {submitting ? 'Adding...' : 'Add Entry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border/40 bg-surface/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-4 sm:px-6 sm:py-4">
              <h2 className="text-lg font-semibold text-text-heading">Edit Knowledge Entry</h2>
              <button
                onClick={() => { setEditingEntry(null); resetForm(); }}
                className="rounded-xl p-2 text-text-muted hover:text-text-heading hover:bg-surface/60 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-4 space-y-4 sm:p-6 sm:space-y-5">
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background-secondary/60 px-3 py-2.5 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                >
                  {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Title</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Entry title..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Content</label>
                <TextArea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Entry content..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Tags (comma-separated)</label>
                <Input
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. pricing, enterprise, q1-2024"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setEditingEntry(null); resetForm(); }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || !formTitle.trim() || !formContent.trim()}
                  className="w-full sm:w-auto"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}