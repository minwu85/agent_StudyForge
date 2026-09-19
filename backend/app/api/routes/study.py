from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.study import StudyChatRequest, StudyChatResponse
from app.services import study_service

router = APIRouter(prefix="/api/study", tags=["study"])


@router.post("/chat", response_model=StudyChatResponse)
def chat(request: StudyChatRequest, db: Session = Depends(get_db)):
    return study_service.ask(db, request)
