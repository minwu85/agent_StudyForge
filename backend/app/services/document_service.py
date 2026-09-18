import os
import uuid

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.models.document import Document, DocumentStatus
from app.rag import vector_store
from app.rag.embeddings import embed_query
from app.rag.pipeline import process_document
from app.repositories import document_repository
from app.schemas.document import ChunkSearchRequest, ChunkSearchResult

ALLOWED_EXTENSIONS = {".pdf"}


async def upload_document(db: Session, course_id: int, week_id: int | None, file: UploadFile) -> Document:
    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{extension}'. Only PDF is supported today.")

    os.makedirs(settings.storage_dir, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{extension}"
    storage_path = os.path.join(settings.storage_dir, stored_name)
    with open(storage_path, "wb") as out:
        out.write(await file.read())

    document = Document(
        course_id=course_id,
        week_id=week_id,
        filename=file.filename or stored_name,
        file_type=extension.lstrip("."),
        storage_path=storage_path,
        status=DocumentStatus.PENDING,
    )
    db.add(document)
    db.flush()  # assigns document.id

    try:
        process_document(db, document)
        db.commit()
    except Exception as exc:
        db.rollback()
        document.status = DocumentStatus.FAILED
        document.error_message = str(exc)
        db.add(document)
        db.commit()

    db.refresh(document)
    return document


def list_documents(db: Session, course_id: int | None = None) -> list[Document]:
    return document_repository.list_documents(db, course_id=course_id)


def get_document(db: Session, document_id: int) -> Document:
    document = document_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


def delete_document(db: Session, document_id: int) -> None:
    document = get_document(db, document_id)
    storage_path = document.storage_path
    document_repository.delete(db, document)
    if os.path.exists(storage_path):
        os.remove(storage_path)


def search_chunks(db: Session, request: ChunkSearchRequest) -> list[ChunkSearchResult]:
    query_embedding = embed_query(request.query)
    results = vector_store.search_chunks(db, query_embedding, course_id=request.course_id, top_k=request.top_k)
    return [
        ChunkSearchResult(
            document_id=chunk.document_id,
            document_filename=chunk.document.filename,
            page_number=chunk.page_number,
            content=chunk.content,
            similarity=max(0.0, 1.0 - distance),
        )
        for chunk, distance in results
    ]
