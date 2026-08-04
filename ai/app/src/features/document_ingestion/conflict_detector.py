"""LLM-judge conflict detection."""

from __future__ import annotations

from dataclasses import dataclass

from pydantic import BaseModel

from ...shared.llm import get_judge_model
from ...shared.vectorstore import find_conflict_candidates


@dataclass(frozen=True)
class ConflictFinding:
    candidate_document_id: str
    candidate_chunk_text: str
    conflict: bool
    explanation: str


class _JudgeVerdict(BaseModel):
    conflict: bool
    explanation: str


async def _llm_judge_conflict(new_text: str, candidate_text: str) -> tuple[bool, str]:
    judge = get_judge_model().with_structured_output(_JudgeVerdict)
    verdict = await judge.ainvoke(
        "Two passages, possibly from different versions of the same clinic "
        "policy document. Do they assert something contradictory about the "
        "same fact (e.g. different opening hours, different prices for the "
        "same service)? Answer conflict=false if they're simply about "
        "different topics or agree with each other.\n\n"
        f"Passage A (existing document):\n{candidate_text}\n\n"
        f"Passage B (new upload):\n{new_text}"
    )
    return verdict.conflict, verdict.explanation


async def check_conflicts(new_chunk_text: str, *, new_doc_id: str) -> list[ConflictFinding]:
    candidates = find_conflict_candidates(new_chunk_text, exclude_doc_id=new_doc_id)
    findings: list[ConflictFinding] = []

    for candidate in candidates:
        candidate_text = candidate["content"]
        conflict, explanation = await _llm_judge_conflict(new_chunk_text, candidate_text)
        if conflict:
            findings.append(
                ConflictFinding(
                    candidate_document_id=candidate["doc_id"],
                    candidate_chunk_text=candidate_text,
                    conflict=True,
                    explanation=explanation,
                )
            )

    return findings
