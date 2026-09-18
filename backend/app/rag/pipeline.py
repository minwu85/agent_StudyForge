from sqlalchemy.orm import Session

from app.models.document import Document, DocumentStatus
from app.rag import vector_store
from app.rag.chunking import chunk_pages
from app.rag.embeddings import embed_texts
from app.rag.extractor import extract_pdf_pages


def process_document(db: Session, document: Document) -> None:
    """Extracts text, chunks it, embeds each chunk, and stores it — mutates `document` in place
    with the resulting status/counts. Does not commit; the caller controls the transaction."""
    document.status = DocumentStatus.PROCESSING

    pages, pages_needing_ocr = extract_pdf_pages(document.storage_path)
    chunks = chunk_pages(pages)

    if chunks:
        embeddings = embed_texts([chunk.content for chunk in chunks])
        vector_store.save_chunks(
            db,
            document,
            contents=[chunk.content for chunk in chunks],
            page_numbers=[chunk.page_number for chunk in chunks],
            embeddings=embeddings,
        )

    document.page_count = len(pages) + pages_needing_ocr
    document.pages_needing_ocr = pages_needing_ocr
    document.chunk_count = len(chunks)
    document.status = DocumentStatus.READY
