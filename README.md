# StudyForge

Agentic AI Exam & Personalised Learning Platform — turns uploaded lecture material into
AI-generated quizzes, exam simulations, and a personalised tutor. See
[docs/roadmap.md](docs/roadmap.md) for the full long-term vision (agents, RAG, OCR, memory,
adaptive learning); this README covers what's actually built right now.

## Status: Phase 5 — Quiz Agent (generation stubbed)

A working quiz app plus a full RAG pipeline and a first agent: React frontend, FastAPI backend,
PostgreSQL + pgvector. Questions belong to a course and a week; users can upload their own PDFs,
which get extracted, chunked, embedded locally, and made semantically searchable; a `/study` page
retrieves relevant material for a question and builds the exact grounded-answer prompt the
roadmap describes; and the new Quiz Agent turns those same uploaded documents into new practice
questions, running every candidate through a real rule-based evaluation step before storing it.
The actual LLM calls (for study answers and for question generation) are left as clearly-labeled
stubs by choice, not oversight (no API key/cost yet). See
[docs/progress.md](docs/progress.md) for the full phase-by-phase build log.

**Implemented:**
- Course → Week → Question data model; quiz setup filtered by any combination of weeks
  (multi-select), topic, and difficulty
- Timed exam UI: question navigator, flagging, previous/next, manual and auto-submit;
  server-side scoring; results with a per-question answer review
- **PDF upload → text extraction → chunking → local embeddings → pgvector storage**, entirely
  local/free (no API keys); a `/documents` page to upload, track processing status, and run raw
  semantic search
- **RAG retrieval + prompt construction**: a `/study` page asks a question, retrieves the most
  relevant chunks across your uploaded material, and builds a structured
  (ROLE/TASK/CONTEXT/CONSTRAINTS/OUTPUT FORMAT) grounded-answer prompt — viewable in full in the
  UI. The actual generation step is a documented stub (returns the best-matching passage instead
  of a model-generated answer) so the pipeline is real end-to-end without incurring API cost;
  swapping in Claude Haiku 4.5 is a one-function change
- **Quiz Agent**: generates multiple-choice questions from your uploaded documents
  (`POST /api/quizzes/generate-questions`, and a panel on the Quiz Setup page) — real RAG
  retrieval and a real rule-based Evaluation Agent (structure/duplicate/validity checks), with
  question generation itself a local cloze-question stub (no LLM yet) that still produces
  genuinely gradeable questions; accepted questions become ordinary `Question` rows, usable in any
  quiz immediately
- Scanned/image-only pages are detected and skipped (not silently dropped) — OCR itself is a
  documented stub, not implemented yet
- A **Progress** page (`/progress`, backed by `GET /api/progress`) charting quizzes completed,
  average score, score over time, and accuracy by topic
- A green/botanical design system (sidebar navigation, a custom `leaf` color palette, an original
  hand-drawn leaf decoration) applied across every page

**Not yet built** (see [docs/roadmap.md](docs/roadmap.md) for the phased plan): real LLM calls for
generation, the rest of the agent system (Tutor/Exam/Analytics agents, an orchestrator), learning
memory, adaptive difficulty, LLM-based evaluation, OCR, and the coding sandbox.

## Tech stack (current)

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS v4, lucide-react, Axios |
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
