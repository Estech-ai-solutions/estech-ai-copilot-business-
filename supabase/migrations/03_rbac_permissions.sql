-- Migration 03: RBAC and Permissions
-- Role hierarchy: owner > admin > manager > employee > viewer

-- Permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(resource, action)
);

-- Role permissions mapping
CREATE TABLE public.role_permissions (
  role public.app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (role, permission_id)
);

-- Seed permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('manage_workspace', 'Full workspace management', 'workspace', 'manage'),
  ('manage_members', 'Add/remove workspace members', 'members', 'manage'),
  ('manage_billing', 'Manage subscription and billing', 'billing', 'manage'),
  ('view_analytics', 'View workspace analytics', 'analytics', 'view'),
  ('create_content', 'Create documents, tasks, knowledge', 'content', 'create'),
  ('edit_content', 'Edit own content', 'content', 'edit'),
  ('delete_content', 'Delete any content', 'content', 'delete'),
  ('view_content', 'View workspace content', 'content', 'view'),
  ('manage_leads', 'Create and manage leads', 'leads', 'manage'),
  ('view_leads', 'View leads', 'leads', 'view'),
  ('use_ai_assistant', 'Access AI assistant', 'ai', 'use'),
  ('export_data', 'Export workspace data', 'data', 'export')
ON CONFLICT (resource, action) DO NOTHING;

-- Seed role permissions
-- Owner: all permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'owner', id FROM public.permissions
ON CONFLICT DO NOTHING;

-- Admin: everything except billing
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions WHERE resource <> 'billing'
ON CONFLICT DO NOTHING;

-- Manager: content management, leads, analytics, AI
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager', id FROM public.permissions
WHERE resource IN ('content', 'leads', 'analytics', 'ai', 'data')
ON CONFLICT DO NOTHING;

-- Employee: create/edit content, view leads, use AI
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'employee', id FROM public.permissions
WHERE (resource = 'content' AND action IN ('create', 'edit', 'view'))
   OR (resource = 'leads' AND action = 'view')
   OR (resource = 'ai' AND action = 'use')
ON CONFLICT DO NOTHING;

-- Viewer: view-only access
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'viewer', id FROM public.permissions
WHERE (resource = 'content' AND action = 'view')
   OR (resource = 'leads' AND action = 'view')
   OR (resource = 'analytics' AND action = 'view')
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE public.permissions IS 'Available permissions in the system';
COMMENT ON TABLE public.role_permissions IS 'Maps roles to permissions';