# Frontend

React + TypeScript, built with Vite. This document describes what is actually implemented today
(Phase 1 MVP — see [roadmap.md](roadmap.md) for the full long-term plan).

## Stack

- **React 19** + **TypeScript** — UI
- **Vite** — dev server and build (proxies `/api/*` to the backend on port 8000, see
  `vite.config.ts`)
- **React Router** — client-side routing between the four MVP pages
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no `tailwind.config.js` needed) — styling
- **Axios** — HTTP client, wrapped in `services/api.ts`

## Pages (Phase 1)

```text
/               Home         Landing page, links to quiz setup
/quiz/setup     QuizSetup    Pick topic, difficulty, question count, time limit → creates a quiz
/quiz/:quizId   Quiz         Exam-taking UI: timer, question nav grid, flagging, submit
/results/:id    Results      Score summary + optional per-question review
```

`Review`, `History`, `Study`, `Documents`, `Progress`, `Settings` from the full roadmap don't
exist yet — they depend on document upload, RAG, agents, and memory, none of which are built
yet. The Results page includes an inline "Review Answers" toggle so answer review is covered for
Phase 1 without a separate route.

## Folder structure (implemented so far)

```text
frontend/src/
├── App.tsx                  Route definitions
├── main.tsx                 React root
├── components/layout/
│   └── Layout.tsx            Header + <Outlet /> shell used by every route
├── pages/
│   ├── Home/Home.tsx
│   ├── QuizSetup/QuizSetup.tsx
│   ├── Quiz/Quiz.tsx
│   └── Results/Results.tsx
├── services/
│   ├── api.ts                axios instance (baseURL: /api)
│   └── quizApi.ts            typed wrapper for every backend endpoint
├── types/
│   ├── Question.ts
│   ├── Quiz.ts
│   └── Result.ts             mirror the backend's Pydantic schemas field-for-field
└── hooks/
    └── useTimer.ts            countdown hook used by the Quiz page's exam timer
```

## How a quiz attempt flows through the frontend

```text
QuizSetup
  → getTopics()              on mount, populates the topic <select>
  → createQuiz(filters)      on submit → navigate(`/quiz/${quiz.id}`)

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
