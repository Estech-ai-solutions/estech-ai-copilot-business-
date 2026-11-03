-- Migration 21: RLS policies for tables without explicit policies
-- These tables were enabled for RLS in migration 20 but had no policies,
-- which would deny all access. Add workspace-scoped policies that preserve
-- existing functionality while enforcing tenant isolation.

-- Conversations: scoped to workspace membership
CREATE POLICY "Workspace members can view conversations" ON public.conversations
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by);

CREATE POLICY "Workspace members can update own conversations" ON public.conversations
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by);

CREATE POLICY "Owners and admins can delete conversations" ON public.conversations
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin'));

-- Messages: scoped via conversation workspace membership
CREATE POLICY "Workspace members can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND public.is_workspace_member(c.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Workspace members can create messages" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND public.is_workspace_member(c.workspace_id, auth.uid())
    )
  );

-- Content: scoped to workspace membership
CREATE POLICY "Workspace members can view content" ON public.content
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create content" ON public.content
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by);

CREATE POLICY "Workspace members can update own content" ON public.content
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by);

CREATE POLICY "Owners and admins can delete content" ON public.content
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin'));

-- User settings: owned by the user within their workspace
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);
