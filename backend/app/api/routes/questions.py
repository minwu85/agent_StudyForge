from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories import question_repository
from app.schemas.question import TopicSummary

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.get("/topics", response_model=list[TopicSummary])
def get_topics(db: Session = Depends(get_db)):
    topics = question_repository.list_topics(db)
    return [
        TopicSummary(topic=topic, question_count=count, difficulties=difficulties)
        for topic, count, difficulties in topics
    ]
