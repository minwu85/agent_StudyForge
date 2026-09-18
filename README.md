# StudyForge

Agentic AI Exam & Personalised Learning Platform — turns uploaded lecture material into
AI-generated quizzes, exam simulations, and a personalised tutor. See
[docs/roadmap.md](docs/roadmap.md) for the full long-term vision (agents, RAG, OCR, memory,
adaptive learning); this README covers what's actually built right now.

## Status: Phase 3 — Document Pipeline

A working quiz application (still no LLM calls) plus a document ingestion pipeline: React
frontend, FastAPI backend, PostgreSQL + pgvector. Questions belong to a course and a week, and
users can now upload their own PDFs, which get extracted, chunked, embedded locally, and made
semantically searchable — the foundation Phase 4 (RAG) will build a grounded Q&A agent on top of.
See [docs/progress.md](docs/progress.md) for the full phase-by-phase build log.

**Implemented:**
- Course → Week → Question data model; quiz setup filtered by any combination of weeks
  (multi-select), topic, and difficulty
- Timed exam UI: question navigator, flagging, previous/next, manual and auto-submit;
  server-side scoring; results with a per-question answer review
- **PDF upload → text extraction → chunking → local embeddings → pgvector storage**, entirely
  local/free (no API keys); a `/documents` page to upload, track processing status, and run
  semantic search over your own material (raw chunk retrieval, no LLM synthesis yet — that's
  Phase 4)
- Scanned/image-only pages are detected and skipped (not silently dropped) — OCR itself is a
  documented stub, not implemented yet

**Not yet built** (see [docs/roadmap.md](docs/roadmap.md) for the phased plan): RAG-backed
grounded answers, the agent system (Study/Quiz/Tutor/Exam/Evaluation/Analytics agents), learning
memory, adaptive difficulty, OCR, and the coding sandbox.

## Tech stack (current)

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS v4, Axios |
| Backend  | Python, FastAPI, SQLAlchemy 2.0, Pydantic v2, pypdf, sentence-transformers |
| Database | PostgreSQL 16 + pgvector (via Docker Compose) |

## Project structure

```text
agent_StudyForge/
├── docker-compose.yml      PostgreSQL for local dev
├── backend/                FastAPI app — see docs/backend.md
├── frontend/                React app — see docs/frontend.md
└── docs/
    ├── backend.md           Backend architecture, data model, API reference, setup
    ├── frontend.md           Frontend architecture, page/data flow, setup
    ├── docker-desktop-setup.md   Installing & running Docker Desktop for this project
    ├── progress.md           Phase-by-phase build log (what's done, what's next)
    └── roadmap.md            Full original project vision and phased roadmap
```

## Quick start

**1. Start PostgreSQL** (see [docs/docker-desktop-setup.md](docs/docker-desktop-setup.md) if
Docker Desktop isn't installed/running yet):

```bash
docker compose up -d
```

**2. Start the backend** (see [docs/backend.md](docs/backend.md) for details):

```bash
cd backend
python -m venv venv && venv\Scripts\activate   # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt   # pulls PyTorch (CPU) for local embeddings — first install is a few hundred MB
cp .env.example .env
python -m app.database.seed   # resets the schema + seeds a course/weeks/questions
uvicorn app.main:app --reload --port 8000
```

**3. Start the frontend** (see [docs/frontend.md](docs/frontend.md) for details), in a second
terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The API is at `http://localhost:8000` (interactive docs at
`http://localhost:8000/docs`).

## Documentation

- [docs/backend.md](docs/backend.md) — layering, data model, API reference
- [docs/frontend.md](docs/frontend.md) — pages, data flow, folder structure
- [docs/docker-desktop-setup.md](docs/docker-desktop-setup.md) — Docker Desktop install/start/troubleshooting
- [docs/progress.md](docs/progress.md) — phase-by-phase build log
- [docs/roadmap.md](docs/roadmap.md) — the full agentic-AI vision and every future phase
