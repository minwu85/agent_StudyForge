# StudyForge — Full Project Vision & Roadmap

## Agentic AI Exam & Personalised Learning Platform

This document is the full long-term design for StudyForge: the target architecture, agent
system, RAG pipeline, database design, and phased roadmap. It describes where the project is
*going*, not necessarily what is built today — for the current implementation status, see the
[README](../README.md), [backend.md](backend.md), and [frontend.md](frontend.md).

---

# 1. Project Overview

**StudyForge** is an AI-powered learning and examination platform that transforms university learning materials into an interactive and personalised exam-training environment.

Users can upload lecture materials such as:

* PDF lecture slides
* Lecture notes
* Lecture transcripts
* Images
* Tutorial material
* Practice questions
* Past examination material

The platform processes the material, extracts knowledge, creates a searchable knowledge base, and uses AI agents to provide:

* AI-generated quizzes
* RAG-based explanations
* Exam simulations
* Personalised tutoring
* Automatic answer evaluation
* Weak-topic detection
* Adaptive question difficulty
* Learning recommendations
* Learning history and memory

The system combines:

**React + TypeScript + Python + FastAPI + PostgreSQL + Vector Database + LLM + RAG + OCR + Agent Framework**

---

# 2. Main Goal

The goal is to demonstrate practical experience with:

| Skill                 | Demonstrated by                              |
| --------------------- | -------------------------------------------- |
| Generative AI         | LLM-powered tutor and quiz generation        |
| Prompt Engineering    | Structured prompts for different agents      |
| Python                | Backend, AI pipeline and evaluation          |
| SQL                   | PostgreSQL database                          |
| JavaScript/TypeScript | React frontend                               |
| React                 | Web application                              |
| OCR                   | Image/scanned document processing            |
| LLM                   | Tutor, generation and evaluation             |
| RAG                   | Lecture-material retrieval                   |
| Agentic AI            | Multiple specialised agents                  |
| Agent tools           | Search, quiz, evaluation and analytics tools |
| Memory                | Student learning profile                     |
| Simulation            | Timed exam environment                       |
| Automatic evaluation  | AI + rule-based evaluation                   |
| Problem solving       | Adaptive learning pipeline                   |
| Agent infrastructure  | Orchestration and tool architecture          |
| Sandbox               | Optional code-exam environment               |
| Evaluation            | Agent/quiz quality evaluation                |
| System design         | Layered backend architecture                 |

---

# 3. High-Level Architecture

```text
                         ┌──────────────────┐
                         │      USER        │
                         └────────┬─────────┘
                                  │
                                  ▼
                     ┌───────────────────────┐
                     │    React Frontend     │
                     │      TypeScript       │
                     └───────────┬───────────┘
                                 │
                              REST API
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │    FastAPI Backend    │
                     │        Python         │
                     └───────────┬───────────┘
                                 │
                 ┌───────────────┼────────────────┐
                 │               │                │
                 ▼               ▼                ▼
          Document System   Agent System      Exam System
                 │               │                │
                 ▼               ▼                ▼
               OCR             RAG             Quiz
             Parser           Memory           Timer
            Chunking          Tools          Evaluation
            Embedding         Skills          Results
                 │               │                │
                 └───────────────┼────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                ▼                ▼                ▼
          PostgreSQL       Vector Database     File Storage
```

---

# 4. Agent Architecture

Do not create one giant AI agent.

Use specialised agents.

```text
                         Agent Orchestrator
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
       Study Agent         Quiz Agent         Exam Agent
             │                  │                  │
             ▼                  ▼                  ▼
       Tutor Agent        Evaluation Agent    Analytics Agent
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                         Shared Tools
                                │
          ┌─────────────┬───────┼────────┬─────────────┐
          ▼             ▼       ▼        ▼             ▼
      RAG Search      Memory   Quiz    Evaluation   Analytics
```

Each agent has a specific responsibility.

---

# 5. Agents

## 5.1 Study Agent

Responsible for understanding the user's question and deciding how to answer it.

Example:

