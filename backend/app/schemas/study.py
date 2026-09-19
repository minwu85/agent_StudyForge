from pydantic import BaseModel


class StudyChatRequest(BaseModel):
    question: str
    course_id: int
    top_k: int = 4


class SourceExcerpt(BaseModel):
    document_id: int
    document_filename: str
    page_number: int | None
    similarity: float
    excerpt: str


class StudyChatResponse(BaseModel):
    question: str
    answer: str
    model: str
    sources: list[SourceExcerpt]
    prompt: str
