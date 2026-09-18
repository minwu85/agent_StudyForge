from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Course


def list_courses(db: Session) -> list[Course]:
    return db.execute(select(Course).order_by(Course.name)).scalars().all()


def get_by_id(db: Session, course_id: int) -> Course | None:
    return db.get(Course, course_id)
