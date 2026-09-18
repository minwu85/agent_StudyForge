import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base

if TYPE_CHECKING:
    from app.models.course import Course, Week


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class AnswerOption(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    week_id: Mapped[int] = mapped_column(ForeignKey("weeks.id"), index=True)
    topic: Mapped[str] = mapped_column(String(120), index=True)
    question_text: Mapped[str] = mapped_column(Text)
    option_a: Mapped[str] = mapped_column(Text)
    option_b: Mapped[str] = mapped_column(Text)
    option_c: Mapped[str] = mapped_column(Text)
    option_d: Mapped[str] = mapped_column(Text)
    correct_answer: Mapped[AnswerOption] = mapped_column(Enum(AnswerOption))
    explanation: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty), index=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    course: Mapped["Course"] = relationship()
    week: Mapped["Week"] = relationship()
