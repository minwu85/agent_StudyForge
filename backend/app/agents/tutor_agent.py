"""Tutor Agent (roadmap section 5.3): explain -> question -> evaluate -> hint -> next question,
adjusting difficulty from the student's recent accuracy (roadmap section 9, Adaptive Learning).

Reuses the Quiz Agent's chunk selection and cloze-question stub rather than duplicating it: a
Tutor "turn" is a Quiz Agent candidate question plus its *unblanked* source chunk shown first as
the explanation, so the student reads the material, then is immediately checked on it. Answer
evaluation is a plain equality check against the stored `correct_answer` (no LLM needed — this is
the same rule-based approach as `evaluation_agent`, applied to a student's answer instead of a
generated question).
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.agents.evaluation_agent import evaluate_generated_question
from app.agents.quiz_agent import _build_cloze_question, _candidate_terms, _select_chunks
from app.models.question import Difficulty

_DIFFICULTY_ORDER = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]
STREAK_THRESHOLD = 2


@dataclass
class GeneratedTurn:
    explanation: str
    question_text: str
    options: list[str]
    correct_answer: str
    document_filename: str
    page_number: int | None
    chunk_id: int


def generate_turn(
    db: Session,
    course_id: int,
    week_ids: list[int] | None,
    exclude_chunk_ids: list[int],
) -> GeneratedTurn | None:
    """Picks the next unused chunk and builds an explanation + check question from it."""
    chunks = [c for c in _select_chunks(db, course_id, week_ids) if c.id not in exclude_chunk_ids]
    term_pool = list(dict.fromkeys(term for chunk in chunks for term in _candidate_terms(chunk.content)))

    for chunk in chunks:
        built = _build_cloze_question(chunk, term_pool)
        if built is None:
            continue
        question_text, options, answer = built
        evaluation = evaluate_generated_question(question_text, options, answer)
        if not evaluation.is_valid:
            continue
        return GeneratedTurn(
            explanation=chunk.content,
            question_text=question_text,
            options=options,
            correct_answer=answer,
            document_filename=chunk.document.filename,
            page_number=chunk.page_number,
            chunk_id=chunk.id,
        )

    return None


def adapt_difficulty(current: Difficulty, correct_streak: int, incorrect_streak: int) -> Difficulty:
    """Roadmap section 9's adaptive rule: N-in-a-row correct steps difficulty up, N-in-a-row
    incorrect steps it down. Capped at the easy/hard ends of the scale."""
    index = _DIFFICULTY_ORDER.index(current)
    if correct_streak >= STREAK_THRESHOLD and index < len(_DIFFICULTY_ORDER) - 1:
        return _DIFFICULTY_ORDER[index + 1]
    if incorrect_streak >= STREAK_THRESHOLD and index > 0:
        return _DIFFICULTY_ORDER[index - 1]
    return current


def build_hint(answer: str) -> str:
    """Masks all but the first and last letter, e.g. "heap" -> "h__p"."""
    if len(answer) <= 2:
        return answer[0] + "_" * (len(answer) - 1)
    return answer[0] + "_" * (len(answer) - 2) + answer[-1]
