# Supabase Migrations

Execute these files in order in the Supabase SQL Editor.

## Migration Order

1. 01_extensions.sql - Extensions and ENUM types
2. 02_profiles_workspaces.sql - Core user/workspace tables
3. 03_rbac_permissions.sql - RBAC expansion and permissions
4. 04_knowledge_tasks_documents.sql - Business data
5. 05_leads_outreach.sql - Lead management
6. 06_analytics_usage.sql - Analytics and usage
7. 07_rls_policies.sql - RLS policies
8. 08_triggers_functions.sql - Triggers and functions
9. 09_storage_buckets.sql - Storage buckets

## Notes

- All tables use auth.users for authentication
- UUIDs generated with uuid_generate_v4()
- Timestamps use TIMESTAMPTZ
- RLS uses helper functions for role checks
- Storage buckets are private by default
