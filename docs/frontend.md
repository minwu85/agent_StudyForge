# Frontend

React + TypeScript, built with Vite. This document describes what is actually implemented today
(Phase 1 MVP + Phase 2 question database + Phase 3 document pipeline + Phase 4 RAG + Phase 5 Quiz
Agent + Phase 6 Tutor Agent, plus a design pass and a Progress page — see
[roadmap.md](roadmap.md) for the full long-term plan, and [progress.md](progress.md) for the
phase-by-phase build log).

## Stack

- **React 19** + **TypeScript** — UI
- **Vite** — dev server and build (proxies `/api/*` to the backend on port 8000, see
  `vite.config.ts`)
- **React Router** — client-side routing, plus a persistent sidebar shell (see Design system)
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no `tailwind.config.js` needed) — styling, with a
  custom `leaf` green color scale defined in `index.css`
- **lucide-react** — icon set used throughout the sidebar and page headers
- **Axios** — HTTP client, wrapped in `services/api.ts`

## Design system

The UI uses a green/botanical theme rather than Tailwind's default palette:

- **Colors**: a custom `leaf` scale (`leaf-50`..`leaf-900`, defined via Tailwind v4's `@theme` in
  `index.css`) for brand/interactive elements (buttons, active nav state, links), paired with
  Tailwind's built-in `stone` scale for neutrals (warmer than `slate`, to read as "earthy" rather
  than "corporate gray"). `emerald` is kept only for semantic success feedback (a correct quiz
  answer) so it stays visually distinct from `leaf` brand actions.
- **Layout**: a persistent left sidebar (`components/layout/Layout.tsx`) with the logo, nav
  links with icons, and a soft leaf decoration at its foot — replacing the earlier top-nav-only
  shell once there were enough pages to justify a dashboard-style shell. Below the `md` Tailwind
  breakpoint the sidebar is replaced by a horizontally-scrollable top bar with the same nav items
  (`hidden md:flex` / `md:hidden`), since a fixed sidebar doesn't fit a phone-width viewport.
- **Decoration**: `components/common/LeafDecoration.tsx` — a hand-drawn SVG (radial wash +
  layered leaf silhouettes + vein strokes, all using the `leaf` CSS variables so it stays in sync
  with the palette) used sparingly: the sidebar footer and the Home page hero's two corners.
  `corner="bottom-left" | "top-right"` just rotates the same artwork 180° rather than drawing it
  twice.

## Pages

```text
/               Home         Landing page with quick links to every other page
/documents      Documents    Upload PDFs, see processing status, semantic-search across them
/study          Study        Ask a question about your material; see retrieved sources + the
                              exact prompt that would be sent to an LLM (generation is stubbed —
                              see backend.md Phase 4)
/tutor          Tutor        Adaptive explain → question → feedback loop over your material, with
                              a hint button and difficulty that rises/falls with your accuracy
/progress       Progress     Quizzes completed, average score, a score-over-time chart, and
                              accuracy by topic
/quiz/setup     QuizSetup    Pick weeks, topic, difficulty, question count, time limit → creates a quiz;
                              also hosts the Quiz Agent panel (generate questions from documents)
/quiz/:quizId   Quiz         Exam-taking UI: timer, question nav grid, flagging, submit
/results/:id    Results      Score summary + optional per-question review
```

`Review`, `History`, `Settings` from the full roadmap don't exist yet — `Review` is covered
inline on the Results page instead of a separate route, and `History`/`Settings` aren't needed
until there's more than one thing to look back on or configure.

## Folder structure (implemented so far)

