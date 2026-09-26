from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.agents import tutor_agent
from app.models.question import AnswerOption
from app.models.tutor import TutorSession, TutorSessionStatus, TutorTurn
from app.repositories import tutor_repository
from app.schemas.tutor import TutorAnswerRequest, TutorAnswerResponse, TutorSessionCreateRequest


def _turn_from_generated(session: TutorSession, generated: tutor_agent.GeneratedTurn, turn_order: int) -> TutorTurn:
    correct_index = generated.options.index(generated.correct_answer)
    letters = list(AnswerOption)
    return TutorTurn(
        turn_order=turn_order,
        explanation=generated.explanation,
        question_text=generated.question_text,
        option_a=generated.options[0],
        option_b=generated.options[1],
        option_c=generated.options[2],
        option_d=generated.options[3],
        correct_answer=letters[correct_index],
        difficulty_at_time=session.difficulty,
        document_filename=generated.document_filename,
        page_number=generated.page_number,
        chunk_id=generated.chunk_id,
    )


def create_session(db: Session, request: TutorSessionCreateRequest) -> TutorSession:
    session = TutorSession(course_id=request.course_id, week_ids=request.week_ids, topic=request.topic)

    generated = tutor_agent.generate_turn(db, request.course_id, request.week_ids, exclude_chunk_ids=[])
    if generated is None:
        raise HTTPException(status_code=404, detail="No processed documents found for the selected weeks")

    session.used_chunk_ids = [generated.chunk_id]
    session.turns = [_turn_from_generated(session, generated, turn_order=0)]
    return tutor_repository.save(db, session)


def get_session(db: Session, session_id: int) -> TutorSession:
    session = tutor_repository.get_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Tutor session not found")
    return session


def submit_answer(db: Session, session_id: int, request: TutorAnswerRequest) -> TutorAnswerResponse:
    session = get_session(db, session_id)
    if session.status != TutorSessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="This tutor session has already ended")

    current_turn = session.turns[-1]
    if current_turn.student_answer is not None:
        raise HTTPException(status_code=400, detail="This question has already been answered")

    is_correct = request.selected_answer == current_turn.correct_answer
    current_turn.student_answer = request.selected_answer
    current_turn.is_correct = is_correct

    session.questions_asked += 1
    if is_correct:
        session.questions_correct += 1
        session.correct_streak += 1
        session.incorrect_streak = 0
    else:
        session.incorrect_streak += 1
        session.correct_streak = 0

    previous_difficulty = session.difficulty
    new_difficulty = tutor_agent.adapt_difficulty(session.difficulty, session.correct_streak, session.incorrect_streak)
    difficulty_changed = new_difficulty != previous_difficulty
    if difficulty_changed:
        session.correct_streak = 0
        session.incorrect_streak = 0
    session.difficulty = new_difficulty

    generated = tutor_agent.generate_turn(db, session.course_id, session.week_ids, exclude_chunk_ids=session.used_chunk_ids)
    if generated is None:
        session.status = TutorSessionStatus.ENDED
    else:
        session.used_chunk_ids = [*session.used_chunk_ids, generated.chunk_id]
        session.turns.append(_turn_from_generated(session, generated, turn_order=len(session.turns)))

    session = tutor_repository.save(db, session)

    return TutorAnswerResponse(
        is_correct=is_correct,
        correct_answer=current_turn.correct_answer,
        previous_difficulty=previous_difficulty,
        new_difficulty=new_difficulty,
        difficulty_changed=difficulty_changed,
        session=session,
    )


def get_hint(db: Session, session_id: int) -> str:
    session = get_session(db, session_id)
    if session.status != TutorSessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="This tutor session has already ended")

    current_turn = session.turns[-1]
    if current_turn.student_answer is not None:
        raise HTTPException(status_code=400, detail="This question has already been answered")

    options = [current_turn.option_a, current_turn.option_b, current_turn.option_c, current_turn.option_d]
    letters = list(AnswerOption)
    answer = options[letters.index(current_turn.correct_answer)]

    current_turn.hint_used = True
    tutor_repository.save_turn(db, current_turn)
    return tutor_agent.build_hint(answer)
