from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.quiz import QuizCreateRequest, QuizPublic, QuizSubmitRequest
from app.services import quiz_service

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


@router.post("", response_model=QuizPublic)
def create_quiz(request: QuizCreateRequest, db: Session = Depends(get_db)):
    return quiz_service.create_quiz(db, request)


@router.get("/{quiz_id}", response_model=QuizPublic)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    return quiz_service.get_quiz(db, quiz_id)


@router.post("/{quiz_id}/submit", response_model=QuizPublic)
def submit_quiz(quiz_id: int, request: QuizSubmitRequest, db: Session = Depends(get_db)):
    return quiz_service.submit_quiz(db, quiz_id, request)
