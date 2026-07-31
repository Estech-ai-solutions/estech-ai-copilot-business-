-- Migration 08: Triggers and Functions
-- Auto-update timestamps and user signup automation

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON public.knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outreach_updated_at BEFORE UPDATE ON public.outreach
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON public.analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  personal_workspace_id UUID;
  user_full_name TEXT;
BEGIN
  -- Extract full name from metadata
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, user_full_name);

  -- Create personal workspace
  INSERT INTO public.workspaces (id, name, description, created_by)
  VALUES (
    uuid_generate_v4(),
    COALESCE(user_full_name, 'My') || '''s Workspace',
    'Personal workspace',
    NEW.id
  );

  -- Add user as owner of personal workspace
  personal_workspace_id := (SELECT id FROM public.workspaces WHERE created_by = NEW.id ORDER BY created_at DESC LIMIT 1);
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (personal_workspace_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Function to update last_login on profile
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.sessions for last_login tracking
CREATE TRIGGER on_auth_session_created
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_login();

-- Indexes for performance
CREATE INDEX idx_profiles_id ON public.profiles(id);
CREATE INDEX idx_workspaces_created_by ON public.workspaces(created_by);
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX idx_knowledge_workspace_id ON public.knowledge(workspace_id);
CREATE INDEX idx_tasks_workspace_id ON public.tasks(workspace_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_documents_workspace_id ON public.documents(workspace_id);
CREATE INDEX idx_leads_workspace_id ON public.leads(workspace_id);
CREATE INDEX idx_leads_score ON public.leads(lead_score DESC);
CREATE INDEX idx_lead_searches_workspace_id ON public.lead_searches(workspace_id);
CREATE INDEX idx_outreach_lead_id ON public.outreach(lead_id);
CREATE INDEX idx_analytics_workspace_id ON public.analytics(workspace_id);
CREATE INDEX idx_analytics_date ON public.analytics(date);
CREATE INDEX idx_usage_logs_workspace_id ON public.usage_logs(workspace_id);
CREATE INDEX idx_usage_logs_feature ON public.usage_logs(feature);