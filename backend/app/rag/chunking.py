import re
from dataclasses import dataclass

from app.rag.extractor import ExtractedPage

CHUNK_SIZE_CHARS = 800
CHUNK_OVERLAP_CHARS = 150


@dataclass
class Chunk:
    content: str
    page_number: int | None


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _chunk_single_text(text: str) -> list[str]:
    words = text.split()
    if not words:
        return []

    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for word in words:
        current.append(word)
        current_len += len(word) + 1
        if current_len >= CHUNK_SIZE_CHARS:
            chunks.append(" ".join(current))
            # carry the trailing ~CHUNK_OVERLAP_CHARS worth of words into the next chunk
            overlap_words: list[str] = []
            overlap_len = 0
            for w in reversed(current):
                overlap_len += len(w) + 1
                overlap_words.insert(0, w)
                if overlap_len >= CHUNK_OVERLAP_CHARS:
                    break
            current = overlap_words
            current_len = overlap_len

    if current:
        chunks.append(" ".join(current))

    return chunks


def chunk_pages(pages: list[ExtractedPage]) -> list[Chunk]:
    """Chunks each page's text independently so every chunk keeps a single, accurate page_number."""
    result: list[Chunk] = []
    for page in pages:
        for piece in _chunk_single_text(_clean(page.text)):
            result.append(Chunk(content=piece, page_number=page.page_number))
    return result
