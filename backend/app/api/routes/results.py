from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.result import ResultSummary, ReviewResponse
from app.services import result_service

router = APIRouter(prefix="/api/results", tags=["results"])


@router.get("/{quiz_id}", response_model=ResultSummary)
def get_result(quiz_id: int, db: Session = Depends(get_db)):
    return result_service.get_result_summary(db, quiz_id)


@router.get("/{quiz_id}/review", response_model=ReviewResponse)
def get_review(quiz_id: int, db: Session = Depends(get_db)):
    return result_service.get_review(db, quiz_id)
