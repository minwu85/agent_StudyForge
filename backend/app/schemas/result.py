from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.question import AnswerOption
from app.schemas.question import QuestionWithAnswer


class ResultSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    quiz_id: int
    question_count: int
    correct_count: int
    score_percentage: float
    started_at: datetime
    completed_at: datetime | None
    time_taken_seconds: int | None


class ReviewItem(BaseModel):
    question_order: int
    selected_answer: AnswerOption | None
    is_correct: bool | None
    flagged: bool
    question: QuestionWithAnswer


class ReviewResponse(BaseModel):
    quiz_id: int
    items: list[ReviewItem]
