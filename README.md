# AI Customer Support Platform

A SaaS platform for building and deploying AI-powered customer support assistants trained on your own knowledge base.

## Features

- 🤖 **AI Chat** — GPT-4o-mini powered assistant with RAG (Retrieval-Augmented Generation)
- 📚 **Knowledge Base** — Upload PDF, DOCX, TXT, Markdown; auto-chunked and embedded via OpenAI
- 🎫 **Ticket Management** — Auto-create tickets, track status and priority
- ⚡ **Smart Escalation** — Keyword-based escalation rules with priority detection
- 📊 **Analytics** — Conversation metrics, resolution rates, priority breakdowns
- 🌐 **Embeddable Widget** — Drop-in `<script>` tag for any website
- 🏢 **Multi-tenant** — Each business has isolated data, bot config, and API keys

## Stack

| Layer    | Technology                                   |
|----------|----------------------------------------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS         |
| Backend  | Hono (Node.js), TypeScript                   |
| Database | PostgreSQL + pgvector                         |
| ORM      | Prisma                                       |
| AI       | OpenAI (GPT-4o-mini + text-embedding-3-small) |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL with pgvector extension
- OpenAI API key

### 1. Clone and install

```bash
# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure environment

**Backend** — copy `.env.example` to `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai_support"
JWT_SECRET="your-secret-key-here"
OPENAI_API_KEY="sk-..."
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

**Frontend** — copy `.env.example` to `.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 3. Set up database

```bash
cd backend
npx prisma db push
npm run db:seed   # creates demo business + user
```

### 4. Run

```bash
# Backend (terminal 1)
cd backend && npm run dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo credentials
- **Slug:** `demo-company`
- **Email:** `admin@demo.com`
- **Password:** `admin123`

## Widget Embed

After logging in, go to **Settings** to get your embed snippet:

```html
<script src="https://your-api.com/widget.js" data-api-key="sk_live_..." defer></script>
```

## Architecture

```
┌─────────────────┐     ┌──────────────────────────────────┐
│   Next.js       │────▶│   Hono API                       │
│   Admin Portal  │     │   /api/auth   /api/chat          │
└─────────────────┘     │   /api/knowledge  /api/tickets   │
                        └────────────┬─────────────────────┘
┌─────────────────┐                  │
│  widget.js      │──── X-API-Key ──▶│
│  (embeddable)   │                  │
└─────────────────┘     ┌────────────▼─────────────────────┐
                        │   PostgreSQL + pgvector           │
                        │   Prisma ORM                     │
                        └────────────┬─────────────────────┘
                                     │
                        ┌────────────▼─────────────────────┐
                        │   OpenAI                          │
                        │   GPT-4o-mini  (chat)            │
                        │   text-embedding-3-small (RAG)   │
                        └──────────────────────────────────┘
```

## Deployment

Docker Compose is included. See `docker-compose.yml`.

```bash
docker-compose up --build
```

## Admin Credentials (sample)

| Field    | Value           |
|----------|-----------------|
| Slug     | demo-company    |
| Email    | admin@demo.com  |
| Password | admin123        |
