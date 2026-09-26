from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.question import AnswerOption, Difficulty
from app.models.tutor import TutorSessionStatus


class TutorSessionCreateRequest(BaseModel):
    course_id: int
    week_ids: list[int] | None = None
    topic: str | None = None


class TutorTurnPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    turn_order: int
    explanation: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    difficulty_at_time: Difficulty
    document_filename: str
    page_number: int | None
    student_answer: AnswerOption | None
    is_correct: bool | None
    hint_used: bool


class TutorSessionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    topic: str | None
    difficulty: Difficulty
    correct_streak: int
    incorrect_streak: int
    questions_asked: int
    questions_correct: int
    status: TutorSessionStatus
    created_at: datetime
    turns: list[TutorTurnPublic]


class TutorAnswerRequest(BaseModel):
    selected_answer: AnswerOption


class TutorAnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: AnswerOption
    previous_difficulty: Difficulty
    new_difficulty: Difficulty
    difficulty_changed: bool
    session: TutorSessionPublic


class TutorHintResponse(BaseModel):
    hint: str
