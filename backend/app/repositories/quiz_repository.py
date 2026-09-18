from sqlalchemy.orm import Session, joinedload

from app.models.quiz import Quiz, QuizQuestion


def create(db: Session, quiz: Quiz) -> Quiz:
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def get_by_id(db: Session, quiz_id: int) -> Quiz | None:
    return (
        db.query(Quiz)
        .options(joinedload(Quiz.quiz_questions).joinedload(QuizQuestion.question))
        .filter(Quiz.id == quiz_id)
        .first()
    )


def save(db: Session, quiz: Quiz) -> Quiz:
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz
