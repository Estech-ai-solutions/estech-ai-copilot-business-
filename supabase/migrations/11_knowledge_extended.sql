-- Migration 11: Extend knowledge table for Business Brain
-- Add category, tags, duplicate prevention, and search optimization

-- Add category and tags columns
ALTER TABLE public.knowledge
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Unique constraint to prevent duplicate entries within a workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_workspace_title_category
  ON public.knowledge(workspace_id, title, category);

-- Indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_workspace_id ON public.knowledge(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON public.knowledge(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_created_at ON public.knowledge(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON public.knowledge USING GIN(tags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_knowledge_search ON public.knowledge USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(content, ''))
);

-- Comments
COMMENT ON COLUMN public.knowledge.category IS 'Knowledge category: pricing, services, faqs, policies, products, general';
COMMENT ON COLUMN public.knowledge.tags IS 'Array of tags for filtering and search';