```text
User:
"Explain polymorphism from Week 6."

        ↓

Study Agent

        ↓

Search RAG

        ↓

Retrieve Week 6 material

        ↓

LLM

        ↓

Explanation + sources
```

Responsibilities:

* Understand user intent
* Retrieve relevant material
* Explain concepts
* Reference source material
* Recommend further study

---

# 5.2 Quiz Agent

Generates questions based on the student's material.

Input:

```json
{
    "weeks": [4, 5, 6],
    "difficulty": "medium",
    "question_count": 20,
    "question_type": "multiple_choice"
}
```

Pipeline:

```text
User configuration
        ↓
Quiz Agent
        ↓
RAG retrieval
        ↓
Question generation
        ↓
Evaluation Agent
        ↓
Valid?
   │
   ├── Yes → Store
   │
   └── No → Regenerate
```

---

# 5.3 Tutor Agent

Provides interactive teaching.

Example:

```text
Tutor Agent

1. Explain concept
2. Ask question
3. Evaluate response
4. Identify misunderstanding
5. Give hint
6. Ask another question
7. Increase/decrease difficulty
```

This creates an adaptive learning loop.

---

# 5.4 Exam Agent

Controls exam mode.

Responsibilities:

* Select questions
* Start exam
* Track time
* Track answers
* Handle navigation
* Submit exam
* Trigger evaluation
* Generate result

The frontend displays the exam, but the backend remains responsible for the authoritative exam state.

---

# 5.5 Evaluation Agent

This is one of the most important components.

It evaluates both:

### Student answers

```text
Student answer
      ↓
Evaluation Agent
      ↓
Correct / Incorrect
      ↓
Explanation
      ↓
Topic classification
```

### AI-generated questions

```text
Generated question
      ↓
Evaluation Agent
      ↓
Check:
- Correct answer
- Ambiguity
- Source grounding
- Difficulty
- Distractors
      ↓
Accept / Reject
```

---

# 5.6 Analytics Agent

Analyses the student's history.

Example:

```text
Past attempts
      ↓
Analytics Agent
      ↓
Topic performance
      ↓
Weak areas
      ↓
Learning recommendation
```

Output:

```text
Weak Topics:

Generics       54%
Exceptions     61%
Inheritance    74%

Recommendation:

Focus on Generics first.
Complete 10 medium-difficulty questions.
```

---

# 6. RAG Architecture

RAG is central to the project.

The LLM should not rely only on its general knowledge.

It should primarily use the user's uploaded material.

```text
                    Uploaded PDF
                         │
                         ▼
                  Text Extraction
                         │
                         ▼
                       OCR
                  if required
                         │
                         ▼
                    Cleaning
                         │
                         ▼
                     Chunking
                         │
                         ▼
                    Metadata
                         │
                         ▼
                    Embedding
                         │
                         ▼
                  Vector Database
                         │
                         │
                         ▼
User Question → Retriever → Relevant Chunks
                              │
                              ▼
                             LLM
                              │
                              ▼
                    Grounded Response
```

Metadata should include:

```text
document_id
course
week
topic
page
chunk_id
source
```

This allows queries such as:

```text
Week = 6
Topic = Exceptions
```

---

# 7. OCR Pipeline

For scanned lecture material:

```text
Image / Scanned PDF
        ↓
OCR
        ↓
Extracted Text
        ↓
Cleaning
        ↓
Chunking
        ↓
Embedding
        ↓
Vector Database
```

Possible Python implementation:

```text
OCR Service
├── detect_document()
├── extract_text()
├── process_image()
└── process_scanned_pdf()
```

The system should only use OCR when necessary rather than running OCR on every document.

---

# 8. Personalised Memory

Memory should not simply mean storing chat messages.

Create structured learning memory.

```text
Student Memory
│
├── Learning History
│
├── Weak Topics
│
├── Strong Topics
│
├── Previous Mistakes
│
├── Question Difficulty
│
├── Quiz Performance
└── Preferences
```

Example:

