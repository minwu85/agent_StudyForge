from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.document import Document


def save(db: Session, document: Document) -> Document:
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_by_id(db: Session, document_id: int) -> Document | None:
    return db.get(Document, document_id)


def list_documents(db: Session, course_id: int | None = None) -> list[Document]:
    query = select(Document).options(joinedload(Document.week)).order_by(Document.created_at.desc())
    if course_id is not None:
        query = query.where(Document.course_id == course_id)
    return db.execute(query).unique().scalars().all()


def delete(db: Session, document: Document) -> None:
    db.delete(document)
    db.commit()
