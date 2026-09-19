# Backend

FastAPI + SQLAlchemy + PostgreSQL. This document describes what is actually implemented today
(Phase 1 MVP + Phase 2 question database + Phase 3 document pipeline + Phase 4 RAG — see
[roadmap.md](roadmap.md) for the full long-term plan, and [progress.md](progress.md) for the
phase-by-phase build log).

## Stack

- **FastAPI** — HTTP API and request validation
- **SQLAlchemy 2.0** (declarative, typed `Mapped[...]` models) — ORM
- **PostgreSQL 16 + pgvector** (via Docker, image `pgvector/pgvector:pg16`) — relational data and
  chunk embeddings in one database
- **psycopg 3** — Postgres driver
- **Pydantic v2** (`pydantic-settings`) — request/response schemas and config
- **pypdf** — PDF text extraction (pure Python, no system dependency)
- **sentence-transformers** (`all-MiniLM-L6-v2`, 384 dims) — local, free embedding model; no API
  key, runs on CPU

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
│   │       ├── documents.py     POST /api/documents/upload, GET/DELETE /api/documents(/{id}), POST /api/documents/search
│   │       ├── questions.py     GET /api/questions/topics
│   │       ├── quizzes.py       POST/GET /api/quizzes, POST /api/quizzes/{id}/submit
│   │       ├── results.py       GET /api/results/{id}, GET /api/results/{id}/review
│   │       └── study.py         POST /api/study/chat
│   ├── services/
│   │   ├── document_service.py  upload_document (save file + run pipeline), list/get/delete, search_chunks
│   │   ├── quiz_service.py      create_quiz, get_quiz, submit_quiz (scoring logic lives here)
│   │   ├── result_service.py    result_summary, review (read-only, post-submission)
│   │   └── study_service.py     ask: retrieve → build prompt → generate → assemble response
│   ├── rag/
│   │   ├── extractor.py         extract_pdf_pages: per-page text via pypdf, flags scanned pages
│   │   ├── chunking.py          chunk_pages: ~800-char word-boundary chunks with ~150-char overlap
│   │   ├── embeddings.py        embed_texts/embed_query via a lazily-loaded sentence-transformers model
│   │   ├── vector_store.py      save_chunks, search_chunks (pgvector cosine distance) — low-level
│   │   ├── retriever.py         retrieve: embeds a question, calls vector_store, returns
│   │   │                          RetrievedChunk objects — the shared retrieval entry point used by
│   │   │                          both document search and the study endpoint
│   │   ├── generation.py        generate_answer — deliberately stubbed (see Phase 4 section below)
│   │   └── pipeline.py          process_document: orchestrates extract → chunk → embed → store
│   ├── ocr/
│   │   └── processor.py         page_needs_ocr (heuristic); extract_text_from_image is a documented
│   │                             stub (raises NotImplementedError) — the Phase 3 OCR extension point
│   ├── prompts/
│   │   └── study_prompts.py     build_study_prompt: ROLE/TASK/CONTEXT/CONSTRAINTS/OUTPUT FORMAT
│   ├── repositories/
│   │   ├── course_repository.py     list_courses, get_by_id
│   │   ├── week_repository.py       list_weeks_with_counts
│   │   ├── document_repository.py   save, get_by_id, list_documents, delete
│   │   ├── question_repository.py   list_topics, random_questions (topic/difficulty/week_ids)
│   │   └── quiz_repository.py       save, get_by_id (with eager-loaded questions)
│   ├── models/
│   │   ├── course.py            Course, Week
│   │   ├── document.py          Document, DocumentStatus, DocumentChunk (with a pgvector column)
│   │   ├── question.py          Question, Difficulty, AnswerOption
│   │   └── quiz.py              Quiz, QuizQuestion, QuizStatus
│   ├── schemas/
│   │   ├── course.py            CoursePublic, WeekSummary
│   │   ├── document.py          DocumentPublic, ChunkSearchRequest, ChunkSearchResult
│   │   ├── question.py          QuestionPublic (no answer), QuestionWithAnswer, TopicSummary
│   │   ├── quiz.py               QuizCreateRequest, QuizPublic, QuizSubmitRequest
│   │   ├── result.py             ResultSummary, ReviewResponse
│   │   └── study.py              StudyChatRequest, StudyChatResponse, SourceExcerpt
│   └── database/
│       ├── connection.py        SQLAlchemy engine/session, Base, get_db dependency
│       └── seed.py              resets schema + storage, seeds 1 course, 5 weeks, 32 questions
├── storage/documents/           uploaded PDFs on local disk, gitignored (not committed)
└── requirements.txt
```

Folders described in the roadmap that don't exist yet (`agents/`, `tools/`, `memory/`,
`evaluation/`) are intentionally not scaffolded — they belong to later phases and would just be
empty placeholders today. `study_service.py` is doing what the roadmap calls the "Study Agent"
in miniature (retrieve → prompt → answer, no tool-calling or orchestration yet) — it lives in
`services/` rather than a new `agents/` package until there's a second agent and an orchestrator
to justify that structure (Phase 5+).

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
the seed script, which wipes all local data (including past quiz attempts) *and* clears
`storage/documents/` so uploaded files stay in sync with the now-empty `documents` table. This is
fine for a single-developer local project pre-launch; introducing Alembic is deferred until the
schema needs to change without losing real data (see [roadmap.md](roadmap.md)'s
`database/migrations/` entry).

## Document pipeline (Phase 3)

```text
POST /api/documents/upload (course_id, week_id?, file)
        ↓