```json
{
    "student_id": 15,
    "weak_topics": [
        {
            "topic": "Generics",
            "accuracy": 0.54
        },
        {
            "topic": "Exceptions",
            "accuracy": 0.61
        }
    ]
}
```

The agent can use this information to personalise future quizzes.

---

# 9. Adaptive Learning

The system should gradually adapt to the student.

Example:

```text
Student answers:

Easy question → Correct
Easy question → Correct
Medium question → Correct
Hard question → Incorrect
Hard question → Incorrect

                    ↓

System detects difficulty is too high

                    ↓

Generate medium questions

                    ↓

Student improves

                    ↓

Increase difficulty again
```

This demonstrates decision-making rather than simply generating static quizzes.

---

# 10. Exam Simulation

The exam system should have:

* Selected weeks
* Question count
* Difficulty
* Randomisation
* Time limit
* Question navigation
* Flag question
* Previous/Next
* Auto-submit
* Manual submit
* No answer reveal during exam
* Exam result
* Review mode

Example:

```text
                 QUIZ SETUP

Weeks:
☑ Week 1
☑ Week 2
☑ Week 3

Questions:
20

Difficulty:
Medium

Mode:
Exam

Time:
30 minutes

             [ START EXAM ]
```

---

# 11. Frontend Pages

```text
frontend/src/pages/

Home
QuizSetup
Quiz
Results
Review
History
Study
Documents
Progress
Settings
```

### Home

Dashboard.

### QuizSetup

Select:

* Weeks
* Topics
* Question count
* Difficulty
* Mode
* Timer

### Quiz

Exam interface.

### Results

Score and statistics.

### Review

Question-by-question analysis.

### History

Previous attempts.

### Study

AI tutor interface.

### Documents

Upload and manage learning material.

### Progress

Visualise learning progress.

### Settings

User preferences.

---

# 12. Frontend Structure

```text
frontend/
│
├── public/
│
├── src/
│   │
│   ├── pages/
│   │   ├── Home/
│   │   ├── QuizSetup/
│   │   ├── Quiz/
│   │   ├── Results/
│   │   ├── Review/
│   │   ├── History/
│   │   ├── Study/
│   │   ├── Documents/
│   │   ├── Progress/
│   │   └── Settings/
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── quiz/
│   │   ├── study/
│   │   ├── documents/
│   │   ├── progress/
│   │   └── common/
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── quizApi.ts
│   │   ├── studyApi.ts
│   │   └── documentApi.ts
│   │
│   ├── hooks/
│   │   ├── useQuiz.ts
│   │   ├── useTimer.ts
│   │   └── useStudy.ts
│   │
│   ├── types/
│   │   ├── Question.ts
│   │   ├── Quiz.ts
│   │   ├── Result.ts
│   │   ├── Document.ts
│   │   └── Student.ts
│   │
│   ├── stores/
│   │   ├── quizStore.ts
│   │   └── userStore.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
└── package.json
```

---

# 13. Python Backend Structure

The backend should be the main technical focus.

