-- Migration 10: Add missing lead fields
-- Extend leads table with structured business information

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create unique index for deduplication by website within workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_workspace_website
  ON public.leads(workspace_id, website)
  WHERE website IS NOT NULL AND website != '';

-- Index for lead score queries
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(lead_score DESC);

-- Comments
COMMENT ON COLUMN public.leads.address IS 'Street address of the business';
COMMENT ON COLUMN public.leads.city IS 'City of the business';
COMMENT ON COLUMN public.leads.state IS 'State/region of the business';
COMMENT ON COLUMN public.leads.description IS 'Detailed description of the business';
COMMENT ON COLUMN public.leads.source_url IS 'Original source URL of the lead';