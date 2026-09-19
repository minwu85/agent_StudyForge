from sqlalchemy.orm import Session

from app.prompts.study_prompts import build_study_prompt
from app.rag.generation import STUB_MODEL_NAME, generate_answer
from app.rag.retriever import retrieve
from app.schemas.study import SourceExcerpt, StudyChatRequest, StudyChatResponse


def ask(db: Session, request: StudyChatRequest) -> StudyChatResponse:
    chunks = retrieve(db, request.question, course_id=request.course_id, top_k=request.top_k)
    prompt = build_study_prompt(request.question, chunks)
    answer = generate_answer(chunks)

    return StudyChatResponse(
        question=request.question,
        answer=answer,
        model=STUB_MODEL_NAME,
        sources=[
            SourceExcerpt(
                document_id=c.document_id,
                document_filename=c.document_filename,
                page_number=c.page_number,
                similarity=c.similarity,
                excerpt=c.content,
            )
            for c in chunks
        ],
        prompt=prompt,
    )
