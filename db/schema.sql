-- Supabase/PostgreSQL schema for Estech AI Business Copilot MVP

CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT NOW()
);

CREATE TABLE business_profiles (
  id BIGINT PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  business_type TEXT,
  products TEXT,
  services TEXT,
  pricing_info TEXT,
  created_at TEXT DEFAULT NOW()
);

CREATE TABLE knowledge_base (
  id BIGINT PRIMARY KEY,
  business_profile_id BIGINT REFERENCES business_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT NOW()
);

CREATE TABLE tasks (
  id BIGINT PRIMARY KEY,
  business_profile_id BIGINT REFERENCES business_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  priority TEXT NOT NULL DEFAULT 'Medium',
  due_date TEXT,
  created_at TEXT DEFAULT NOW()
);

CREATE TABLE documents (
  id BIGINT PRIMARY KEY,
  business_profile_id BIGINT REFERENCES business_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT NOW()
);

CREATE TABLE usage_logs (
  id BIGINT PRIMARY KEY,
  business_profile_id BIGINT REFERENCES business_profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id BIGINT PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('Free', 'Starter', 'Pro', 'Enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TEXT DEFAULT NOW(),
  current_period_end TEXT
);