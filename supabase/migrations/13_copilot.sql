-- Migration 13: AI Copilot
-- Conversations and messages for persistent chat

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_workspace_id ON public.conversations(workspace_id);
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Triggers
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
CREATE POLICY "Members can view conversations" ON public.conversations
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Members can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Members can update own conversations" ON public.conversations
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Members can delete own conversations" ON public.conversations
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Members can view messages" ON public.messages
  FOR SELECT USING (public.is_workspace_member(
    (SELECT workspace_id FROM public.conversations WHERE id = messages.conversation_id),
    auth.uid()
  ));

CREATE POLICY "Members can create messages" ON public.messages
  FOR INSERT WITH CHECK (public.is_workspace_member(
    (SELECT workspace_id FROM public.conversations WHERE id = messages.conversation_id),
    auth.uid()
  ));

-- Comments
COMMENT ON TABLE public.conversations IS 'AI Copilot conversation threads';
COMMENT ON TABLE public.messages IS 'Chat messages within conversations';
