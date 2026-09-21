"""Rule-based Evaluation Agent (roadmap section 19 — "Rule-based evaluation").

Checks a Quiz Agent candidate before it is stored: required fields, exactly four
non-empty options, no duplicate options, and a correct answer that is actually one of
the options. This layer needs no LLM, so it runs on every candidate regardless of
whether generation itself is stubbed or backed by a real model.
"""

from dataclasses import dataclass

MIN_QUESTION_LENGTH = 15


@dataclass
class EvaluationResult:
    is_valid: bool
    reason: str | None = None


def evaluate_generated_question(question_text: str, options: list[str], correct_answer: str) -> EvaluationResult:
    if len(question_text.strip()) < MIN_QUESTION_LENGTH:
        return EvaluationResult(False, "Question text is too short")
    if "_____" not in question_text:
        return EvaluationResult(False, "Question text is missing a blank")
    if len(options) != 4:
        return EvaluationResult(False, "Must have exactly four options")
    if any(not option.strip() for option in options):
        return EvaluationResult(False, "One or more options is empty")
    if len({option.strip().lower() for option in options}) != 4:
        return EvaluationResult(False, "Duplicate options")
    if correct_answer not in options:
        return EvaluationResult(False, "Correct answer is not among the options")
    return EvaluationResult(True)
