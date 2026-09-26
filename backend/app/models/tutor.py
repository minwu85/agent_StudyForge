import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.models.question import AnswerOption, Difficulty

if TYPE_CHECKING:
    from app.models.course import Course


class TutorSessionStatus(str, enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"


class TutorSession(Base):
    """One adaptive tutoring loop (roadmap section 5.3): explain -> question -> evaluate ->
    hint -> next question, with difficulty adjusted by the student's recent accuracy."""

    __tablename__ = "tutor_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    week_ids: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    topic: Mapped[str | None] = mapped_column(String(120), nullable=True)
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty), default=Difficulty.MEDIUM)
    correct_streak: Mapped[int] = mapped_column(Integer, default=0)
    incorrect_streak: Mapped[int] = mapped_column(Integer, default=0)
    questions_asked: Mapped[int] = mapped_column(Integer, default=0)
    questions_correct: Mapped[int] = mapped_column(Integer, default=0)
    used_chunk_ids: Mapped[list[int]] = mapped_column(JSON, default=list)
    status: Mapped[TutorSessionStatus] = mapped_column(Enum(TutorSessionStatus), default=TutorSessionStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    course: Mapped["Course"] = relationship()
    turns: Mapped[list["TutorTurn"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="TutorTurn.turn_order"
    )


class TutorTurn(Base):
    """One explain+question step within a TutorSession."""

    __tablename__ = "tutor_turns"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("tutor_sessions.id"), index=True)
    turn_order: Mapped[int]
    explanation: Mapped[str] = mapped_column(Text)
    question_text: Mapped[str] = mapped_column(Text)
    option_a: Mapped[str] = mapped_column(Text)
    option_b: Mapped[str] = mapped_column(Text)
    option_c: Mapped[str] = mapped_column(Text)
    option_d: Mapped[str] = mapped_column(Text)
    correct_answer: Mapped[AnswerOption] = mapped_column(Enum(AnswerOption))
    difficulty_at_time: Mapped[Difficulty] = mapped_column(Enum(Difficulty))
    document_filename: Mapped[str] = mapped_column(String(255))
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_id: Mapped[int] = mapped_column(Integer)
    student_answer: Mapped[AnswerOption | None] = mapped_column(Enum(AnswerOption), nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(nullable=True)
    hint_used: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    session: Mapped["TutorSession"] = relationship(back_populates="turns")
