-- Migration 01: Extensions and shared types
-- Execute this FIRST in Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Role enum for workspace members
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'employee', 'viewer');

-- Subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');

-- Subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'past_due');

-- User status enum
CREATE TYPE public.user_status AS ENUM ('pending', 'active', 'suspended', 'deleted');

-- Document type enum
CREATE TYPE public.document_type AS ENUM ('quote', 'proposal', 'contract', 'email', 'other');

-- Knowledge type enum
CREATE TYPE public.knowledge_type AS ENUM ('product', 'service', 'pricing', 'other');

-- Task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'done', 'cancelled');

-- Task priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

-- Lead status enum
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'interested', 'proposal_sent', 'converted', 'rejected');

-- Outreach channel enum
CREATE TYPE public.outreach_channel AS ENUM ('email', 'phone', 'linkedin', 'other');

-- Outreach status enum
CREATE TYPE public.outreach_status AS ENUM ('sent', 'opened', 'replied', 'failed');