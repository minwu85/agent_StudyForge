from datetime import datetime

from pydantic import BaseModel


class ScoreTrendPoint(BaseModel):
    quiz_id: int
    completed_at: datetime | None
    score_percentage: float


class TopicAccuracy(BaseModel):
    topic: str
    accuracy_percentage: float
    attempts: int


class ProgressSummary(BaseModel):
    total_quizzes: int
    average_score_percentage: float
    score_trend: list[ScoreTrendPoint]
    topic_accuracy: list[TopicAccuracy]
