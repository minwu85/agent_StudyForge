# StudyForge

Agentic AI Exam & Personalised Learning Platform — turns uploaded lecture material into
AI-generated quizzes, exam simulations, and a personalised tutor. See
[docs/roadmap.md](docs/roadmap.md) for the full long-term vision (agents, RAG, OCR, memory,
adaptive learning); this README covers what's actually built right now.

## Status: Phase 1 — Basic Quiz Platform (MVP)

A complete, working quiz application with no AI yet: React frontend, FastAPI backend,
PostgreSQL database. Users pick a topic/difficulty/question count, take a timed exam, submit,
and review their results — all server-scored, with a small seeded question bank standing in for
document-derived questions until Phase 3 (document/RAG pipeline) lands.

**Implemented:**
- Topic + difficulty + question-count + optional time-limit quiz setup
- Timed exam UI: question navigator, flagging, previous/next, manual and auto-submit
- Server-side scoring (the frontend never sees correct answers until after submit)
- Results page with score summary and a per-question answer review (correct answer + your
  answer + explanation)

**Not yet built** (see [docs/roadmap.md](docs/roadmap.md) for the phased plan): document
upload/OCR, RAG, the agent system (Study/Quiz/Tutor/Exam/Evaluation/Analytics agents), learning
memory, adaptive difficulty, and the coding sandbox.

## Tech stack (current)

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS v4, Axios |
| Backend  | Python, FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| Database | PostgreSQL 16 (via Docker Compose) |

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
pip install -r requirements.txt
cp .env.example .env
python -m app.database.seed
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
- [docs/roadmap.md](docs/roadmap.md) — the full agentic-AI vision and every future phase