```text
frontend/src/
├── App.tsx                  Route definitions
├── main.tsx                 React root
├── components/
│   ├── layout/Layout.tsx      sidebar + mobile top bar shell used by every route (see Design system)
│   ├── common/LeafDecoration.tsx   the reusable botanical corner decoration
│   └── progress/
│       ├── ScoreTrendChart.tsx     hand-rolled SVG line/area chart (no charting library)
│       └── TopicAccuracyBars.tsx   accuracy-by-topic bars (plain CSS width %, not SVG)
├── pages/
│   ├── Home/Home.tsx
│   ├── Documents/Documents.tsx
│   ├── Study/Study.tsx
│   ├── Tutor/Tutor.tsx
│   ├── Progress/Progress.tsx
│   ├── QuizSetup/QuizSetup.tsx
│   ├── Quiz/Quiz.tsx
│   └── Results/Results.tsx
├── services/
│   ├── api.ts                axios instance (baseURL: /api)
│   ├── quizApi.ts            typed wrapper for quiz/question/result endpoints, incl. generateQuestions (Quiz Agent)
│   ├── courseApi.ts          typed wrapper for course/week endpoints
│   ├── documentApi.ts        typed wrapper for document upload/list/delete/search
│   ├── studyApi.ts           typed wrapper for /api/study/chat
│   ├── tutorApi.ts           typed wrapper for /api/tutor/sessions (create/get/answer/hint)
│   └── progressApi.ts        typed wrapper for /api/progress
├── types/
│   ├── Question.ts
│   ├── Quiz.ts
│   ├── Result.ts             mirror the backend's Pydantic schemas field-for-field
│   ├── Course.ts
│   ├── Document.ts
│   ├── Study.ts
│   ├── Tutor.ts
│   └── Progress.ts
└── hooks/
    └── useTimer.ts            countdown hook used by the Quiz page's exam timer
```

## How a quiz attempt flows through the frontend

```text
QuizSetup
  → getTopics()              on mount, populates the topic <select>
  → getCourses() → getWeeks(courseId)   on mount, populates the week checkbox grid
  → createQuiz({ topic, difficulty, week_ids, ... })   on submit → navigate(`/quiz/${quiz.id}`)

Quiz
  → getQuiz(quizId)          on mount; questions arrive WITHOUT correct answers
  → local state:             answers: Record<questionId, AnswerOption>
                              flagged: Set<questionId>
                              currentIndex: number
  → useTimer(...)             counts down time_limit_minutes*60 if set; auto-submits at 0
  → submitQuiz(quizId, {...}) on manual submit (confirms first if questions are unanswered)
                              → navigate(`/results/${quiz.id}`)

Results
  → getResultSummary(quizId)  score, correct count, time taken
  → getReview(quizId)         lazy-loaded on "Review Answers" click; shows correct answers,
                               the student's answer, and explanations per question
```

Scoring is never computed client-side — the Quiz page only collects answers and flags; the
backend returns the authoritative score on submit.

**Course selection:** `QuizSetup` and `Documents` both fetch all courses and just use the first
one — there's no course picker in the UI yet since the seed data only creates one course. The API
(`GET /api/courses`) already supports more than one; adding a `<select>` when that becomes true
is a small, isolated change rather than a redesign.

## The Quiz Agent panel (on QuizSetup)

A card above the manual quiz form, driven by its own local state (`genDifficulty`, `genCount`,
`genTopic`, `genResult`) separate from the manual-quiz form fields:

```text
"Generate questions from my documents" button
  → generateQuestions({ course_id, week_ids: <same checkbox selection as the form below>,
                         topic: genTopic || null, difficulty: genDifficulty, question_count: genCount })
  → POST /api/quizzes/generate-questions
  → renders: "N of M requested questions accepted, R rejected"
             + the accepted questions' text
             + a collapsible list of why any candidates were rejected (per roadmap section 19 —
               even a rejection should say *why*, not just fail silently)
  → on success, re-fetches topics/weeks so the new questions' counts show up immediately in the
    manual quiz form below
```

It reuses the same week checkboxes as the manual quiz-creation form below it (selecting weeks
scopes both "which questions to build a quiz from" and "which documents to generate from"), but
has its own difficulty/count fields, since generating 5 questions at hard difficulty and then
taking a 10-question easy quiz from the resulting (mixed) bank is a reasonable, independent
workflow.

## How the Documents page works

