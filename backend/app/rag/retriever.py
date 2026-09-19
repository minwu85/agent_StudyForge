from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.rag import vector_store
from app.rag.embeddings import embed_query


@dataclass
class RetrievedChunk:
    document_id: int
    document_filename: str
    page_number: int | None
    content: str
    similarity: float


def retrieve(db: Session, question: str, course_id: int | None = None, top_k: int = 5) -> list[RetrievedChunk]:
    query_embedding = embed_query(question)
    results = vector_store.search_chunks(db, query_embedding, course_id=course_id, top_k=top_k)
    return [
        RetrievedChunk(
            document_id=chunk.document_id,
            document_filename=chunk.document.filename,
            page_number=chunk.page_number,
            content=chunk.content,
            similarity=max(0.0, 1.0 - distance),
        )
        for chunk, distance in results
    ]