```text
backend/
│
├── app/
│   │
│   ├── main.py
│   ├── config.py
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── documents.py
│   │   │   ├── questions.py
│   │   │   ├── quizzes.py
│   │   │   ├── exams.py
│   │   │   ├── study.py
│   │   │   ├── results.py
│   │   │   ├── progress.py
│   │   │   └── users.py
│   │   │
│   │   └── dependencies.py
│   │
│   ├── agents/
│   │   ├── orchestrator.py
│   │   ├── study_agent.py
│   │   ├── quiz_agent.py
│   │   ├── tutor_agent.py
│   │   ├── exam_agent.py
│   │   ├── evaluation_agent.py
│   │   └── analytics_agent.py
│   │
│   ├── rag/
│   │   ├── ingestion.py
│   │   ├── chunking.py
│   │   ├── embeddings.py
│   │   ├── retriever.py
│   │   ├── vector_store.py
│   │   └── pipeline.py
│   │
│   ├── ocr/
│   │   ├── detector.py
│   │   ├── extractor.py
│   │   └── processor.py
│   │
│   ├── tools/
│   │   ├── search_tool.py
│   │   ├── quiz_tool.py
│   │   ├── evaluation_tool.py
│   │   ├── memory_tool.py
│   │   ├── analytics_tool.py
│   │   └── document_tool.py
│   │
│   ├── memory/
│   │   ├── profile.py
│   │   ├── learning_history.py
│   │   ├── mistake_tracker.py
│   │   └── memory_service.py
│   │
│   ├── evaluation/
│   │   ├── answer_evaluator.py
│   │   ├── question_evaluator.py
│   │   ├── grounding_evaluator.py
│   │   └── metrics.py
│   │
│   ├── services/
│   │   ├── quiz_service.py
│   │   ├── exam_service.py
│   │   ├── document_service.py
│   │   ├── study_service.py
│   │   └── result_service.py
│   │
│   ├── repositories/
│   │   ├── question_repository.py
│   │   ├── quiz_repository.py
│   │   ├── result_repository.py
│   │   ├── document_repository.py
│   │   └── user_repository.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── question.py
│   │   ├── quiz.py
│   │   ├── result.py
│   │   ├── document.py
│   │   └── learning_profile.py
│   │
│   ├── schemas/
│   │   ├── question.py
│   │   ├── quiz.py
│   │   ├── result.py
│   │   ├── document.py
│   │   └── study.py
│   │
│   ├── database/
│   │   ├── connection.py
│   │   ├── migrations/
│   │   └── seed.py
│   │
│   └── prompts/
│       ├── study_prompts.py
│       ├── quiz_prompts.py
│       ├── tutor_prompts.py
│       └── evaluation_prompts.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── evaluation/
│
├── scripts/
│   ├── ingest_documents.py
│   └── evaluate_agents.py
│
├── requirements.txt
├── .env.example
└── README.md
```

---

# 14. Python Architecture

Use this flow:

```text
API
 ↓
Controller / Route
 ↓
Service
 ↓
Agent
 ↓
Tools
 ↓
Repository / RAG
 ↓
Database / Vector Store
```

For example:

```text
POST /api/quizzes
        ↓
quiz route
        ↓
quiz service
        ↓
quiz agent
        ↓
RAG retriever
        ↓
LLM
        ↓
evaluation agent
        ↓
quiz repository
        ↓
PostgreSQL
```

This keeps business logic out of your FastAPI routes.

---

# 15. Database Structure

## users

```text
id
email
name
created_at
```

## courses

```text
id
name
description
```

## weeks

```text
id
course_id
week_number
title
```

## documents

```text
id
course_id
week_id
filename
file_type
status
created_at
```

## questions

```text
id
course_id
week_id
topic
question_text
option_a
option_b
option_c
option_d
correct_answer
explanation
difficulty
source_document_id
```

## quizzes

```text
id
user_id
mode
question_count
time_limit
started_at
completed_at
```

## quiz_questions

```text
id
quiz_id
question_id
question_order
selected_answer
is_correct
```

## learning_profiles

```text
id
user_id
topic
attempts
correct
accuracy
difficulty
```

## memories

```text
id
user_id
memory_type
content
created_at
```

---

# 16. API Structure

## Documents

```http
POST /api/documents/upload
GET /api/documents
GET /api/documents/{id}
DELETE /api/documents/{id}
```

## Questions

```http
GET /api/questions
GET /api/questions?week=3
GET /api/questions?weeks=1,2,3
```

## Quiz

```http
POST /api/quizzes
GET /api/quizzes/{id}
POST /api/quizzes/{id}/submit
```

## Results

```http
GET /api/results/{id}
GET /api/results/{id}/review
```

## Study Agent

```http
POST /api/study/chat
```

## Progress

```http
GET /api/progress
GET /api/progress/topics
```

---

# 17. Quiz Creation Flow

```text
User
 │
 │ Select:
 │ Week 1 + Week 2
 │ 20 questions
 │ Medium
 │ 30 minutes
 │
 ▼
POST /api/quizzes
 │
 ▼
Quiz Service
 │
 ▼
Quiz Agent
 │
 ▼
Retrieve relevant questions/material
 │
 ▼
Randomise
 │
 ▼
Select questions
 │
 ▼
Create Quiz
 │
 ▼
Return quiz ID
 │
 ▼
Frontend starts exam
```

