-- Migration 09: Storage Buckets
-- Storage for avatars and documents

-- Create avatars bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Avatars: users can upload/update their own avatar, view any avatar in workspace
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Workspace members can view avatars" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND public.is_workspace_member(
          (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() LIMIT 1),
          auth.uid()
        )
    )
  );

-- Documents: workspace members can upload/view/delete documents
CREATE POLICY "Members can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.user_id = auth.uid()
        AND public.is_workspace_member(
          (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() LIMIT 1),
          auth.uid()
        )
    )
  );

CREATE POLICY "Members can update documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.user_id = auth.uid()
        AND public.is_workspace_member(
          (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() LIMIT 1),
          auth.uid()
        )
    )
  );

CREATE POLICY "Members can delete documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.user_id = auth.uid()
        AND public.is_workspace_member(
          (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() LIMIT 1),
          auth.uid()
        )
    )
  );

CREATE POLICY "Members can view documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.user_id = auth.uid()
        AND public.is_workspace_member(
          (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() LIMIT 1),
          auth.uid()
        )
    )
  );

-- Comments
COMMENT ON TABLE storage.buckets IS 'Storage buckets for avatars and documents';