document_service.upload_document
        ↓ saves the PDF to storage/documents/<uuid>.pdf, creates a Document row (status=pending)
rag.pipeline.process_document
        ↓ rag.extractor.extract_pdf_pages    — pypdf, per page
        │    a page with < 20 extracted chars is treated as scanned/image-only and SKIPPED
        │    (ocr.processor.page_needs_ocr); Document.pages_needing_ocr counts these
        ↓ rag.chunking.chunk_pages           — ~800 chars/chunk, ~150 char overlap, word-boundary
        ↓ rag.embeddings.embed_texts         — sentence-transformers, one 384-dim vector/chunk
        ↓ rag.vector_store.save_chunks       — one DocumentChunk row per chunk (content + embedding)
        ↓
Document.status = ready, page_count / chunk_count recorded
```

`document_service.upload_document` runs this whole pipeline **synchronously inside the request**
— fine for the lecture-slide-sized PDFs this was tested against, but a multi-hundred-page PDF
would block the request for a while. A background task queue (Celery, arq, or FastAPI
`BackgroundTasks` at minimum) is a natural follow-up once that's a real problem, not before.

**Search without an LLM.** `POST /api/documents/search` embeds the query text and returns the
nearest chunks by pgvector cosine distance (`DocumentChunk.embedding.cosine_distance(...)`) —
no LLM call, just retrieval. This is deliberately the same `rag.vector_store.search_chunks`
primitive that Phase 4's retriever will call; Phase 4 adds the "feed the top chunks + question to
an LLM for a grounded answer" step on top of it. Exposing raw search now proves the ingestion
pipeline actually produces *searchable* embeddings, without pulling LLM integration into Phase 3's
scope.

**OCR is a stub.** `ocr/processor.py` detects scanned pages (`page_needs_ocr`) and the pipeline
correctly skips and counts them rather than crashing or silently dropping them, but
`extract_text_from_image` deliberately raises `NotImplementedError` — no OCR engine is wired in
yet. This was a scoping decision, not an oversight: build the common case (text-based PDFs) first,
implement OCR once there's a real scanned document to validate against.

## RAG / Study endpoint (Phase 4)

```text
POST /api/study/chat ({question, course_id, top_k?})
        ↓
