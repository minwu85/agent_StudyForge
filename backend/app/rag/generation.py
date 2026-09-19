"""LLM generation — deliberately stubbed for now (see docs/backend.md, Phase 4).

Retrieval (rag/retriever.py) and prompt construction (prompts/study_prompts.py) are real; this
is the one function standing in for an actual LLM call, so the swap is small and isolated when
it's time to make one.

To wire in the real thing: call the Anthropic API here with the prompt from
`study_prompts.build_study_prompt`, using model="claude-haiku-4-5" (chosen as the target model —
fast and inexpensive, a good fit for a student Q&A tutor), and return its response text instead
of `_extractive_fallback`.
"""

from app.rag.retriever import RetrievedChunk

STUB_MODEL_NAME = "stub (no LLM connected yet)"


def _extractive_fallback(chunks: list[RetrievedChunk]) -> str:
    best = chunks[0]
    return (
        "No LLM is connected yet, so here is the closest matching passage from your material "
        f"instead of a generated answer:\n\n\"{best.content}\""
    )


def generate_answer(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return "I couldn't find anything in your uploaded material to answer this."
    return _extractive_fallback(chunks)
