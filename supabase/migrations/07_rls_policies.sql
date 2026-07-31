-- Migration 07: Row Level Security Policies
-- Complete RLS policies for all roles

-- Helper function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = $1
      AND workspace_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to check user role in workspace
CREATE OR REPLACE FUNCTION public.get_workspace_role(workspace_id UUID, user_id UUID)
RETURNS public.app_role AS $$
DECLARE
  member_role public.app_role;
BEGIN
  SELECT workspace_members.role INTO member_role
  FROM public.workspace_members
  WHERE workspace_members.workspace_id = $1
    AND workspace_members.user_id = $2
  LIMIT 1;
  
  RETURN COALESCE(member_role, 'viewer'::public.app_role);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(permission_name TEXT, workspace_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role public.app_role;
  has_perm BOOLEAN;
BEGIN
  SELECT get_workspace_role($2, $3) INTO user_role;
  
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE rp.role = user_role
      AND p.name = $1
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- WORKSPACES
-- ============================================================
CREATE POLICY "Members can view workspace" ON public.workspaces
  FOR SELECT USING (
    public.is_workspace_member(id, auth.uid())
  );

CREATE POLICY "Owners and admins can update workspace" ON public.workspaces
  FOR UPDATE USING (
    public.is_workspace_member(id, auth.uid())
    AND public.get_workspace_role(id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "Users can create workspace" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can delete workspace" ON public.workspaces
  FOR DELETE USING (
    public.is_workspace_member(id, auth.uid())
    AND public.get_workspace_role(id, auth.uid()) = 'owner'
  );

-- ============================================================
-- WORKSPACE_MEMBERS
-- ============================================================
CREATE POLICY "Members can view members" ON public.workspace_members
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Owners and admins can manage members" ON public.workspace_members
  FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "Users can insert themselves" ON public.workspace_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PERMISSIONS AND ROLE_PERMISSIONS
-- ============================================================
CREATE POLICY "Anyone can view permissions" ON public.permissions
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage permissions" ON public.permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.user_id = auth.uid()
        AND workspace_members.role = 'owner'
    )
  );

CREATE POLICY "Anyone can view role permissions" ON public.role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.user_id = auth.uid()
        AND workspace_members.role = 'owner'
    )
  );

-- ============================================================
-- KNOWLEDGE
-- ============================================================
CREATE POLICY "Members can view knowledge" ON public.knowledge
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Members can create knowledge" ON public.knowledge
  FOR INSERT WITH CHECK (
    public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "Owners, admins, managers can update knowledge" ON public.knowledge
  FOR UPDATE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Owners and admins can delete knowledge" ON public.knowledge
  FOR DELETE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

-- ============================================================
-- TASKS
-- ============================================================
CREATE POLICY "Members can view tasks" ON public.tasks
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Members can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "Owners, admins, managers can update tasks" ON public.tasks
  FOR UPDATE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin', 'manager', 'employee')
  );

CREATE POLICY "Owners and admins can delete tasks" ON public.tasks
  FOR DELETE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE POLICY "Members can view documents" ON public.documents
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Members can create documents" ON public.documents
  FOR INSERT WITH CHECK (
    public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "Owners, admins, managers can update documents" ON public.documents
  FOR UPDATE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Owners and admins can delete documents" ON public.documents
  FOR DELETE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

-- ============================================================
-- LEADS
-- ============================================================
CREATE POLICY "Members can view leads" ON public.leads
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Members can create leads" ON public.leads
  FOR INSERT WITH CHECK (
    public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "Owners, admins, managers can update leads" ON public.leads
  FOR UPDATE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin', 'manager', 'employee')
  );

CREATE POLICY "Owners and admins can delete leads" ON public.leads
  FOR DELETE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

-- ============================================================
-- LEAD_SEARCHES
-- ============================================================
CREATE POLICY "Members can view lead searches" ON public.lead_searches
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Members can create lead searches" ON public.lead_searches
  FOR INSERT WITH CHECK (
    public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by
  );

-- ============================================================
-- OUTREACH
-- ============================================================
CREATE POLICY "Members can view outreach" ON public.outreach
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Members can create outreach" ON public.outreach
  FOR INSERT WITH CHECK (
    public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "Owners, admins, managers can update outreach" ON public.outreach
  FOR UPDATE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Owners and admins can delete outreach" ON public.outreach
  FOR DELETE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

-- ============================================================
-- ANALYTICS
-- ============================================================
CREATE POLICY "Members can view analytics" ON public.analytics
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "System can create analytics" ON public.analytics
  FOR INSERT WITH CHECK (
    public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "Owners and admins can update analytics" ON public.analytics
  FOR UPDATE USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

-- ============================================================
-- USAGE_LOGS
-- ============================================================
CREATE POLICY "Members can view usage logs" ON public.usage_logs
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "System can create usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (
    public.is_workspace_member(workspace_id, auth.uid())
    AND auth.uid() = created_by
  );