from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.quiz import Quiz, QuizQuestion, QuizStatus


def completed_quizzes(db: Session) -> list[Quiz]:
    return (
        db.execute(select(Quiz).where(Quiz.status == QuizStatus.COMPLETED).order_by(Quiz.completed_at))
        .scalars()
        .all()
    )


def topic_correctness_rows(db: Session) -> list[tuple[str, bool | None]]:
    return db.execute(
        select(Question.topic, QuizQuestion.is_correct)
        .join(QuizQuestion, QuizQuestion.question_id == Question.id)
        .join(Quiz, Quiz.id == QuizQuestion.quiz_id)
        .where(Quiz.status == QuizStatus.COMPLETED)
    ).all()
