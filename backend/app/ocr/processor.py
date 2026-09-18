"""OCR extension point.

Not implemented yet (see docs/backend.md, Phase 3) — text-based PDFs cover the common case for
now. A scanned/image-only page is detected and skipped rather than silently ignored, so
`Document.pages_needing_ocr` tells you when this module needs to be filled in.

When implemented, `extract_text_from_image(page)` should render the page to an image (e.g. via
`pypdfium2` or `pdf2image`) and run it through an OCR engine (Tesseract via `pytesseract`, or
PaddleOCR/EasyOCR), returning the recognized text.
"""

MIN_CHARS_PER_PAGE = 20
"""Below this many extracted characters, a page is treated as scanned/image-only."""


def page_needs_ocr(extracted_text: str) -> bool:
    return len(extracted_text.strip()) < MIN_CHARS_PER_PAGE


def extract_text_from_image(page_number: int) -> str:
    raise NotImplementedError(
        f"Page {page_number} appears to be scanned/image-only and OCR is not implemented yet."
    )