---

# 18. Question Generation Flow

```text
Lecture Material
       ↓
RAG Retriever
       ↓
Relevant Knowledge
       ↓
Quiz Agent
       ↓
LLM
       ↓
Generated Question
       ↓
Evaluation Agent
       ↓
┌───────────────┐
│ Valid?        │
└───────┬───────┘
        │
   ┌────┴────┐
   ↓         ↓
  YES        NO
   ↓         ↓
 Store     Regenerate
```

---

# 19. Evaluation System

Use multiple evaluation layers.

## Rule-based evaluation

Check:

* Required fields
* Four options
* Valid correct answer
* Duplicate options
* Empty values

## LLM evaluation

Check:

* Question quality
* Correctness
* Ambiguity
* Difficulty
* Source grounding

## RAG evaluation

Measure:

* Retrieval relevance
* Grounding
* Citation correctness

This gives you a much more credible AI project.

---

# 20. Agent Tools

Each agent should access tools rather than directly accessing everything.

Example:

```python
search_knowledge()
get_student_profile()
get_learning_history()
generate_question()
evaluate_question()
calculate_score()
get_weak_topics()
save_learning_result()
```

Conceptually:

```text
Agent
 │
 ├── search_knowledge()
 ├── get_memory()
 ├── generate_question()
 ├── evaluate_answer()
 ├── calculate_score()
 └── recommend_practice()
```

---

# 21. Prompt Engineering Structure

Do not scatter prompts throughout Python files.

Keep them in:

```text
app/prompts/
```

Example:

```text
quiz_prompts.py
```

The prompt should define:

```text
ROLE
TASK
CONTEXT
CONSTRAINTS
OUTPUT FORMAT
QUALITY REQUIREMENTS
```

Example structure:

```text
You are a university exam question generator.

TASK:
Generate one multiple-choice question.

CONTEXT:
Use only the provided learning material.

REQUIREMENTS:
- Exactly four options
- One correct answer
- Do not introduce unsupported information
- Match requested difficulty

OUTPUT:
Return structured JSON.
```

This gives you clear evidence of **prompt engineering**.

---

# 22. Agent Orchestration

The orchestrator controls the workflow.

Example:

```text
User Request
     ↓
Orchestrator
     ↓
Determine Intent
     │
     ├── Study → Study Agent
     │
     ├── Quiz → Quiz Agent
     │
     ├── Exam → Exam Agent
     │
     └── Progress → Analytics Agent
```

For complex workflows:

```text
Quiz Agent
    ↓
RAG Tool
    ↓
Question Generator
    ↓
Evaluation Agent
    ↓
Storage
```

A framework such as **LangGraph** can be introduced here because it makes the agent workflow explicit and stateful.

---

# 23. Optional Coding Sandbox

This should be **Phase 3**, not the starting point.

Add a programming exam mode:

```text
Programming Question
       ↓
Code Editor
       ↓
Submit
       ↓
Sandbox
       ↓
Compile
       ↓
Run Tests
       ↓
Evaluation
       ↓
AI Feedback
```

This gives the project another strong feature:

**Agent + Sandbox + Automatic Evaluation**

But it should not delay the main project.

---

# 24. Development Roadmap

## Phase 1 — Basic Quiz Platform

Build:

```text
React
FastAPI
PostgreSQL

Home
Quiz Setup
Quiz
Results
```

No AI yet.

Goal:

> A complete working quiz application.

---

## Phase 2 — Question Database

Add:

```text
Courses
Weeks
Topics
Questions
Answers
Results
```

Allow filtering by:

```text
Week
Topic
Difficulty
```

---

## Phase 3 — Document Pipeline

Add:

```text
PDF upload
Text extraction
OCR
Chunking
Metadata
Embeddings
Vector database
```

Goal:

