-- Migration 17: Communication History
-- Store generated communication responses

CREATE TABLE IF NOT EXISTS public.responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  customer_message TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'Professional',
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_responses_workspace_id ON public.responses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_responses_created_by ON public.responses(created_by);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON public.responses(created_at DESC);

CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can view responses" ON public.responses
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Members can create responses" ON public.responses
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Members can delete own responses" ON public.responses
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()) AND auth.uid() = created_by);

COMMENT ON TABLE public.responses IS 'Generated communication responses history';