study_service.ask
        ↓ rag.retriever.retrieve(question, course_id)
        │    embeds the question (same model as ingestion) → rag.vector_store.search_chunks
        │    → list[RetrievedChunk] (document, page, content, similarity)
        ↓ prompts.study_prompts.build_study_prompt(question, chunks)
        │    ROLE / TASK / CONTEXT / CONSTRAINTS / OUTPUT FORMAT, with each chunk numbered [n]
        │    and labeled with its source document + page, so the model (eventually) can cite them
        ↓ rag.generation.generate_answer(chunks)
        ↓
StudyChatResponse { question, answer, model, sources[], prompt }
```

**Generation is deliberately stubbed, not implemented** — this was an explicit scoping choice,
not a shortcut: real LLM calls cost money and need an API key, and the point of Phase 4 was to
get retrieval and prompt construction right first. `rag/generation.py` exists as the one
isolated function standing in for a real call — `generate_answer` currently returns the closest
matching chunk verbatim (clearly labeled as such) instead of a model-generated response. The
response's `model` field always says so honestly (`"stub (no LLM connected yet)"`), and the
`prompt` field returns the *exact* prompt that a real call would send, so the whole pipeline is
inspectable end-to-end even without generation. When ready, swapping in Claude means editing only
`generate_answer`'s body: build a `client.messages.create(model="claude-haiku-4-5", ...)` call
using the `prompt` this function already receives indirectly via `study_service.ask`, and return
its text. Nothing upstream (retriever, prompt builder, route, schemas, frontend) needs to change.

**Why `retriever.py` exists separately from `vector_store.py`.** `vector_store.search_chunks` is
the low-level pgvector query; `retriever.retrieve` is the "give me relevant material for this
question" entry point other code should call — it's what `study_service` uses, and
`document_service.search_chunks` (the raw Phase 3 search endpoint) was refactored to use it too,
so there's exactly one place that turns a question into ranked chunks.

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
| POST   | `/api/documents/upload`       | Upload a PDF (multipart: course_id, week_id?, file); runs the ingestion pipeline synchronously and returns the processed Document |
| GET    | `/api/documents`              | List documents (optional `?course_id=`)                |
| GET    | `/api/documents/{id}`         | Get one document's status/counts                        |
| DELETE | `/api/documents/{id}`         | Delete a document, its chunks (cascade), and its file on disk |
| POST   | `/api/documents/search`       | Semantic search: `{query, course_id?, top_k?}` → nearest chunks by cosine similarity, no LLM |
| GET    | `/api/questions/topics`       | Topics with question counts + available difficulties |
| POST   | `/api/quizzes`                | Create a quiz (random question selection by topic/difficulty/week_ids filters) |
| GET    | `/api/quizzes/{id}`           | Fetch a quiz (answers hidden until completed)         |
| POST   | `/api/quizzes/{id}/submit`    | Submit answers, scores server-side, marks completed   |
| GET    | `/api/results/{id}`           | Score summary                                         |
| GET    | `/api/results/{id}/review`    | Per-question breakdown with correct answers + explanations |
| POST   | `/api/study/chat`             | `{question, course_id, top_k?}` → retrieved sources + the constructed prompt + a (stubbed) answer |

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

> **Note on install size:** `sentence-transformers` pulls in PyTorch (CPU build, ~100–200MB
> download). The first document upload or search after starting the backend also downloads the
> `all-MiniLM-L6-v2` model itself (~80MB) from Hugging Face and caches it — expect that first
> request to take noticeably longer than the rest.

> **Note on the Postgres image:** this project's `docker-compose.yml` uses
> `pgvector/pgvector:pg16`, not plain `postgres:16-alpine` — the stock image doesn't ship the
> `vector` extension that document embeddings need. If you already had the old image's volume
> around, `docker compose down -v && docker compose up -d` to recreate it (destructive to local
> data, same as any `seed.py` run).

## Running tests

No automated tests exist yet for the backend (Phase 1 MVP was verified manually via `curl` and
an end-to-end browser walkthrough). `tests/unit`, `tests/integration`, and `tests/evaluation`
are on the roadmap for a later phase, once there's non-trivial logic worth covering beyond CRUD.