> User material becomes searchable knowledge.

---

## Phase 4 — RAG

Add:

```text
Question
 ↓
Retriever
 ↓
Relevant lecture material
 ↓
LLM
 ↓
Grounded answer
```

Goal:

> AI answers based on the student's material.

---

## Phase 5 — Quiz Agent

Add:

```text
Quiz Agent
 ↓
RAG
 ↓
Generate question
 ↓
Evaluation Agent
 ↓
Store
```

---

## Phase 6 — Tutor Agent

Add conversational learning:

```text
Explain
 ↓
Question
 ↓
Student response
 ↓
Evaluation
 ↓
Hint
 ↓
Next question
```

---

## Phase 7 — Personalised Memory

Add:

```text
Learning history
Weak topics
Strong topics
Mistakes
Difficulty
```

Then adapt future quizzes.

---

## Phase 8 — Automatic Evaluation

Create an evaluation framework.

Test:

```text
Question quality
Answer correctness
RAG grounding
Agent success
Retrieval quality
```

Store metrics.

---

## Phase 9 — Advanced Agent Infrastructure

Add:

```text
Agent Orchestrator
Tool Registry
Memory
Skills
Agent state
Logging
Evaluation
```

---

## Phase 10 — Optional Coding Sandbox

Add:

```text
Coding questions
Code editor
Sandbox
Test runner
AI feedback
```

---

# 25. Testing Structure

Do not only test the API.

Test the AI system too.

```text
tests/
│
├── unit/
│   ├── test_quiz_service.py
│   ├── test_scoring.py
│   └── test_memory.py
│
├── integration/
│   ├── test_quiz_api.py
│   ├── test_documents.py
│   └── test_rag.py
│
└── evaluation/
    ├── test_question_quality.py
    ├── test_rag_grounding.py
    └── test_agent_outputs.py
```

This demonstrates engineering discipline rather than only AI experimentation.

---

# 26. Logging and Observability

Record agent activity.

Example:

```text
Agent Run

Agent: QuizAgent
Request ID: abc123

Step 1: Retrieved 5 chunks
Step 2: Generated question
Step 3: Evaluation score = 0.91
Step 4: Question accepted
Step 5: Saved to database
```

This makes debugging agent systems much easier.

---

# 27. Documentation Structure

Your GitHub repository should contain:

```text
docs/
│
├── architecture.md
├── agents.md
├── rag.md
├── ocr.md
├── memory.md
├── evaluation.md
├── api.md
├── database.md
├── prompts.md
└── development.md
```

Your README should contain:

```text
1. Project Overview
2. Features
3. Architecture
4. Agent Architecture
5. RAG Pipeline
6. Technology Stack
7. Screenshots
8. Installation
9. API Documentation
10. Evaluation Results
11. Future Improvements
```

---

# 28. What You Should Demonstrate in the README

Do not just say:

> "Uses RAG."

Show it.

For example:

```text
User Question
      ↓
Retriever
      ↓
Top 5 chunks
      ↓
LLM
      ↓
Grounded Answer
```

Then show an example.

Similarly, don't just say:

> "Uses an agent."

Show:

```text
User Request
      ↓
Orchestrator
      ↓
Study Agent
      ↓
Search Tool
      ↓
Memory Tool
      ↓
LLM
      ↓
Response
```

This makes your architecture understandable to recruiters.

---

# 29. Skills Demonstrated

The finished project should allow you to honestly say:

### AI / LLM

* Built LLM-powered applications
* Designed structured prompts
* Implemented RAG
* Used embeddings and vector search
* Built specialised AI agents
* Implemented LLM-based evaluation

### Agentic AI

* Agent orchestration
* Tool calling
* Agent state
* Personalised memory
* Multi-step workflows
* Automatic evaluation

### Python

* FastAPI
* Data processing
* AI pipelines
* Evaluation
* Backend services

### Web

* React
* TypeScript
* REST API
* Responsive UI

### Data

* PostgreSQL
* Vector database
* Document processing
* Metadata management

### Systems

