from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.question import AnswerOption, Difficulty
from app.models.quiz import QuizStatus
from app.schemas.question import QuestionPublic, QuestionWithAnswer


class QuizCreateRequest(BaseModel):
    topic: str | None = None
    difficulty: Difficulty | None = None
    week_ids: list[int] | None = None
    question_count: int = 10
    time_limit_minutes: int | None = None


class QuestionGenerationRequest(BaseModel):
    course_id: int
    week_ids: list[int] | None = None
    topic: str | None = None
    difficulty: Difficulty = Difficulty.MEDIUM
    question_count: int = 5


class RejectedCandidatePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_filename: str
    page_number: int | None
    reason: str


class QuestionGenerationResponse(BaseModel):
    requested: int
    accepted: list[QuestionWithAnswer]
    rejected: list[RejectedCandidatePublic]


class QuizQuestionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_order: int
    selected_answer: AnswerOption | None
    flagged: bool
    question: QuestionPublic


class QuizPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic: str | None
    difficulty: str | None
    week_ids: list[int] | None
    question_count: int
    time_limit_minutes: int | None
    status: QuizStatus
    started_at: datetime
    quiz_questions: list[QuizQuestionPublic]


class AnswerSubmission(BaseModel):
    question_id: int
    selected_answer: AnswerOption | None = None
    flagged: bool = False


class QuizSubmitRequest(BaseModel):
    answers: list[AnswerSubmission]
