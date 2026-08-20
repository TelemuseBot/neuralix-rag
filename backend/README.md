# Neuralix RAG — Backend

FastAPI backend for the AI Document Q&A platform. 100% free stack:
FastAPI + FAISS (local) + Gemini API (free tier) + SQLite.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and paste your GEMINI_API_KEY (get free at https://aistudio.google.com/apikey)
# generate a JWT secret: python -c "import secrets; print(secrets.token_hex(32))"

uvicorn app.main:app --reload --port 8000
```

API docs auto-generated at: http://localhost:8000/docs

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token (form: username=email, password) |
| GET | `/auth/me` | Current user info |
| POST | `/documents/upload` | Upload PDF/DOCX/TXT, auto-chunks + embeds |
| GET | `/documents` | List your documents |
| DELETE | `/documents/{id}` | Remove a document (rebuilds index) |
| POST | `/chat` | Ask a question, get answer + citations |
| GET | `/conversations` | List conversation history |
| GET | `/conversations/{id}/messages` | Get messages in a conversation |
| DELETE | `/conversations/{id}` | Delete a conversation |

## How the RAG pipeline works

1. **Upload** → text extracted (pypdf / python-docx) → chunked (~900 words, 150 overlap)
2. **Embed** → each chunk embedded via Gemini `text-embedding-004`
3. **Index** → stored in a per-user FAISS `IndexFlatIP` (cosine similarity via normalized vectors)
4. **Query** → question embedded, top-k chunks retrieved
5. **Generate** → Gemini `gemini-2.0-flash` answers using only retrieved chunks, with `[1] [2]` citation markers mapped back to source filename + chunk

## Deploy free

- **Render.com**: New Web Service → connect repo → build `pip install -r requirements.txt` → start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add env vars (`GEMINI_API_KEY`, `JWT_SECRET_KEY`) in Render dashboard
- Note: Render free tier's filesystem is ephemeral — FAISS index + SQLite reset on redeploy/sleep. Fine for a demo; for persistence later, swap SQLite → Render Postgres and FAISS → Qdrant Cloud (both have free tiers).
