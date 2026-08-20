# Neuralix RAG — Frontend

Next.js 14 (App Router) + Tailwind. Dark theme, electric blue accent — matches the Neuralix Labs brand.

## Setup

```bash
cd frontend
npm install

cp .env.local.example .env.local
# edit NEXT_PUBLIC_API_URL if your backend isn't on localhost:8000

npm run dev
```

Open http://localhost:3000 — it'll redirect to `/login`.

## Pages

- `/login`, `/register` — auth, JWT stored in localStorage
- `/dashboard` — main app: sidebar (upload documents, conversation history) + chat window with inline `[1] [2]` citation chips (hover to see source filename + chunk)

## Deploy free

- **Netlify** or **Vercel**: connect repo, framework auto-detected as Next.js
- Set env var `NEXT_PUBLIC_API_URL` to your deployed backend URL (e.g. Render URL)

## Note on dependencies

`next` is pinned to `14.2.35`, the latest patched release on the 14.x line (fixes the critical
DoS vulnerability in earlier 14.2.x). A few lower-severity advisories only have fixes in Next.js
16.x, which is a breaking major upgrade — fine to defer until you're moving this past the demo stage.
