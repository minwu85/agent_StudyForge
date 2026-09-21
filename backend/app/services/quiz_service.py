from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.agents import quiz_agent
from app.models.quiz import Quiz, QuizQuestion, QuizStatus
from app.repositories import question_repository, quiz_repository
from app.schemas.quiz import QuestionGenerationRequest, QuestionGenerationResponse, QuizCreateRequest, QuizSubmitRequest


def create_quiz(db: Session, request: QuizCreateRequest) -> Quiz:
    questions = question_repository.random_questions(
        db,
        count=request.question_count,
        topic=request.topic,
        difficulty=request.difficulty,
        week_ids=request.week_ids,
    )
    if not questions:
        raise HTTPException(status_code=404, detail="No questions match the selected filters")

    quiz = Quiz(
        topic=request.topic,
        difficulty=request.difficulty.value if request.difficulty else None,
        week_ids=request.week_ids,
        question_count=len(questions),
        time_limit_minutes=request.time_limit_minutes,
        status=QuizStatus.IN_PROGRESS,
    )
    quiz.quiz_questions = [
        QuizQuestion(question_id=question.id, question_order=index)
        for index, question in enumerate(questions)
    ]
    return quiz_repository.save(db, quiz)


def generate_questions(db: Session, request: QuestionGenerationRequest) -> QuestionGenerationResponse:
    result = quiz_agent.generate_questions(
        db,
        course_id=request.course_id,
        week_ids=request.week_ids,
        topic=request.topic,
        difficulty=request.difficulty,
        question_count=request.question_count,
    )
    stored = question_repository.save_all(db, result.questions) if result.questions else []
    return QuestionGenerationResponse(
        requested=result.requested,
        accepted=stored,
        rejected=result.rejected,
    )


def get_quiz(db: Session, quiz_id: int) -> Quiz:
    quiz = quiz_repository.get_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


def submit_quiz(db: Session, quiz_id: int, request: QuizSubmitRequest) -> Quiz:
    quiz = get_quiz(db, quiz_id)
    if quiz.status == QuizStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    answers_by_question = {answer.question_id: answer for answer in request.answers}
    correct_count = 0
    for quiz_question in quiz.quiz_questions:
        answer = answers_by_question.get(quiz_question.question_id)
        if answer is None:
            continue
        quiz_question.selected_answer = answer.selected_answer
        quiz_question.flagged = answer.flagged
        quiz_question.is_correct = (
            answer.selected_answer is not None
            and answer.selected_answer == quiz_question.question.correct_answer
        )
        if quiz_question.is_correct:
            correct_count += 1

    quiz.status = QuizStatus.COMPLETED
    quiz.score = correct_count
    quiz.completed_at = datetime.now(timezone.utc)
    return quiz_repository.save(db, quiz)
