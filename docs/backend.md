# Backend

FastAPI + SQLAlchemy + PostgreSQL. This document describes what is actually implemented today
(Phase 1 MVP + Phase 2 question database + Phase 3 document pipeline + Phase 4 RAG + Phase 5 Quiz
Agent + Phase 6 Tutor Agent — see [roadmap.md](roadmap.md) for the full long-term plan, and
[progress.md](progress.md) for the phase-by-phase build log).

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
│   │       ├── progress.py      GET /api/progress
│   │       ├── questions.py     GET /api/questions/topics
│   │       ├── quizzes.py       POST/GET /api/quizzes, POST /api/quizzes/{id}/submit, POST /api/quizzes/generate-questions
│   │       ├── results.py       GET /api/results/{id}, GET /api/results/{id}/review
│   │       ├── study.py         POST /api/study/chat
│   │       └── tutor.py         POST /api/tutor/sessions, GET /api/tutor/sessions/{id}, POST .../answer, POST .../hint
│   ├── agents/
│   │   ├── quiz_agent.py        generate_questions: RAG chunks → cloze question candidates (stub, see
│   │   │                          Phase 5 section below) → evaluation_agent → accepted Question rows
│   │   ├── evaluation_agent.py  evaluate_generated_question: rule-based checks (no LLM needed)
│   │   └── tutor_agent.py       generate_turn (reuses quiz_agent's chunk selection + cloze stub),
│   │                              adapt_difficulty, build_hint — see Phase 6 section below
│   ├── services/
│   │   ├── document_service.py  upload_document (save file + run pipeline), list/get/delete, search_chunks
│   │   ├── progress_service.py  get_progress: aggregates completed quizzes into trend + per-topic accuracy
│   │   ├── quiz_service.py      create_quiz, get_quiz, submit_quiz, generate_questions (Quiz Agent entry point)
│   │   ├── result_service.py    result_summary, review (read-only, post-submission)
│   │   ├── study_service.py     ask: retrieve → build prompt → generate → assemble response
│   │   └── tutor_service.py     create_session, get_session, submit_answer, get_hint (Tutor Agent entry point)
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
│   │   ├── progress_repository.py   completed_quizzes, topic_correctness_rows
│   │   ├── question_repository.py   list_topics, random_questions (topic/difficulty/week_ids), save_all
│   │   ├── quiz_repository.py       save, get_by_id (with eager-loaded questions)
│   │   └── tutor_repository.py      save, get_by_id (with eager-loaded turns), save_turn
│   ├── models/
│   │   ├── course.py            Course, Week
│   │   ├── document.py          Document, DocumentStatus, DocumentChunk (with a pgvector column)
│   │   ├── question.py          Question (incl. nullable source_document_id), Difficulty, AnswerOption
│   │   ├── quiz.py              Quiz, QuizQuestion, QuizStatus
│   │   └── tutor.py             TutorSession, TutorSessionStatus, TutorTurn
│   ├── schemas/
│   │   ├── course.py            CoursePublic, WeekSummary
│   │   ├── document.py          DocumentPublic, ChunkSearchRequest, ChunkSearchResult
│   │   ├── question.py          QuestionPublic (no answer), QuestionWithAnswer, TopicSummary
│   │   ├── quiz.py               QuizCreateRequest, QuizPublic, QuizSubmitRequest,
│   │   │                          QuestionGenerationRequest, QuestionGenerationResponse
│   │   ├── progress.py           ProgressSummary, ScoreTrendPoint, TopicAccuracy
│   │   ├── result.py             ResultSummary, ReviewResponse
│   │   ├── study.py              StudyChatRequest, StudyChatResponse, SourceExcerpt
│   │   └── tutor.py              TutorSessionCreateRequest, TutorSessionPublic, TutorTurnPublic,
│   │                               TutorAnswerRequest, TutorAnswerResponse, TutorHintResponse
│   └── database/
│       ├── connection.py        SQLAlchemy engine/session, Base, get_db dependency
│       └── seed.py              resets schema + storage, seeds 1 course, 5 weeks, 32 questions
├── storage/documents/           uploaded PDFs on local disk, gitignored (not committed)
└── requirements.txt
```

Folders described in the roadmap that don't exist yet (`tools/`, `memory/`, `evaluation/`,
`orchestrator.py`) are intentionally not scaffolded — they belong to later phases and would just
be empty placeholders today. `agents/` now holds three agents (Quiz, Evaluation, Tutor), but
there's still no orchestrator: each agent is called directly by the service that needs it
(`quiz_service.generate_questions` calls `agents.quiz_agent` directly, `tutor_service` calls
`agents.tutor_agent` directly, `study_service.ask` does its own retrieve → prompt → generate
without going through `agents/`). An orchestrator earns its place once there's more than one entry
point deciding *which* agent to call for a given request (Phase 9, "Advanced Agent
Infrastructure") — right now the frontend already knows which agent it wants (Study vs Quiz vs
Tutor) by which page/button the student used, so there's no ambiguous request to route.

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
                                            source_document_id (nullable,
                                              → documents.id, set for
                                              Quiz Agent-generated questions)
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

## Quiz Agent (Phase 5)

```text
POST /api/quizzes/generate-questions ({course_id, week_ids?, topic?, difficulty, question_count})
        ↓
quiz_service.generate_questions
        ↓ agents.quiz_agent.generate_questions
        │    1. select READY DocumentChunk rows for the course (+ week_ids filter, if given)
        │    2. for each chunk: _build_cloze_question — the stubbed "generate question" step
        │       (see below) — produces (question_text, four options, correct_answer) or None
        │    3. every candidate → agents.evaluation_agent.evaluate_generated_question
        │       (rule-based: four non-empty distinct options, answer must be one of them,
        │        question must contain a blank, minimum length) → accept or reject
        │    4. stop once `question_count` are accepted, or chunks run out
        ↓ question_repository.save_all(accepted questions)
        ↓
QuestionGenerationResponse { requested, accepted[], rejected[] }
```

This is the roadmap's "Quiz Agent → RAG → Generate question → Evaluation Agent → Valid? → Store"
pipeline (section 5.2), fully wired end-to-end — retrieval, evaluation, and storage are all real.

**Question generation is a documented stub, for the same reason as Phase 4's `generate_answer`**:
no LLM is connected yet (no API key/cost). Rather than a placeholder that does nothing useful,
`_build_cloze_question` builds a real, working multiple-choice question directly from the
student's own material with a local heuristic:

1. Split a retrieved chunk into sentences; pick one long enough to be a meaningful question.
2. Pick the longest non-stopword word in that sentence as the "answer" and blank it out
   (`"... uses a *heap* to..." → "... uses a _____ to..."`).
3. Draw three distractors from the pool of similarly-extracted terms across *all* selected
   chunks (so distractors are plausible same-domain vocabulary, not random noise).

This produces genuinely gradeable cloze questions without calling a model, and it exercises the
real evaluation and storage steps — unlike Phase 4's stub, which just echoes a passage back.
Swapping in a real LLM later is scoped to `_build_cloze_question`'s body only: everything around
it (chunk selection, evaluation, storage, the API contract) stays the same.

**Evaluation is rule-based, not LLM-based** (roadmap section 19's "Rule-based evaluation" layer):
`evaluate_generated_question` checks structure only (four distinct non-empty options, a valid
correct answer, a non-trivial question). It says nothing about whether the question is
*pedagogically* good — that's the roadmap's "LLM evaluation" layer (question quality, ambiguity,
difficulty), left for when a real model is wired up.

**Generated questions are ordinary `Question` rows** — the only difference from hand-seeded ones
is a populated `source_document_id` (nullable FK to `documents`), so accepted questions
immediately show up in normal quiz creation (`POST /api/quizzes`) via the existing
topic/difficulty/week filters; there's no separate "AI question" code path anywhere else in the
app.

## Tutor Agent (Phase 6)

```text
POST /api/tutor/sessions ({course_id, week_ids?, topic?})
        ↓ tutor_service.create_session
        ↓ agents.tutor_agent.generate_turn(course_id, week_ids, exclude_chunk_ids=[])
        │    reuses quiz_agent's _select_chunks + _build_cloze_question + evaluation_agent —
        │    a "turn" is one chunk's full, unblanked content (the explanation) plus a cloze
        │    question built from a sentence inside it (the check question)
        ↓ TutorSession created (difficulty starts at MEDIUM) with its first TutorTurn
        ↓
TutorSessionPublic { ..., turns: [ { explanation, question_text, option_a..d, ... } ] }
        (no correct_answer in the response — hidden while a turn is unanswered, same principle as
         QuestionPublic during a quiz)

POST /api/tutor/sessions/{id}/answer ({selected_answer})
        ↓ tutor_service.submit_answer
        │    1. compare selected_answer to the current turn's stored correct_answer (rule-based,
        │       no LLM — same spirit as evaluation_agent, applied to a student's answer)
        │    2. update correct_streak / incorrect_streak / questions_asked / questions_correct
        │    3. agents.tutor_agent.adapt_difficulty(difficulty, correct_streak, incorrect_streak)
        │       — 2-in-a-row correct steps difficulty up, 2-in-a-row incorrect steps it down
        │       (roadmap section 9's adaptive-learning example), resetting both streaks on a change
        │    4. generate_turn again, excluding every chunk already used this session — appends a
        │       new TutorTurn, or ends the session (status=ended) once material runs out
        ↓
TutorAnswerResponse { is_correct, correct_answer, previous_difficulty, new_difficulty,
                      difficulty_changed, session: TutorSessionPublic }

POST /api/tutor/sessions/{id}/hint
        ↓ tutor_service.get_hint → agents.tutor_agent.build_hint(answer)
        ↓ masks all but the first/last letter (e.g. "heap" → "h__p"); marks the turn hint_used
```

This is the roadmap's Tutor Agent loop (section 5.3: explain → question → evaluate → identify
misunderstanding → hint → next question → adjust difficulty), and its adaptive-difficulty example
(section 9) — both wired end-to-end without an LLM. **No new generation stub was needed**: the
Tutor Agent doesn't call a model at all, even a stubbed one — it reuses Phase 5's cloze-question
stub as-is (importing `quiz_agent._build_cloze_question` etc. directly, since both agents live in
the same `agents/` package) and adds real, rule-based logic on top: streak tracking, difficulty
adaptation, and answer checking. The "teaching" content itself (the `explanation` field) is simply
the chunk's original, unmodified text — a real passage from the student's own material, not
model-generated — so there's nothing to stub there either.

**Why a `TutorTurn` table instead of reusing `Question`.** A turn needs fields a `Question` row
doesn't: `student_answer`/`is_correct` (per-attempt, not shareable across students the way a quiz
question bank is), `hint_used`, `turn_order`, and `difficulty_at_time` (so a session's history
shows the difficulty *as it was* for each question, even after later turns raise or lower it).
Turns aren't reused in quizzes and don't need topic/course-wide discoverability, so they don't
need to be `Question` rows — they belong to exactly one `TutorSession` and nothing else.

**Known limitation (accepted, documented):** the adaptive difficulty label doesn't actually change
*which* chunks or sentences get picked — `generate_turn` selects from the same chunk pool
regardless of the session's current difficulty (there's no notion of "this sentence is harder than
that one" without an LLM to judge it). The difficulty value is tracked and surfaced honestly, and
does correctly gate what gets written onto new `TutorTurn`/`Question` rows, but it's a label
riding along the adaptive-learning *mechanism* rather than something that changes question
selection yet — the same "real pipeline, stubbed intelligence" tradeoff as Phase 4 and 5.

## Progress aggregation

`GET /api/progress` aggregates every *completed* `Quiz`: `score_trend` is one point per quiz
ordered by `completed_at` (for a line chart), and `topic_accuracy` groups every answered
`QuizQuestion` by its `Question.topic` and computes a correct/total ratio. It intentionally has
no `course_id` filter — `Quiz` has no direct course foreign key (a quiz is built from a
`topic`/`week_ids`/`difficulty` filter, not tied to one course row), and since only one course
exists in the seed data anyway, adding that filter now would be speculative. If multi-course
support becomes real, this is the first place that will need a join through
`QuizQuestion → Question → course_id` to scope correctly.

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
| POST   | `/api/quizzes/generate-questions` | Quiz Agent: `{course_id, week_ids?, topic?, difficulty, question_count}` → generates cloze questions from uploaded documents, runs them through the rule-based evaluation agent, stores accepted ones |
| GET    | `/api/quizzes/{id}`           | Fetch a quiz (answers hidden until completed)         |
| POST   | `/api/quizzes/{id}/submit`    | Submit answers, scores server-side, marks completed   |
| GET    | `/api/results/{id}`           | Score summary                                         |
| GET    | `/api/results/{id}/review`    | Per-question breakdown with correct answers + explanations |
| POST   | `/api/study/chat`             | `{question, course_id, top_k?}` → retrieved sources + the constructed prompt + a (stubbed) answer |
| POST   | `/api/tutor/sessions`         | Tutor Agent: `{course_id, week_ids?, topic?}` → starts a session with its first explanation + question |
| GET    | `/api/tutor/sessions/{id}`    | Fetch a tutor session (all turns so far, with answers hidden on the current unanswered one) |
| POST   | `/api/tutor/sessions/{id}/answer` | `{selected_answer}` → correctness, updated difficulty, and the next turn (or session end) |
| POST   | `/api/tutor/sessions/{id}/hint`   | Reveals a masked hint for the current unanswered turn                          |
| GET    | `/api/progress`               | Completed-quiz count, average score, score-over-time trend, and accuracy by topic |

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
