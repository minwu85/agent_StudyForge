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
| 4 | RAG | ⚠️ Done (generation stubbed) |
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

---

## Phase 4 — RAG ⚠️ (generation stubbed)

Wires document search into the "Question → Retriever → LLM → Grounded answer" pipeline the
roadmap describes — with the LLM call itself deliberately left as a stub, by explicit choice, not
oversight.

**Decision (asked, not assumed):** offered a choice between wiring up a real Claude API call now
(cost + API key required) or building the full retrieval/prompt plumbing with generation stubbed,
swappable later. Chose the stub — Claude Haiku 4.5 was named as the target model for when it's
wired up for real, but no API call happens yet and no key is required.

**Built:**
- `rag/retriever.py`: the shared "question → ranked chunks" entry point. `vector_store.py` stayed
  as the low-level pgvector query; `document_service.search_chunks` (Phase 3's raw search
  endpoint) was refactored to call the new retriever too, removing duplicated embed+search+map
  logic that existed in both places
- `prompts/study_prompts.py`: a real, structured prompt (ROLE/TASK/CONTEXT/CONSTRAINTS/OUTPUT
  FORMAT per the roadmap's prompt-engineering guidance) that numbers and cites each retrieved
  chunk with its source document and page
- `rag/generation.py`: the one stubbed function — `generate_answer` returns the closest matching
  chunk verbatim, clearly labeled as not model-generated, instead of calling an LLM
- `POST /api/study/chat`: returns the question, the (stub) answer, which sources were used, *and*
  the exact prompt that would be sent to a real LLM — so the whole pipeline is inspectable even
  without generation
- New `/study` page: ask a question, see the answer, sources with similarity scores, and a
  collapsible view of the full constructed prompt; an amber banner (driven by checking
  `response.model.startsWith('stub')`) is honest about generation not being connected yet

**Known limitation (accepted, documented):** `generate_answer` doesn't call an LLM. Swapping in
Claude Haiku 4.5 is scoped to be a small, isolated change — edit one function's body to call
`client.messages.create(...)` with the already-built prompt — with no changes needed anywhere
else (retriever, prompt builder, route, schemas, or frontend).

**Verified:** uploaded a test PDF, asked `/study/chat` a question via `curl` and confirmed
retrieval found the right chunk, the constructed prompt was correctly structured with proper
citations, and the response's `model` field honestly reported the stub; repeated the same
question through the actual `/study` UI in the browser pane and confirmed the answer, sources,
stub banner, and expandable prompt view all render correctly.

---

## Design pass — green/botanical theme, sidebar shell, Progress page

Not a numbered roadmap phase — a visual redesign requested directly, using reference mockups
(dashboard-with-sidebar layouts, and separate watercolor leaf/floral corner artwork) as style
guides, plus one new page (`Progress`, which the roadmap's frontend structure names but no phase
had built yet).

**Built:**
- A custom `leaf` green Tailwind color scale (`index.css`, via Tailwind v4's `@theme`), replacing
  `indigo` for brand/interactive elements across every existing page; `stone` (warmer gray)
  replaced `slate` for neutrals. `emerald` was kept, deliberately, only for correct/incorrect quiz
  feedback, so brand color and semantic success color stay visually distinct
- `components/common/LeafDecoration.tsx` — an original hand-drawn SVG (radial wash + layered leaf
  silhouettes + veins, in the `leaf` palette) inspired by the reference watercolor images, not a
  reuse of them — those were AI-generated mood-board images, not licensed assets to embed
- `components/layout/Layout.tsx` rewritten from a simple top nav into a persistent left sidebar
  (logo, icon+label nav via `lucide-react`, active-route highlighting, a `LeafDecoration` at its
  foot) with a responsive fallback to a horizontal top bar below the `md` breakpoint
- New `/progress` page + `GET /api/progress`: total quizzes, average score, a score-over-time
  line/area chart, and accuracy-by-topic bars — both charts hand-rolled (SVG / CSS width%) rather
  than adding a charting library, since the data is simple enough not to justify one
- Home page redesigned with a leaf-decorated hero and a quick-link card grid to every other page

**Known limitation (accepted, documented):** `GET /api/progress` aggregates across all completed
quizzes with no course filter — `Quiz` has no direct course foreign key today, and there's only
one course in the seed data, so adding that filter now would be speculative (see backend.md's
Progress aggregation section for the exact join that would be needed later).

**Verified:** full type-check clean; walked every page (Home, Documents, Study, Progress,
QuizSetup, Quiz, Results) in the browser pane at both a mobile-width and a 1280px desktop
viewport to confirm the sidebar/top-bar responsive switch and color theme render correctly;
generated sample completed quizzes via `curl` to confirm the Progress page's charts render real
aggregated data, not just an empty state. Hit and fixed one real bug along the way: adding
`lucide-react` while the Vite dev server was already running left a stale dependency
pre-bundle cache, causing an "Invalid hook call" runtime error on client-side navigation — fixed
by clearing `node_modules/.vite` and restarting the dev server (a fresh browser tab was also
needed, since the open tab had cached the broken module graph).
