from dataclasses import dataclass

from pypdf import PdfReader

from app.ocr.processor import page_needs_ocr


@dataclass
class ExtractedPage:
    page_number: int  # 1-indexed
    text: str


def extract_pdf_pages(file_path: str) -> tuple[list[ExtractedPage], int]:
    """Returns extracted pages (text-based ones only) and a count of pages skipped as scanned/image-only."""
    reader = PdfReader(file_path)
    pages: list[ExtractedPage] = []
    skipped = 0

    for index, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if page_needs_ocr(text):
            skipped += 1
            continue
        pages.append(ExtractedPage(page_number=index, text=text))

    return pages, skipped
