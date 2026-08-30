-- Migration 16: Onboarding
-- Add onboarding tracking to profiles and settings

-- Add onboarding fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add business context fields to user_settings if not already present
-- These capture onboarding data in the settings table as the source of truth
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS business_description TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS what_you_sell TEXT,
  ADD COLUMN IF NOT EXISTS typical_customer TEXT,
  ADD COLUMN IF NOT EXISTS primary_goal TEXT,
  ADD COLUMN IF NOT EXISTS customer_contact_method TEXT,
  ADD COLUMN IF NOT EXISTS communication_tone TEXT,
  ADD COLUMN IF NOT EXISTS main_services TEXT,
  ADD COLUMN IF NOT EXISTS customer_facing_info TEXT;

-- Index for onboarding status queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);

-- Comments
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether the user has completed the onboarding flow';
COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN public.user_settings.business_description IS 'Description of the business provided during onboarding';
COMMENT ON COLUMN public.user_settings.industry IS 'Business industry';
COMMENT ON COLUMN public.user_settings.what_you_sell IS 'What the business sells or provides';
COMMENT ON COLUMN public.user_settings.typical_customer IS 'Typical customer type';
COMMENT ON COLUMN public.user_settings.primary_goal IS 'Primary business goal';
COMMENT ON COLUMN public.user_settings.customer_contact_method IS 'How customers usually contact the business';
COMMENT ON COLUMN public.user_settings.communication_tone IS 'Preferred communication tone';
COMMENT ON COLUMN public.user_settings.main_services IS 'Main services or products';
COMMENT ON COLUMN public.user_settings.customer_facing_info IS 'Important customer-facing information';
