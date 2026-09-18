from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    weeks: Mapped[list["Week"]] = relationship(
        back_populates="course", cascade="all, delete-orphan", order_by="Week.week_number"
    )


class Week(Base):
    __tablename__ = "weeks"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    week_number: Mapped[int]
    title: Mapped[str] = mapped_column(String(200))

    course: Mapped["Course"] = relationship(back_populates="weeks")
