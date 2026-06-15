# Estech AI Business Copilot

AI-powered business operating system for small businesses, freelancers, and entrepreneurs.

## Features

- **AI Assistant** - Ask business questions, generate responses, create documents
- **Customer Response Studio** - Turn customer messages into professional replies
- **Document Generator** - Create quotes, invoices, proposals, reports, and contracts
- **Content Studio** - Generate social media posts, product descriptions, email campaigns
- **Knowledge Base** - Store your business data for smarter AI responses
- **Task Manager** - Track business tasks and priorities
- **Business Profile** - Configure your business context for AI
- **Usage Tracking** - Monitor AI usage and costs

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- JWT Authentication
- JSON file-based database (SQLite-ready for production)

## Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and configure:

```
MISTRAL_API_KEY=your-key
MISTRAL_API_URL=https://api.mistral.ai/v1/models/mistral-small/complete
JWT_SECRET=your-secret
```

## MVP Modules (Completed)

1. ✅ Authentication (login/register)
2. ✅ Dashboard
3. ✅ Business Profile
4. ✅ Knowledge Base
5. ✅ AI Assistant
6. ✅ Customer Response Studio
7. ✅ Document Generator
8. ✅ Content Studio
9. ✅ Task Manager
10. ✅ Usage Tracking

## Routes

- `/` - Landing page
- `/dashboard` - Business dashboard
- `/login` - Sign in
- `/register` - Create account
- `/assistant` - AI assistant
- `/responses` - Customer response studio
- `/documents` - Document generator
- `/content` - Content studio
- `/knowledge` - Knowledge base
- `/tasks` - Task manager
- `/profile` - Business profile editor

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