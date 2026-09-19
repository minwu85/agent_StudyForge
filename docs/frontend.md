# Frontend

React + TypeScript, built with Vite. This document describes what is actually implemented today
(Phase 1 MVP + Phase 2 question database + Phase 3 document pipeline + Phase 4 RAG — see
[roadmap.md](roadmap.md) for the full long-term plan, and [progress.md](progress.md) for the
phase-by-phase build log).

## Stack

- **React 19** + **TypeScript** — UI
- **Vite** — dev server and build (proxies `/api/*` to the backend on port 8000, see
  `vite.config.ts`)
- **React Router** — client-side routing between the four MVP pages
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no `tailwind.config.js` needed) — styling
- **Axios** — HTTP client, wrapped in `services/api.ts`

## Pages

```text
/               Home         Landing page, links to quiz setup
/documents      Documents    Upload PDFs, see processing status, semantic-search across them
/study          Study        Ask a question about your material; see retrieved sources + the
                              exact prompt that would be sent to an LLM (generation is stubbed —
                              see backend.md Phase 4)
/quiz/setup     QuizSetup    Pick weeks, topic, difficulty, question count, time limit → creates a quiz
/quiz/:quizId   Quiz         Exam-taking UI: timer, question nav grid, flagging, submit
/results/:id    Results      Score summary + optional per-question review
```

`Review`, `History`, `Progress`, `Settings` from the full roadmap don't exist yet — they depend
on agents and personalised memory, neither of which is built yet. The Results page includes an
inline "Review Answers" toggle so answer review is covered without a separate route.

## Folder structure (implemented so far)

```text
frontend/src/
├── App.tsx                  Route definitions
├── main.tsx                 React root
├── components/layout/
│   └── Layout.tsx            Header + <Outlet /> shell used by every route
├── pages/
│   ├── Home/Home.tsx
│   ├── Documents/Documents.tsx
│   ├── Study/Study.tsx
│   ├── QuizSetup/QuizSetup.tsx
│   ├── Quiz/Quiz.tsx
│   └── Results/Results.tsx
├── services/
│   ├── api.ts                axios instance (baseURL: /api)
│   ├── quizApi.ts            typed wrapper for quiz/question/result endpoints
│   ├── courseApi.ts          typed wrapper for course/week endpoints
│   ├── documentApi.ts        typed wrapper for document upload/list/delete/search
│   └── studyApi.ts           typed wrapper for /api/study/chat
├── types/
│   ├── Question.ts
│   ├── Quiz.ts
│   ├── Result.ts             mirror the backend's Pydantic schemas field-for-field
│   ├── Course.ts
│   ├── Document.ts
│   └── Study.ts
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
