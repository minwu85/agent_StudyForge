# Build Progress

A running log of what's actually been built, phase by phase, against the plan in
[roadmap.md](roadmap.md). Each entry says what was added, the key files, and how it was
verified. For current-state architecture docs (not a log), see [backend.md](backend.md) and
[frontend.md](frontend.md).

| Phase | Name | Status |
| --- | --- | --- |
| 1 | Basic Quiz Platform | ✅ Done |
| 2 | Question Database | ✅ Done |
| 3 | Document Pipeline | ✅ Done |
| 4 | RAG | ⬜ Not started |
| 5 | Quiz Agent | ⬜ Not started |
| 6 | Tutor Agent | ⬜ Not started |
| 7 | Personalised Memory | ⬜ Not started |
| 8 | Automatic Evaluation | ⬜ Not started |
| 9 | Advanced Agent Infrastructure | ⬜ Not started |
| 10 | Optional Coding Sandbox | ⬜ Not started |

---

## Phase 1 — Basic Quiz Platform ✅

A complete, working quiz app with no AI: React frontend, FastAPI backend, PostgreSQL, no agents
or document upload yet.

**Built:**
- FastAPI backend with a layered `routes → services → repositories → models` structure
- `Question` / `Quiz` / `QuizQuestion` tables, server-side scoring (frontend never sees correct
  answers until after submit)
- `POST /api/quizzes`, `GET /api/quizzes/{id}`, `POST /api/quizzes/{id}/submit`,
  `GET /api/results/{id}`, `GET /api/results/{id}/review`
- React pages: Home, QuizSetup, Quiz (timer, flagging, question nav, auto/manual submit),
  Results (score + inline answer review)
- PostgreSQL via Docker Compose; seed script with 32 hand-written sample questions across 5
  topics

**Verified:** full quiz flow (create → answer → flag → timed submit → score → review) tested via
`curl` and end-to-end in the browser pane.

**Docs written:** [backend.md](backend.md), [frontend.md](frontend.md),
[docker-desktop-setup.md](docker-desktop-setup.md), root [README.md](../README.md).

---

## Phase 2 — Question Database ✅

Added the `Course → Week → Question` structure the roadmap's Phase 2 calls for, plus
week-based filtering on top of the existing topic/difficulty filters.

**Built:**
- `Course` and `Week` models; `Question` gained `course_id` and `week_id` foreign keys (kept its
  existing free-text `topic` tag alongside them — week is "when", topic is "what")
- `GET /api/courses`, `GET /api/courses/{id}/weeks` (with per-week question counts and available
  difficulties)
- `question_repository.random_questions` gained a `week_ids` filter; `Quiz` now records which
  `week_ids` (plus topic/difficulty) were used to build it
- `QuizSetup` page: week checkbox grid (multi-select) above the topic/difficulty dropdowns, with
  a live "up to N available" count
- `seed.py` rewritten to create 1 course, 5 weeks, and assign all 32 questions to the matching
  week (mapped 1:1 from the original topics)

**Known limitation (accepted, documented):** no migrations yet — `seed.py` drops and recreates
all tables on every run. Fine for a single-developer local project pre-launch; revisit once
there's real data worth preserving across schema changes.

**Verified:** week-only filtering, week+topic combos, and the full exam flow re-tested via
`curl` and in the browser pane after a clean reseed.

---

## Phase 3 — Document Pipeline ✅

Users can upload a PDF and it becomes searchable — the roadmap's stated Phase 3 goal — without
yet wiring that search into an LLM for synthesized answers (that's Phase 4, RAG).

**Technology choices (asked, not assumed):**
- Embeddings: **local sentence-transformers** (`all-MiniLM-L6-v2`, 384 dims), not a paid API —
  zero cost, no key, works offline
- Vector storage: **pgvector extension on the existing Postgres**, not a separate vector DB —
  one database to run, one place to query relational + vector data together
- OCR: **stubbed, not implemented** — the pipeline detects and gracefully skips scanned/image
  pages (counted in `pages_needing_ocr`) rather than crashing; the actual OCR engine is a
  documented extension point (`app/ocr/processor.py`) filled in once there's a real scanned
  document to validate against

**Built:**
- `Document` / `DocumentChunk` models; `docker-compose.yml` switched to the
  `pgvector/pgvector:pg16` image so the `vector` extension is available
- Ingestion pipeline (`app/rag/`): `extractor.py` (pypdf, per-page) → `chunking.py` (~800 char
  word-boundary chunks, ~150 char overlap, one page per chunk) → `embeddings.py`
  (lazily-loaded, cached sentence-transformers model) → `vector_store.py` (pgvector cosine
  distance search)
- `POST /api/documents/upload` (multipart, runs the pipeline synchronously),
  `GET /api/documents`, `GET/DELETE /api/documents/{id}`, `POST /api/documents/search`
  (raw semantic search, no LLM)
- Uploaded files stored on local disk at `backend/storage/documents/` (gitignored)
- New `/documents` page: upload form (week optional), document list with status/page/chunk
  counts, and a search box showing matched chunks with a similarity percentage

**Known limitations (accepted, documented):**
- Processing is synchronous inside the upload request — fine for lecture-slide-sized PDFs,
  would need a background task queue for much larger files
- OCR is a stub, not implemented (see above)
- `seed.py` now also clears `storage/documents/` on every reset, to keep the filesystem in sync
  with the (recreated) `documents` table

**Verified:** hand-crafted a minimal text-based test PDF (no external tooling available in this
environment), uploaded it via `curl` and confirmed extraction/chunking/embedding all ran
correctly (`status: ready`, correct page/chunk counts); ran a semantic search query and confirmed
it returned the right chunk with a sensible similarity score; repeated the same upload → search →
delete flow through the actual `/documents` UI in the browser pane and confirmed the list and
search results render correctly and stay in sync after delete.
