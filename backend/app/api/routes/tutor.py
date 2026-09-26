from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.tutor import (
    TutorAnswerRequest,
    TutorAnswerResponse,
    TutorHintResponse,
    TutorSessionCreateRequest,
    TutorSessionPublic,
)
from app.services import tutor_service

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


@router.post("/sessions", response_model=TutorSessionPublic)
def create_session(request: TutorSessionCreateRequest, db: Session = Depends(get_db)):
    return tutor_service.create_session(db, request)


@router.get("/sessions/{session_id}", response_model=TutorSessionPublic)
def get_session(session_id: int, db: Session = Depends(get_db)):
    return tutor_service.get_session(db, session_id)


@router.post("/sessions/{session_id}/answer", response_model=TutorAnswerResponse)
def submit_answer(session_id: int, request: TutorAnswerRequest, db: Session = Depends(get_db)):
    return tutor_service.submit_answer(db, session_id, request)


@router.post("/sessions/{session_id}/hint", response_model=TutorHintResponse)
def get_hint(session_id: int, db: Session = Depends(get_db)):
    return TutorHintResponse(hint=tutor_service.get_hint(db, session_id))
