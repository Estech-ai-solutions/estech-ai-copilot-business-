export type User = {
  id: number;
  email: string;
  name?: string;
  password_hash: string;
  created_at: string;
};

export type BusinessProfile = {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  business_type?: string;
  products?: string;
  services?: string;
  pricing_info?: string;
  created_at: string;
};

export type KnowledgeEntry = {
  id: number;
  business_profile_id: number;
  title: string;
  type: string;
  content: string;
  created_at: string;
};

export type Task = {
  id: number;
  business_profile_id: number;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Archived';
  priority: 'Low' | 'Medium' | 'High';
  due_date?: string | null;
  created_at: string;
};

export type Document = {
  id: number;
  business_profile_id: number;
  title: string;
  type: 'Quote' | 'Invoice' | 'Proposal' | 'Report' | 'Contract';
  content: string;
  created_at: string;
};

export type UsageLog = {
  id: number;
  business_profile_id: number;
  feature: string;
  tokens_used: number;
  created_at: string;
};

export type Subscription = {
  id: number;
  user_id: number;
  plan: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  current_period_end?: string;
};

export type Lead = {
  id: number;
  user_id: number;
  business_name: string;
  website?: string;
  location: string;
  industry: string;
  lead_score: number;
  reason: string;
  opportunity?: string;
  suggested_service?: string;
  status: 'New' | 'Contacted' | 'Awaiting Reply' | 'Interested' | 'Proposal Sent' | 'Won' | 'Lost';
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type LeadSearch = {
  id: number;
  user_id: number;
  target_industry: string;
  target_location: string;
  ideal_customer_description?: string;
  search_query: string;
  results_found: number;
  created_at: string;
};

export type OutreachMessage = {
  id: number;
  lead_id: number;
  user_id: number;
  type: 'Email' | 'LinkedIn' | 'WhatsApp' | 'Cold Outreach';
  subject?: string;
  content: string;
  status: 'Draft' | 'Sent' | 'Replied';
  created_at: string;
};