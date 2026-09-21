from pydantic import BaseModel, ConfigDict

from app.models.question import AnswerOption, Difficulty


class QuestionPublic(BaseModel):
    """Question shape shown to a student while a quiz is in progress (no answer/explanation)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    topic: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    difficulty: Difficulty


class QuestionWithAnswer(QuestionPublic):
    correct_answer: AnswerOption
    explanation: str
    source_document_id: int | None = None


class TopicSummary(BaseModel):
    topic: str
    question_count: int
    difficulties: list[Difficulty]
