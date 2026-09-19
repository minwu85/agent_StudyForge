from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.progress import ProgressSummary
from app.services import progress_service

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("", response_model=ProgressSummary)
def get_progress(db: Session = Depends(get_db)):
    return progress_service.get_progress(db)
