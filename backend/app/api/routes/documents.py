from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.document import ChunkSearchRequest, ChunkSearchResult, DocumentPublic
from app.services import document_service

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentPublic)
async def upload_document(
    course_id: int = Form(...),
    week_id: int | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await document_service.upload_document(db, course_id, week_id, file)


@router.get("", response_model=list[DocumentPublic])
def list_documents(course_id: int | None = None, db: Session = Depends(get_db)):
    return document_service.list_documents(db, course_id=course_id)


@router.get("/{document_id}", response_model=DocumentPublic)
def get_document(document_id: int, db: Session = Depends(get_db)):
    return document_service.get_document(db, document_id)


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document_service.delete_document(db, document_id)


@router.post("/search", response_model=list[ChunkSearchResult])
def search_documents(request: ChunkSearchRequest, db: Session = Depends(get_db)):
    return document_service.search_chunks(db, request)
