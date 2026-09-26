from sqlalchemy.orm import Session, joinedload

from app.models.tutor import TutorSession, TutorTurn


def save(db: Session, session: TutorSession) -> TutorSession:
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_by_id(db: Session, session_id: int) -> TutorSession | None:
    return (
        db.query(TutorSession)
        .options(joinedload(TutorSession.turns))
        .filter(TutorSession.id == session_id)
        .first()
    )


def save_turn(db: Session, turn: TutorTurn) -> TutorTurn:
    db.add(turn)
    db.commit()
    db.refresh(turn)
    return turn
