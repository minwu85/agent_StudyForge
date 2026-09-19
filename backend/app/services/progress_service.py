from sqlalchemy.orm import Session

from app.repositories import progress_repository
from app.schemas.progress import ProgressSummary, ScoreTrendPoint, TopicAccuracy


def get_progress(db: Session) -> ProgressSummary:
    quizzes = progress_repository.completed_quizzes(db)
    trend = [
        ScoreTrendPoint(
            quiz_id=quiz.id,
            completed_at=quiz.completed_at,
            score_percentage=round(100 * (quiz.score or 0) / quiz.question_count, 1),
        )
        for quiz in quizzes
    ]
    average = round(sum(point.score_percentage for point in trend) / len(trend), 1) if trend else 0.0

    by_topic: dict[str, dict[str, int]] = {}
    for topic, is_correct in progress_repository.topic_correctness_rows(db):
        if is_correct is None:
            continue
        entry = by_topic.setdefault(topic, {"correct": 0, "total": 0})
        entry["total"] += 1
        if is_correct:
            entry["correct"] += 1

    topic_accuracy = [
        TopicAccuracy(
            topic=topic,
            accuracy_percentage=round(100 * data["correct"] / data["total"], 1),
            attempts=data["total"],
        )
        for topic, data in sorted(by_topic.items())
    ]

    return ProgressSummary(
        total_quizzes=len(quizzes),
        average_score_percentage=average,
        score_trend=trend,
        topic_accuracy=topic_accuracy,
    )
