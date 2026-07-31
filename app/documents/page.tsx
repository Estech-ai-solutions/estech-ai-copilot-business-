'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import {
  FileText, Copy, Download, Send, Plus, X, File, ArrowUpRight,
  Search, Filter, RefreshCw, Edit3, Trash2, CopyIcon, CheckCircle2
} from 'lucide-react';
import { PageHeader, EmptyState, Section, Badge, Button, Input, TextArea } from '@/components/ui';
import { useSupabaseContext } from '@/providers/supabase-provider';
import { cn } from '@/lib/utils';

type Document = {
  id: string;
  title: string;
  type: string;
  content: string;
  status: 'draft' | 'completed';
  created_at: string;
  updated_at: string;
};

type DocAction = 'shorter' | 'longer' | 'professional' | 'friendly' | 'rewrite' | 'summarize' | 'translate';

const documentTypes = [
  { value: 'quote', label: 'Quote' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'contract', label: 'Contract' },
  { value: 'business_letter', label: 'Business Letter' },
  { value: 'email', label: 'Email' },
  { value: 'report', label: 'Report' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'other', label: 'Other' },
] as const;

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
] as const;

const quickActions: { value: DocAction; label: string; prompt: string }[] = [
  { value: 'shorter', label: 'Make Shorter', prompt: 'Rewrite this document to be more concise and direct while keeping all essential information. Remove unnecessary words and tighten the language.' },
  { value: 'longer', label: 'Make Longer', prompt: 'Expand this document with more detail, examples, and explanation. Make it more comprehensive while maintaining professionalism.' },
  { value: 'professional', label: 'More Professional', prompt: 'Rewrite this document in a more formal, professional tone suitable for executive or client-facing use. Use sophisticated business language.' },
  { value: 'friendly', label: 'Friendlier', prompt: 'Rewrite this document in a warmer, more approachable tone while maintaining professionalism. Make it feel more personal and conversational.' },
  { value: 'rewrite', label: 'Rewrite', prompt: 'Rewrite this document completely with a fresh perspective while maintaining the same core message and purpose.' },
  { value: 'summarize', label: 'Summarize', prompt: 'Summarize this document into a concise executive summary highlighting only the most important points and key takeaways.' },
  { value: 'translate', label: 'Translate', prompt: 'Translate this document to English. Preserve the formal business tone and all key information.' },
];

