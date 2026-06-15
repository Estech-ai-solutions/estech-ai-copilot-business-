# Estech AI Business Copilot

AI-powered business platform for small businesses, freelancers, and entrepreneurs.

## Features

**Communication Studio** - Generate professional customer replies in seconds. Download and send instantly.

**Document Studio** - Create quotes, invoices, proposals, contracts, and reports. Every document is formatted for clients and ready to download.

**Business Brain** - Store your pricing, services, FAQs, and policies. The AI references this automatically for accurate responses.

**Task Manager** - Convert AI suggestions into actionable tasks with deadlines.

**Control Center** - Monitor usage, manage your knowledge, and generate content from one dashboard.

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- JWT Authentication
- JSON file-based database (SQLite-ready)

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```bash
MISTRAL_API_KEY=your-key
MISTRAL_API_URL=https://api.mistral.ai/v1/chat/completions
JWT_SECRET=your-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

## Routes

- `/` - Landing page
- `/dashboard` - Control Center
- `/login` - Sign in
- `/register` - Create account
- `/assistant` - AI Copilot
- `/responses` - Communication Studio
- `/documents` - Document Studio
- `/content` - Content Generator
- `/knowledge` - Business Brain
- `/tasks` - Task Manager
- `/profile` - Business Profile

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/profile` - Get business profile
- `PUT /api/profile` - Update business profile
- `GET /api/knowledge` - List knowledge entries
- `POST /api/knowledge` - Create knowledge entry
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document
- `POST /api/ai` - Generate AI response
- `GET /api/usage` - Get usage stats