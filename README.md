# Neuralix RAG — AI Document Q&A Platform

Built by Neuralix Labs. Upload documents, ask questions, get cited answers.

100% free stack: FastAPI + FAISS (local vector search) + Gemini API (free tier) + SQLite + Next.js.

## Structure

```
neuralix-rag/
├── backend/     FastAPI + RAG pipeline (see backend/README.md)
└── frontend/    Next.js UI (see frontend/README.md)
```

## Quick start

**1. Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your free Gemini API key
uvicorn app.main:app --reload --port 8000
```

**2. Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000, register an account, upload a PDF, and start asking questions.

## Features implemented

- Multi-document upload (PDF, DOCX, TXT)
- Semantic search via Gemini embeddings + FAISS
- Full RAG pipeline (retrieve → generate) with `gemini-2.0-flash`
- Inline source citations `[1] [2]` mapped to filename + chunk
- Conversation history persisted per user (SQLite)
- Large-document handling via chunking with overlap
- JWT authentication, per-user document isolation

## Where to go next

- Swap SQLite → Postgres and local FAISS → Qdrant Cloud for persistence across redeploys (both have free tiers)
- Add streaming responses (SSE) for a more "live" chat feel
- Add per-document toggle so the user can scope a query to specific files
- Rate-limit uploads/chat if you deploy this publicly
