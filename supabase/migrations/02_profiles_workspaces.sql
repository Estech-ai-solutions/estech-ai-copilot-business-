-- Migration 02: Profiles and Workspaces
-- Core user profile and workspace tables

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  subscription_plan public.subscription_plan DEFAULT 'free',
  subscription_status public.subscription_status DEFAULT 'active',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  timezone TEXT DEFAULT 'UTC',
  status public.user_status DEFAULT 'active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members with expanded RBAC
CREATE TABLE public.workspace_members (
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (workspace_id, user_id)
);

-- Comments
COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase Auth';
COMMENT ON TABLE public.workspaces IS 'Business workspaces';
COMMENT ON TABLE public.workspace_members IS 'Workspace membership with RBAC roles';