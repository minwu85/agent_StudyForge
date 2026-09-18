from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.quiz import QuizStatus
from app.repositories import quiz_repository
from app.schemas.result import ResultSummary, ReviewItem, ReviewResponse


def get_result_summary(db: Session, quiz_id: int) -> ResultSummary:
    quiz = quiz_repository.get_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.status != QuizStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Quiz has not been submitted yet")

    time_taken_seconds = None
    if quiz.completed_at:
        time_taken_seconds = int((quiz.completed_at - quiz.started_at).total_seconds())

    return ResultSummary(
        quiz_id=quiz.id,
        question_count=quiz.question_count,
        correct_count=quiz.score or 0,
        score_percentage=round(100 * (quiz.score or 0) / quiz.question_count, 1),
        started_at=quiz.started_at,
        completed_at=quiz.completed_at,
        time_taken_seconds=time_taken_seconds,
    )


def get_review(db: Session, quiz_id: int) -> ReviewResponse:
    quiz = quiz_repository.get_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.status != QuizStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Quiz has not been submitted yet")

    items = [
        ReviewItem(
            question_order=qq.question_order,
            selected_answer=qq.selected_answer,
            is_correct=qq.is_correct,
            flagged=qq.flagged,
            question=qq.question,
        )
        for qq in quiz.quiz_questions
    ]
    return ReviewResponse(quiz_id=quiz.id, items=items)
