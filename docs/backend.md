# Backend

FastAPI + SQLAlchemy + PostgreSQL. This document describes what is actually implemented today
(Phase 1 MVP + Phase 2 question database — see [roadmap.md](roadmap.md) for the full long-term
plan).

## Stack

- **FastAPI** — HTTP API and request validation
- **SQLAlchemy 2.0** (declarative, typed `Mapped[...]` models) — ORM
- **PostgreSQL 16** (via Docker) — database
- **psycopg 3** — Postgres driver
- **Pydantic v2** (`pydantic-settings`) — request/response schemas and config

## Layering

Requests flow through four layers, each with one job:

```text
api/routes/*.py    → HTTP concerns only: parse request, call a service, return its result
services/*.py       → business logic: orchestrates repositories, raises HTTPException on
                      invalid states (e.g. submitting an already-completed quiz)
repositories/*.py   → the only files that write SQLAlchemy queries
models/*.py         → SQLAlchemy table definitions
schemas/*.py        → Pydantic request/response shapes (never the same class as a model)
```

Routes never touch the database directly, and repositories never contain business rules — that
keeps the routing layer thin and the business logic testable without spinning up FastAPI.

## Folder structure (implemented so far)

```text
backend/
├── app/
│   ├── main.py                  FastAPI app, CORS, router registration
│   ├── config.py                Settings (reads backend/.env)
│   ├── api/
│   │   ├── dependencies.py      re-exports get_db for routes
│   │   └── routes/
│   │       ├── courses.py       GET /api/courses, GET /api/courses/{id}/weeks
│   │       ├── questions.py     GET /api/questions/topics
│   │       ├── quizzes.py       POST/GET /api/quizzes, POST /api/quizzes/{id}/submit
│   │       └── results.py       GET /api/results/{id}, GET /api/results/{id}/review
│   ├── services/
│   │   ├── quiz_service.py      create_quiz, get_quiz, submit_quiz (scoring logic lives here)
│   │   └── result_service.py    result_summary, review (read-only, post-submission)
│   ├── repositories/
│   │   ├── course_repository.py     list_courses, get_by_id
│   │   ├── week_repository.py       list_weeks_with_counts
│   │   ├── question_repository.py   list_topics, random_questions (topic/difficulty/week_ids)
│   │   └── quiz_repository.py       save, get_by_id (with eager-loaded questions)
│   ├── models/
│   │   ├── course.py            Course, Week
│   │   ├── question.py          Question, Difficulty, AnswerOption
│   │   └── quiz.py              Quiz, QuizQuestion, QuizStatus
│   ├── schemas/
│   │   ├── course.py            CoursePublic, WeekSummary
│   │   ├── question.py          QuestionPublic (no answer), QuestionWithAnswer, TopicSummary
│   │   ├── quiz.py               QuizCreateRequest, QuizPublic, QuizSubmitRequest
│   │   └── result.py             ResultSummary, ReviewResponse
│   └── database/
│       ├── connection.py        SQLAlchemy engine/session, Base, get_db dependency
│       └── seed.py              resets schema + seeds 1 course, 5 weeks, 32 questions
└── requirements.txt
```

Folders described in the roadmap that don't exist yet (`agents/`, `rag/`, `ocr/`, `tools/`,
`memory/`, `evaluation/`, `prompts/`) are intentionally not scaffolded — they belong to later
phases and would just be empty placeholders today.

## Data model (Phase 1 + 2)

```text
courses          weeks                    questions                      quizzes                      quiz_questions
───────          ─────                    ─────────                      ───────                      ──────────────
id                id                       id                             id                            id
name              course_id → courses.id   course_id → courses.id         topic (filter used)           quiz_id  → quizzes.id
description       week_number              week_id → weeks.id             difficulty (filter used)       question_id → questions.id
                  title                    topic                          week_ids (JSON, filter used)    question_order
                                            question_text                  question_count                  selected_answer (nullable)
                                            option_a..option_d             time_limit_minutes                is_correct (nullable)
                                            correct_answer (A-D)           status (in_progress/completed)     flagged
                                            explanation                    score (nullable)
                                            difficulty (easy/med/hard)     started_at / completed_at
                                            created_at
```

A `Question` belongs to exactly one `Week` (and, denormalized for convenience, the `Course` that
week belongs to) as well as carrying a free-text `topic` tag — weeks are "when it was taught",
topic is "what it's about". A quiz can filter by any combination of `week_ids` (multi-select),
`topic`, and `difficulty`; whichever ones were used are recorded on the `Quiz` row itself so a
completed quiz still shows what filters produced it.

**No migrations yet.** There's no Alembic setup — `database/seed.py` calls
`Base.metadata.drop_all()` then `create_all()` on every run, so changing a model means rerunning
the seed script, which wipes all local data (including past quiz attempts). This is fine for a
single-developer local project pre-launch; introducing Alembic is deferred until the schema
needs to change without losing real data (see [roadmap.md](roadmap.md)'s
`database/migrations/` entry).

## Why answers are never sent to the client mid-quiz

`QuestionPublic` (used while a quiz is `in_progress`) omits `correct_answer` and `explanation`.
Only `QuestionWithAnswer` (used by `/api/results/{id}/review`, after submission) includes them.
The correctness check itself also happens server-side in `quiz_service.submit_quiz` — the
frontend never computes or trusts a score itself.

## API

| Method | Path                          | Purpose                                              |
| ------ | ----------------------------- | ----------------------------------------------------- |
| GET    | `/api/health`                 | Liveness check                                        |
| GET    | `/api/courses`                | List courses                                          |
| GET    | `/api/courses/{id}/weeks`     | Weeks for a course, with question counts + available difficulties |
| GET    | `/api/questions/topics`       | Topics with question counts + available difficulties |
| POST   | `/api/quizzes`                | Create a quiz (random question selection by topic/difficulty/week_ids filters) |
| GET    | `/api/quizzes/{id}`           | Fetch a quiz (answers hidden until completed)         |
| POST   | `/api/quizzes/{id}/submit`    | Submit answers, scores server-side, marks completed   |
| GET    | `/api/results/{id}`           | Score summary                                         |
| GET    | `/api/results/{id}/review`    | Per-question breakdown with correct answers + explanations |

Interactive docs: `http://localhost:8000/docs` (FastAPI's auto-generated Swagger UI) while the
server is running.

## Local setup

Prerequisite: PostgreSQL running (see the root [README](../README.md) or
[docker-desktop-setup.md](docker-desktop-setup.md) to start it via Docker Compose).

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # defaults already match docker-compose.yml

python -m app.database.seed # resets the schema + inserts a sample course/weeks/questions
uvicorn app.main:app --reload --port 8000
```

> **Note on Python version:** this project targets Python 3.11–3.13. Python 3.14 is too new for
> some dependencies (`pydantic-core`) to have prebuilt wheels yet, which forces a from-source
> build that can fail without a Rust toolchain. If `pip install` tries to compile Rust/C
> extensions, switch to a 3.11–3.13 interpreter and recreate the venv.

## Running tests

No automated tests exist yet for the backend (Phase 1 MVP was verified manually via `curl` and
an end-to-end browser walkthrough). `tests/unit`, `tests/integration`, and `tests/evaluation`
are on the roadmap for a later phase, once there's non-trivial logic worth covering beyond CRUD.
