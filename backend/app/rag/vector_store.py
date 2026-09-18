from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.document import Document, DocumentChunk


def save_chunks(db: Session, document: Document, contents: list[str], page_numbers: list[int | None], embeddings: list[list[float]]) -> None:
    db.add_all(
        DocumentChunk(document_id=document.id, chunk_index=index, page_number=page_number, content=content, embedding=embedding)
        for index, (content, page_number, embedding) in enumerate(zip(contents, page_numbers, embeddings))
    )


def search_chunks(
    db: Session, query_embedding: list[float], course_id: int | None = None, top_k: int = 5
) -> list[tuple[DocumentChunk, float]]:
    """Nearest chunks to `query_embedding` by cosine distance (0 = identical, 2 = opposite)."""
    distance = DocumentChunk.embedding.cosine_distance(query_embedding).label("distance")
    query = select(DocumentChunk, distance).options(joinedload(DocumentChunk.document))
    if course_id is not None:
        query = query.join(Document, DocumentChunk.document_id == Document.id).where(Document.course_id == course_id)
    query = query.order_by(distance).limit(top_k)
    return [(chunk, dist) for chunk, dist in db.execute(query).all()]
