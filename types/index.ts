export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Workspace = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMember = {
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
};

export type Knowledge = {
  id: string;
  workspace_id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  source_type?: 'manual' | 'upload' | 'onboarding';
  source_path?: string | null;
  original_filename?: string | null;
  content_type?: string | null;
  file_size?: number | null;
  processing_status?: 'pending' | 'processing' | 'ready' | 'failed';
  version?: number;
  parent_id?: string | null;
};

export type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  workspace_id: string;
  title: string;
  type: 'quote' | 'proposal' | 'invoice' | 'contract' | 'business_letter' | 'email' | 'report' | 'meeting_notes' | 'other';
  content: string;
  status: 'draft' | 'completed';
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
};

export type Lead = {
  id: string;
  workspace_id: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  description: string | null;
  source_url: string | null;
  status: 'new' | 'contacted' | 'interested' | 'proposal_sent' | 'converted' | 'rejected';
  lead_score: number;
  reason: string | null;
  opportunity: string | null;
  suggested_service: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadSearch = {
  id: string;
  workspace_id: string;
  query: string;
  results_count: number;
  created_at: string;
};

export type Outreach = {
  id: string;
  lead_id: string;
  channel: 'email' | 'phone' | 'linkedin' | 'other';
  message: string | null;
  status: 'sent' | 'opened' | 'replied' | 'failed';
  created_at: string;
};

export type Analytics = {
  id: string;
  workspace_id: string;
  date: string;
  tasks_completed: number;
  leads_found: number;
  documents_generated: number;
  created_at: string;
};

export type UsageLog = {
  id: string;
  workspace_id: string;
  feature: string;
  tokens_used: number;
  created_at: string;
};

export type Conversation = {
  id: string;
  workspace_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type KnowledgeSource = {
  id: string;
  user_id: string;
  original_filename: string;
  content_type?: string | null;
  file_size?: number | null;
  storage_path?: string | null;
  processing_status: 'pending' | 'processing' | 'ready' | 'failed';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type KnowledgeChunk = {
  id: string;
  knowledge_id: string;
  source_id?: string | null;
  chunk_index: number;
  chunk_count: number;
  content: string;
  embedding?: number[] | null;
  metadata?: Record<string, any>;
  created_at: string;
};

export type Content = {
  id: string;
  workspace_id: string;
  title: string;
  type: string;
  goal: string | null;
  audience: string | null;
  prompt: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
};