```text
Documents
  → getCourses() → getWeeks(courseId)   on mount, populates the "week (optional)" <select>
  → getDocuments(courseId)              on mount and after every upload/delete
  → uploadDocument(courseId, weekId, file)   multipart/form-data POST; awaits the full
                                              extract→chunk→embed→store pipeline server-side
                                              before resolving (see backend.md — it's synchronous)
  → deleteDocument(documentId)          removes the doc, its chunks, and its file server-side
  → searchDocuments(query, courseId)    POST /api/documents/search; renders each match's
                                         filename, page number, and similarity as a percentage
```

There's no polling or progress bar for the upload — because processing is synchronous on the
backend today, the `Upload` button's "Uploading & processing…" state covers the whole pipeline
and the document simply appears in the list already `ready` (or `failed`, with an error message)
once the request resolves.

## How the Study page works

```text
Study
  → getCourses()                on mount, just uses the first course (same pattern as QuizSetup)
  → askStudy(question, courseId)   on submit → POST /api/study/chat
                                    renders response.answer, response.sources (filename, page,
                                    similarity), and a collapsible <pre> showing response.prompt
```

The backend's `model` field in the response is checked (`response.model.startsWith('stub')`) to
show an explicit amber banner explaining that generation isn't connected to a real LLM yet —
the UI doesn't pretend the extractive fallback is a generated answer. Once Phase 4's stub is
replaced with a real Claude call, that check simply stops matching and the banner disappears on
its own; no frontend change needed.

## How the Tutor page works

```text
Tutor (before a session exists)
  → getCourses() → getWeeks(courseId)   same week checkbox pattern as QuizSetup
  → createTutorSession({ course_id, week_ids })   on "Start tutoring session"
                                                   → POST /api/tutor/sessions

Tutor (session active)
  → local state: turnIndex (which of session.turns is on screen), selectedOption, result, hint
  → turn = session.turns[turnIndex]   renders turn.explanation (the passage) above
                                       turn.question_text + four option buttons
  → submitTutorAnswer(session.id, { selected_answer })   on "Submit answer"
                                                          → POST /api/tutor/sessions/{id}/answer
                                                          → stores the response as `result` AND
                                                            replaces `session` with response.session
                                                            (which already includes the next turn,
                                                            or is status=ended if material ran out)
  → "Continue" button   increments turnIndex to reveal the next turn (already fetched — no extra
                        request), and clears result/selectedOption/hint for the fresh question
  → getTutorHint(session.id)   on "Get a hint" (only while the current turn is unanswered)
                                → POST /api/tutor/sessions/{id}/hint → renders the masked answer
```

The answer buttons double as feedback once `result` is set: the correct option turns green, and a
wrong selection turns red, using the same `is_correct`/`correct_answer` pattern as reviewing a quiz
result — just inline instead of on a separate Results page, since a tutoring session is meant to
give feedback immediately rather than at the end. A "Session complete" screen (no more turns
returned) shows the running `questions_correct`/`questions_asked` tally and offers to start again.

## How the Progress page works

```text
Progress
  → getProgress()   GET /api/progress → { total_quizzes, average_score_percentage,
                                           score_trend[], topic_accuracy[] }
  → <ScoreTrendChart points={score_trend} />     one point per completed quiz, in order
  → <TopicAccuracyBars data={topic_accuracy} />  one bar per topic with >=1 answered question
```

Both charts are hand-rolled (SVG for the line chart, plain divs with a CSS `width` percentage for
the bars) rather than pulling in a charting library — the data shapes are simple enough
(a handful of points, a handful of topics) that a dependency wasn't justified. If the data model
grows richer (multiple courses, per-week breakdowns, date-range filtering), revisit that call.

## Local setup

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, proxies /api to http://localhost:8000
```

The dev server proxy (in `vite.config.ts`) means the frontend can call relative paths like
`/api/quizzes` regardless of the backend's actual port — no `.env` or CORS config needed for
local development beyond what's already in `backend/.env.example`.

## Type checking

```bash
npx tsc -b --noEmit
```

There's no ESLint config in this project yet (the current Vite `react-ts` template doesn't ship
one by default) — `tsc` with `strict`, `noUnusedLocals`, and `noUnusedParameters` enabled is the
only static check today.
