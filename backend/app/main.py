from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import courses, questions, quizzes, results
from app.config import settings

app = FastAPI(title="StudyForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses.router)
app.include_router(questions.router)
app.include_router(quizzes.router)
app.include_router(results.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
