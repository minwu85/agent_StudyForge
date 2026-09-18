from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.question import Difficulty, Question


def list_topics(db: Session) -> list[tuple[str, int, list[Difficulty]]]:
    rows = db.execute(
        select(Question.topic, Question.difficulty).order_by(Question.topic)
    ).all()

    topics: dict[str, dict] = {}
    for topic, difficulty in rows:
        entry = topics.setdefault(topic, {"count": 0, "difficulties": set()})
        entry["count"] += 1
        entry["difficulties"].add(difficulty)

    return [
        (topic, data["count"], sorted(data["difficulties"], key=lambda d: d.value))
        for topic, data in topics.items()
    ]


def random_questions(
    db: Session,
    count: int,
    topic: str | None = None,
    difficulty: Difficulty | None = None,
) -> list[Question]:
    query = select(Question)
    if topic:
        query = query.where(Question.topic == topic)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)
    query = query.order_by(func.random()).limit(count)
    return db.execute(query).scalars().all()
