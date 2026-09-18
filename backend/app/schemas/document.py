from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.document import DocumentStatus


class DocumentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    week_id: int | None
    filename: str
    file_type: str
    status: DocumentStatus
    page_count: int | None
    pages_needing_ocr: int
    chunk_count: int
    error_message: str | None
    created_at: datetime


class ChunkSearchResult(BaseModel):
    document_id: int
    document_filename: str
    page_number: int | None
    content: str
    similarity: float


class ChunkSearchRequest(BaseModel):
    query: str
    course_id: int | None = None
    top_k: int = 5
