from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Week
from app.models.question import Difficulty, Question


def list_weeks_with_counts(db: Session, course_id: int) -> list[tuple[Week, int, list[Difficulty]]]:
    weeks = (
        db.execute(select(Week).where(Week.course_id == course_id).order_by(Week.week_number))
        .scalars()
        .all()
    )

    rows = db.execute(
        select(Question.week_id, Question.difficulty).where(Question.course_id == course_id)
    ).all()
    counts: dict[int, dict] = {}
    for week_id, difficulty in rows:
        entry = counts.setdefault(week_id, {"count": 0, "difficulties": set()})
        entry["count"] += 1
        entry["difficulties"].add(difficulty)

    return [
        (
            week,
            counts.get(week.id, {}).get("count", 0),
            sorted(counts.get(week.id, {}).get("difficulties", set()), key=lambda d: d.value),
        )
        for week in weeks
    ]