* Layered architecture
* Logging
* Testing
* Evaluation
* Modular services

---

# 30. Final Project Architecture

The final version should look approximately like this:

```text
                         STUDYFORGE
                             │
                 ┌───────────┴───────────┐
                 │                       │
             FRONTEND                 BACKEND
          React + TS                 Python
                 │                  FastAPI
                 │                       │
                 └───────────┬───────────┘
                             │
                      API / WebSocket
                             │
                             ▼
                    AGENT ORCHESTRATOR
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
   Study Agent          Quiz Agent            Exam Agent
       │                     │                     │
       ▼                     ▼                     ▼
   Tutor Agent          Evaluation Agent     Analytics Agent
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                         TOOL LAYER
                             │
       ┌─────────────┬───────┼────────┬─────────────┐
       ▼             ▼       ▼        ▼             ▼
      RAG          Memory   Quiz    Evaluation   Analytics
       │             │       │        │             │
       ▼             ▼       ▼        ▼             ▼
  Vector DB      PostgreSQL PostgreSQL Evaluation DB
       │
       ▼
 Document Pipeline
       │
 ┌─────┴─────┐
 ▼           ▼
PDF         OCR
 │           │
 └─────┬─────┘
       ▼
 Text Extraction
       ↓
 Chunking
       ↓
 Embeddings
       ↓
 Vector Database
```

---

# 31. Recommended Technology Stack

### Frontend

```text
React
TypeScript
Tailwind CSS
```

### Backend

```text
Python
FastAPI
Pydantic
SQLAlchemy
```

### AI

```text
LLM API
LangGraph
LangChain or LlamaIndex
```

### RAG

```text
Embeddings
Vector database
Metadata filtering
Hybrid retrieval (future)
```

### OCR

```text
Tesseract
or PaddleOCR
```

### Database

```text
PostgreSQL
```

### Testing

```text
Pytest
```

### Deployment

```text
Vercel
+
Cloud backend
+
PostgreSQL
+
Vector database
```

---

# 32. The MVP

Do not attempt to build everything above immediately.

Your **first working version should only contain:**

```text
                STUDYFORGE MVP

                    User
                     │
                     ▼
                 React UI
                     │
                     ▼
                 FastAPI
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     Quiz Service          Document Service
          │                     │
          ▼                     ▼
     PostgreSQL             RAG Pipeline
                                │
                                ▼
                          Vector Database
                                │
                                ▼
                               LLM
```

Features:

1. Upload PDF
2. Extract text
3. Store document
4. Create embeddings
5. RAG search
6. Ask questions about material
7. Generate quiz
8. Take timed exam
9. Submit exam
10. Calculate score
11. Review answers

Then add the advanced agent features progressively.

---

# 33. Portfolio Description

A strong final resume description could eventually be:

**StudyForge — Agentic AI Exam & Personalised Learning Platform**

> Developed an agentic AI learning platform using Python, FastAPI, React, PostgreSQL and RAG to transform uploaded lecture materials into personalised exam simulations. Implemented document/OCR processing, vector retrieval, specialised study/quiz/tutor agents, tool calling, learning memory, adaptive difficulty and automated LLM-based evaluation to analyse student performance and generate grounded practice questions.

---

# 34. The Most Important Design Principle

The project should evolve like this:

```text
                 SIMPLE QUIZ
                     │
                     ▼
              AI QUIZ GENERATOR
                     │
                     ▼
                    RAG
                     │
                     ▼
                AI TUTOR
                     │
                     ▼
                  AGENTS
                     │
                     ▼
                 MEMORY
                     │
                     ▼
              AUTO EVALUATION
                     │
                     ▼
            ADAPTIVE LEARNING
                     │
                     ▼
             AGENT PLATFORM
```

This gives you a natural development story.

You don't need to pretend you implemented a massive AI infrastructure system on day one. You can show how you **identified a problem, built a basic system, then progressively introduced RAG, agents, tools, memory, evaluation and adaptive behaviour**.

That development progression itself demonstrates the **proactive learning, system design and problem-solving ability** described in the job requirements.
