-- ============================================================================
-- Migration: 18_business_brain_phase2
-- Description: Phase 2 of the Estech Business Copilot — Knowledge Base
--              infrastructure for RAG with vector search.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- pgvector extension
-- Note: This extension requires Supabase Pro/Team or a self-hosted instance
-- with pgvector installed. The IF NOT EXISTS ensures the migration does not
-- fail if the extension is already present.
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Table: knowledge_sources
-- Purpose: Track original uploaded documents before chunking.
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    content_type TEXT,
    file_size BIGINT,
    storage_path TEXT,
    processing_status TEXT NOT NULL DEFAULT 'ready',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE knowledge_sources IS 'Tracks original uploaded documents for the Business Copilot knowledge base.';
COMMENT ON COLUMN knowledge_sources.user_id IS 'Owner of the uploaded document.';
COMMENT ON COLUMN knowledge_sources.original_filename IS 'Original filename provided by the user.';
COMMENT ON COLUMN knowledge_sources.content_type IS 'MIME type of the uploaded file.';
COMMENT ON COLUMN knowledge_sources.file_size IS 'File size in bytes.';
COMMENT ON COLUMN knowledge_sources.storage_path IS 'Storage path (e.g., Supabase Storage bucket path).';
COMMENT ON COLUMN knowledge_sources.processing_status IS 'Processing status: pending, processing, ready, failed.';
COMMENT ON COLUMN knowledge_sources.metadata IS 'Arbitrary metadata about the source document.';

-- ============================================================================
-- Table: knowledge_chunks
-- Purpose: Store chunked content with vector embeddings for similarity search.
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_id UUID NOT NULL REFERENCES knowledge (id) ON DELETE CASCADE,
    source_id UUID REFERENCES knowledge_sources (id) ON DELETE SET NULL,
    chunk_index INTEGER NOT NULL,
    chunk_count INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE knowledge_chunks IS 'Chunked content with vector embeddings for RAG retrieval.';
COMMENT ON COLUMN knowledge_chunks.knowledge_id IS 'Parent knowledge entry this chunk belongs to.';
COMMENT ON COLUMN knowledge_chunks.source_id IS 'Original source document, if derived from an upload.';
COMMENT ON COLUMN knowledge_chunks.chunk_index IS 'Zero-based index of this chunk within the parent document.';
COMMENT ON COLUMN knowledge_chunks.chunk_count IS 'Total number of chunks for the parent document.';
COMMENT ON COLUMN knowledge_chunks.content IS 'Text content of the chunk.';
COMMENT ON COLUMN knowledge_chunks.embedding IS 'Vector embedding of the chunk content. Dimension should match the embedding model (e.g., 1536 for text-embedding-3-small).';
COMMENT ON COLUMN knowledge_chunks.metadata IS 'Arbitrary metadata about the chunk.';

-- ============================================================================
-- Alter Table: knowledge
-- Purpose: Add metadata columns to the existing knowledge table for Phase 2.
-- ============================================================================
ALTER TABLE knowledge
    ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'upload', 'onboarding')),
    ADD COLUMN IF NOT EXISTS source_path TEXT,
    ADD COLUMN IF NOT EXISTS original_filename TEXT,
    ADD COLUMN IF NOT EXISTS content_type TEXT,
    ADD COLUMN IF NOT EXISTS file_size BIGINT,
    ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'ready',
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES knowledge (id) ON DELETE SET NULL;

COMMENT ON COLUMN knowledge.source_type IS 'How the knowledge entry was created: manual, upload, or onboarding.';
COMMENT ON COLUMN knowledge.source_path IS 'Storage or file system path for uploaded content.';
COMMENT ON COLUMN knowledge.original_filename IS 'Original filename if the knowledge was derived from an upload.';
COMMENT ON COLUMN knowledge.content_type IS 'MIME type of the original content.';
COMMENT ON COLUMN knowledge.file_size IS 'File size in bytes, if applicable.';
COMMENT ON COLUMN knowledge.processing_status IS 'Processing status: pending, processing, ready, failed.';
COMMENT ON COLUMN knowledge.version IS 'Version number for versioned knowledge entries.';
COMMENT ON COLUMN knowledge.parent_id IS 'Self-reference to the parent knowledge entry for versioning.';

-- ============================================================================
-- RPC: match_knowledge_chunks
-- Purpose: Perform cosine similarity search on chunk embeddings.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    p_workspace_id uuid
)
RETURNS TABLE (
    id uuid,
    knowledge_id uuid,
    source_id uuid,
    content text,
    chunk_index int,
    chunk_count int,
    relevance_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.knowledge_id,
        kc.source_id,
        kc.content,
        kc.chunk_index,
        kc.chunk_count,
        1 - (kc.embedding <=> query_embedding) AS relevance_score
    FROM public.knowledge_chunks kc
    JOIN public.knowledge k ON k.id = kc.knowledge_id
    WHERE k.workspace_id = p_workspace_id
      AND kc.embedding IS NOT NULL
      AND 1 - (kc.embedding <=> query_embedding) >= match_threshold
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ STABLE SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.match_knowledge_chunks(vector, float, int, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(vector, float, int, uuid) TO authenticated;

COMMENT ON FUNCTION public.match_knowledge_chunks IS 'Returns the most similar knowledge chunks for a given query embedding within a workspace.';

-- ============================================================================
-- RPC: match_knowledge_chunks_by_source
-- Purpose: Same as above but filters by source_id.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks_by_source(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    p_source_id uuid
)
RETURNS TABLE (
    id uuid,
    knowledge_id uuid,
    source_id uuid,
    content text,
    chunk_index int,
    chunk_count int,
    relevance_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.knowledge_id,
        kc.source_id,
        kc.content,
        kc.chunk_index,
        kc.chunk_count,
        1 - (kc.embedding <=> query_embedding) AS relevance_score
    FROM public.knowledge_chunks kc
    WHERE kc.source_id = p_source_id
      AND kc.embedding IS NOT NULL
      AND 1 - (kc.embedding <=> query_embedding) >= match_threshold
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ STABLE SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.match_knowledge_chunks_by_source(vector, float, int, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks_by_source(vector, float, int, uuid) TO authenticated;

COMMENT ON FUNCTION public.match_knowledge_chunks_by_source IS 'Returns the most similar knowledge chunks for a given source document.';

-- ============================================================================
-- Indexes
-- ============================================================================

-- knowledge_sources indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_user_id ON knowledge_sources (user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_processing_status ON knowledge_sources (processing_status);

-- knowledge_chunks indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_knowledge_id ON knowledge_chunks (knowledge_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source_id ON knowledge_chunks (source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_chunk_index ON knowledge_chunks (chunk_index);

-- Vector index for similarity search using cosine distance
-- Note: ivfflat requires the extension to be installed and works best with
-- larger datasets (typically > 1000 rows). For smaller datasets, a sequential
-- scan may be more efficient.
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
    ON knowledge_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

COMMENT ON INDEX idx_knowledge_chunks_embedding IS 'IVFFlat index for cosine similarity search on chunk embeddings.';
