import enum
from datetime import datetime, timezone

from sqlalchemy import JSON, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.models.question import AnswerOption


class QuizStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)
    topic: Mapped[str | None] = mapped_column(String(120), nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(20), nullable=True)
    week_ids: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    question_count: Mapped[int]
    time_limit_minutes: Mapped[int | None] = mapped_column(nullable=True)
    status: Mapped[QuizStatus] = mapped_column(Enum(QuizStatus), default=QuizStatus.IN_PROGRESS)
    score: Mapped[int | None] = mapped_column(nullable=True)
    started_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    quiz_questions: Mapped[list["QuizQuestion"]] = relationship(
        back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.question_order"
    )


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    question_order: Mapped[int]
    selected_answer: Mapped[AnswerOption | None] = mapped_column(Enum(AnswerOption), nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(nullable=True)
    flagged: Mapped[bool] = mapped_column(default=False)

    quiz: Mapped["Quiz"] = relationship(back_populates="quiz_questions")
    question: Mapped["Question"] = relationship()