export default function DocumentsPage() {
  const { user } = useSupabaseContext();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [docType, setDocType] = useState<typeof documentTypes[number]['value']>('quote');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'completed'>('draft');
  const [generating, setGenerating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [processingAction, setProcessingAction] = useState<DocAction | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`/api/documents?${params}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load documents');
      setDocuments(json.documents ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'library') {
      loadDocuments();
    }
  }, [activeTab, searchQuery, filterType, filterStatus]);

  async function handleGenerate() {
    if (!content.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: docType,
          userRequest: content.trim(),
          title: title.trim() || undefined,
        }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate document');
      setSuccess('Document generated successfully');
      setContent(json.document?.content || '');
      setTitle(json.document?.title || title);
      setDocType(json.document?.type || docType);
      setStatus('draft');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate document');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type: docType,
          content: content.trim(),
          status,
        }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save document');
      setSuccess('Document saved successfully');
      setTitle('');
      setContent('');
      setStatus('draft');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editingDoc || !title.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDoc.id,
          title: title.trim(),
          type: docType,
          content: content.trim(),
          status,
        }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update document');
      setSuccess('Document updated successfully');
      setEditingDoc(null);
      setTitle('');
      setContent('');
      setStatus('draft');
      setTimeout(() => setSuccess(null), 3000);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to update document');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete document');
      }
      setSuccess('Document deleted');
      setTimeout(() => setSuccess(null), 3000);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  }

  async function handleDuplicate(doc: Document) {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${doc.title} (Copy)`,
          type: doc.type,
          content: doc.content,
          status: 'draft',
        }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to duplicate document');
      setSuccess('Document duplicated');
      setTimeout(() => setSuccess(null), 3000);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate document');
    }
  }

  async function handleQuickAction(action: DocAction) {
    if (!selectedDoc || !content.trim()) return;
    setProcessingAction(action);
    setError(null);
    try {
      const actionConfig = quickActions.find((a) => a.value === action);
      if (!actionConfig) return;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${actionConfig.prompt}\n\nDocument:\n${content.trim()}`,
        }),
        credentials: 'include',
      });
      const json = await res.json();
      const newContent = json.text || json.error || 'Failed to process.';
      setContent(newContent);
      setSuccess(`${actionConfig.label} applied`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to apply action');
    } finally {
      setProcessingAction(null);
    }
  }

  function openEdit(doc: Document) {
    setEditingDoc(doc);
    setTitle(doc.title);
    setDocType(doc.type as typeof documentTypes[number]['value']);
    setContent(doc.content);
    setStatus(doc.status);
    setActiveTab('generate');
  }

  function closeEdit() {
    setEditingDoc(null);
    setTitle('');
    setContent('');
    setStatus('draft');
  }

  function downloadDocument(doc: Document) {
    const blob = new Blob([doc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  }

  const isEditing = !!editingDoc;

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          <PageHeader
            title="Document Studio"
            description="Generate and manage professional business documents"
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
                  Library ({documents.length})
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
                  <label className="block text-xs font-medium text-text-heading mb-2">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as typeof documentTypes[number]['value'])}
                    className="w-full rounded-xl border border-border/60 bg-background-secondary/60 px-3 py-2.5 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    {documentTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document title..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">
                    {isEditing ? 'Content' : 'Describe what you need...'}
                  </label>
                  <TextArea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={isEditing ? 'Document content...' : 'Describe what you need...'}
                    rows={isEditing ? 8 : 4}
                  />
                </div>

                {!isEditing && (
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !content.trim()}
                    variant="primary"
                    className="w-full lg:w-auto"
                  >
                    <Send className="h-4 w-4" />
                    {generating ? 'Generating...' : 'Generate Document'}
                  </Button>
                )}

                {(content || isEditing) && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                    <Button
                      variant="primary"
                      onClick={isEditing ? handleUpdate : handleSave}
                      disabled={saving || !title.trim() || !content.trim()}
                      className="w-full sm:w-auto"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {saving ? 'Saving...' : isEditing ? 'Update Document' : 'Save Document'}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="secondary"
                        onClick={closeEdit}
                        className="w-full sm:w-auto"
                      >
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
                      {isEditing ? 'Edit Document' : 'Generated Document'}
                    </label>
                    {content && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => copyToClipboard(content)}
                          className="rounded-lg p-1.5 text-text-muted hover:text-text-heading transition"
                          title="Copy"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${title || 'document'}.txt`;
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
                    {content ? (
                      <pre className="text-sm text-text-heading whitespace-pre-wrap leading-6">{content}</pre>
                    ) : (
                      <p className="text-sm text-text-muted italic">Generated document will appear here...</p>
                    )}
                  </div>
                </div>

                {content && !isEditing && (
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
            <Section title="Document Library">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex-1 min-w-0 sm:min-w-60">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search documents..."
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
                    {documentTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="w-full sm:w-auto">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-xl border border-border/30 bg-background-secondary/30 px-3 py-2 text-sm text-text-heading outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <Button variant="secondary" onClick={loadDocuments} className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {loading && documents.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-border/40" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="group flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3 text-sm transition hover:bg-surface/60"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setTitle(doc.title);
                          setDocType(doc.type as typeof documentTypes[number]['value']);
                          setContent(doc.content);
                          setStatus(doc.status);
                          setActiveTab('generate');
                        }}
                      >
                        <File className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-text-heading font-medium">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {doc.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant={doc.status === 'completed' ? 'success' : 'default'} className="text-xs capitalize">
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={() => openEdit(doc)}
                          className="rounded-lg p-1.5 text-text-muted hover:text-primary transition"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(doc)}
                          className="rounded-lg p-1.5 text-text-muted hover:text-primary transition"
                          title="Duplicate"
                        >
                          <CopyIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="rounded-lg p-1.5 text-text-muted hover:text-primary transition"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="rounded-lg p-1.5 text-text-muted hover:text-danger transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && !loading && (
                    <EmptyState
                      icon={FileText}
                      title="No documents yet"
                      description="Generate your first document to see it here"
                      action={
                        <Button variant="primary" onClick={() => setActiveTab('generate')} className="w-full sm:w-auto">
                          <Plus className="h-4 w-4" />
                          Create Document
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