-- Migration 19: Add RLS policies for knowledge_sources and knowledge_chunks

-- Enable RLS on knowledge_sources
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

-- Enable RLS on knowledge_chunks
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- KNOWLEDGE_SOURCES
-- ============================================================
CREATE POLICY "Users can view own knowledge sources"
  ON public.knowledge_sources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own knowledge sources"
  ON public.knowledge_sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge sources"
  ON public.knowledge_sources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge sources"
  ON public.knowledge_sources
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- KNOWLEDGE_CHUNKS
-- ============================================================
CREATE POLICY "Members can view knowledge chunks"
  ON public.knowledge_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.knowledge k
      WHERE k.id = knowledge_chunks.knowledge_id
        AND public.is_workspace_member(k.workspace_id, auth.uid())
    )
  );

CREATE POLICY "System can create knowledge chunks"
  ON public.knowledge_chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.knowledge k
      WHERE k.id = knowledge_chunks.knowledge_id
        AND public.is_workspace_member(k.workspace_id, auth.uid())
    )
  );

CREATE POLICY "System can update knowledge chunks"
  ON public.knowledge_chunks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.knowledge k
      WHERE k.id = knowledge_chunks.knowledge_id
        AND public.is_workspace_member(k.workspace_id, auth.uid())
    )
  );

CREATE POLICY "System can delete knowledge chunks"
  ON public.knowledge_chunks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.knowledge k
      WHERE k.id = knowledge_chunks.knowledge_id
        AND public.is_workspace_member(k.workspace_id, auth.uid())
    )
  );
