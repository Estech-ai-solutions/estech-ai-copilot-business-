-- Migration 12: Extend document types and add status
-- Expand document_type enum and add status field to documents

-- Drop old enum and create new one with more types
DROP TYPE IF EXISTS public.document_type CASCADE;

CREATE TYPE public.document_type AS ENUM (
  'quote',
  'proposal',
  'invoice',
  'contract',
  'business_letter',
  'email',
  'report',
  'meeting_notes',
  'other'
);

-- Add status column to documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

-- Update existing documents to have valid status
UPDATE public.documents SET status = 'draft' WHERE status IS NULL;

-- Add index for filtering by type and status
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- Comments
COMMENT ON TYPE public.document_type IS 'Supported document types for the Document Studio';
COMMENT ON COLUMN public.documents.status IS 'Document status: draft, completed';