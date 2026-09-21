"""Quiz Agent (roadmap section 5.2): RAG -> generate question -> Evaluation Agent -> store.

Question generation is a documented stub, for the same reason Phase 4's `rag/generation.py`
stubs the Study Agent's answer: no LLM is wired up yet (no API key/cost). Instead of calling a
model, it builds cloze ("fill in the blank") multiple-choice questions directly from the
student's own uploaded material using a local heuristic (pick a distinctive term from a
retrieved sentence, blank it out, draw distractors from other terms in the same document set).
Every candidate still passes through the real rule-based `evaluation_agent` before being
accepted, so the Quiz Agent -> Evaluation Agent -> Store pipeline the roadmap describes is fully
wired end-to-end. Swapping in a real LLM later only touches `_build_cloze_question`.
"""

import random
import re
from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.agents.evaluation_agent import evaluate_generated_question
from app.models.document import Document, DocumentChunk, DocumentStatus
from app.models.question import AnswerOption, Difficulty, Question

MIN_SENTENCE_LENGTH = 40
DISTRACTOR_COUNT = 3

_STOPWORDS = {
    "about", "after", "again", "also", "before", "being", "between", "could", "during",
    "either", "every", "first", "however", "into", "other", "should", "since",
    "still", "their", "there", "these", "this", "those", "through", "under", "using",
    "which", "while", "with", "within", "without", "would", "your",
}
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")
_WORD_RE = re.compile(r"[A-Za-z][A-Za-z\-]{3,}")


@dataclass
class RejectedCandidate:
    document_filename: str
    page_number: int | None
    reason: str


@dataclass
class QuizGenerationResult:
    requested: int
    questions: list[Question] = field(default_factory=list)
    rejected: list[RejectedCandidate] = field(default_factory=list)


def _candidate_terms(text: str) -> list[str]:
    seen: set[str] = set()
    terms: list[str] = []
    for match in _WORD_RE.finditer(text):
        word = match.group()
        lower = word.lower()
        if lower in _STOPWORDS or lower in seen:
            continue
        seen.add(lower)
        terms.append(word)
    return terms


def _build_cloze_question(chunk: DocumentChunk, term_pool: list[str]) -> tuple[str, list[str], str] | None:
    """Stub for LLM-based question generation. Returns (question_text, options, correct_answer)."""
    sentences = [s.strip() for s in _SENTENCE_SPLIT.split(chunk.content) if len(s.strip()) >= MIN_SENTENCE_LENGTH]
    random.shuffle(sentences)

    for sentence in sentences:
        terms_in_sentence = _candidate_terms(sentence)
        if not terms_in_sentence:
            continue
        answer = max(terms_in_sentence, key=len)

        distractor_pool = list(dict.fromkeys(t for t in term_pool if t.lower() != answer.lower()))
        if len(distractor_pool) < DISTRACTOR_COUNT:
            continue
        distractors = random.sample(distractor_pool, DISTRACTOR_COUNT)

        blanked = re.sub(rf"\b{re.escape(answer)}\b", "_____", sentence, count=1)
        if "_____" not in blanked:
            continue

        options = distractors + [answer]
        random.shuffle(options)
        return blanked, options, answer

    return None


def _select_chunks(db: Session, course_id: int, week_ids: list[int] | None) -> list[DocumentChunk]:
    query = (
        select(DocumentChunk)
        .join(Document, DocumentChunk.document_id == Document.id)
        .options(joinedload(DocumentChunk.document))
        .where(Document.course_id == course_id, Document.status == DocumentStatus.READY)
    )
    if week_ids:
        query = query.where(Document.week_id.in_(week_ids))
    chunks = list(db.execute(query).unique().scalars().all())
    random.shuffle(chunks)
    return chunks


def generate_questions(
    db: Session,
    course_id: int,
    week_ids: list[int] | None,
    topic: str | None,
    difficulty: Difficulty,
    question_count: int,
) -> QuizGenerationResult:
    chunks = _select_chunks(db, course_id, week_ids)
    term_pool = list(dict.fromkeys(term for chunk in chunks for term in _candidate_terms(chunk.content)))

    result = QuizGenerationResult(requested=question_count)

    for chunk in chunks:
        if len(result.questions) >= question_count:
            break

        week_id = chunk.document.week_id or (week_ids[0] if week_ids else None)
        if week_id is None:
            result.rejected.append(
                RejectedCandidate(chunk.document.filename, chunk.page_number, "Document has no associated week")
            )
            continue

        built = _build_cloze_question(chunk, term_pool)
        if built is None:
            result.rejected.append(
                RejectedCandidate(chunk.document.filename, chunk.page_number, "Could not extract a usable term and distractors")
            )
            continue

        question_text, options, answer = built
        evaluation = evaluate_generated_question(question_text, options, answer)
        if not evaluation.is_valid:
            result.rejected.append(
                RejectedCandidate(chunk.document.filename, chunk.page_number, evaluation.reason or "Rejected by evaluation agent")
            )
            continue

        letters = list(AnswerOption)
        correct_index = options.index(answer)
        page_note = f", page {chunk.page_number}" if chunk.page_number else ""
        result.questions.append(
            Question(
                course_id=course_id,
                week_id=week_id,
                topic=topic or "Generated",
                question_text=question_text,
                option_a=options[0],
                option_b=options[1],
                option_c=options[2],
                option_d=options[3],
                correct_answer=letters[correct_index],
                explanation=f'Generated from "{chunk.document.filename}"{page_note}.',
                difficulty=difficulty,
                source_document_id=chunk.document_id,
            )
        )

    return result
