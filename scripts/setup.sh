#!/bin/bash
set -e

echo "🤖 AI Support Platform - Setup Script"
echo "======================================"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 20+ required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "⚠️  Docker not found - you'll need to set up PostgreSQL manually"; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required (found $NODE_VERSION)"
  exit 1
fi

echo "✅ Node.js $(node -v)"

# Setup backend env
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo ""
  echo "📝 Created backend/.env from example"
  echo "   Please edit it with your API keys before continuing:"
  echo "   - ANTHROPIC_API_KEY"
  echo "   - OPENAI_API_KEY"
  echo "   - JWT_SECRET (any random string, 32+ chars)"
  echo ""
  read -p "Press Enter once you've updated backend/.env..."
fi

# Setup frontend env
if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.example frontend/.env.local
  echo "✅ Created frontend/.env.local"
fi

# Start database with Docker
if command -v docker >/dev/null 2>&1; then
  echo ""
  echo "🐘 Starting PostgreSQL with pgvector..."
  docker run -d \
    --name ai-support-postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=ai_support \
    -p 5432:5432 \
    pgvector/pgvector:pg16 \
    2>/dev/null || echo "   (PostgreSQL already running)"

  echo "   Waiting for PostgreSQL to be ready..."
  sleep 3
fi

# Install backend deps
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install --silent

echo "🗄️  Setting up database..."
npx prisma db push --accept-data-loss 2>/dev/null
npx tsx src/db/seed.ts

cd ..

# Install frontend deps
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

echo ""
echo "======================================"
echo "✅ Setup complete!"
echo ""
echo "Start the platform:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Or use docker-compose:"
echo "  docker-compose up"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:3001"
echo ""
echo "🔑 Demo login:"
echo "   Slug:     demo-company"
echo "   Email:    admin@demo.com"
echo "   Password: admin123"
