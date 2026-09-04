import re
from typing import Dict, Any, Tuple

def validate_grounding(
    explanation_text: str,
    evidence_package_dict: Dict[str, Any]
) -> Tuple[bool, str, float]:
    """
    Validates whether claims in the generated explanation text are grounded in the retrieved evidence package.
    
    Returns:
      (is_grounded: bool, status_label: str, confidence_score: float)
    """
    if not evidence_package_dict.get("has_sufficient_evidence", False):
        return False, "Insufficient Evidence", 0.0

    if "Insufficient evidence available" in explanation_text:
        return False, "Insufficient Evidence", 0.0

    struct_facts = evidence_package_dict.get("structured_evidence", [])
    doc_chunks = evidence_package_dict.get("document_evidence", [])

    # Extract all text tokens and numbers from evidence
    evidence_tokens = set()
    evidence_numbers = set()

    for sf in struct_facts:
        for k, v in sf.items():
            if isinstance(v, (int, float)):
                evidence_numbers.add(str(v))
                evidence_numbers.add(f"{v:,.0f}")
                evidence_numbers.add(f"{v:.1f}")
            elif isinstance(v, str):
                words = re.findall(r'\b\w+\b', v.lower())
                evidence_tokens.update(words)

    for dc in doc_chunks:
        words = re.findall(r'\b\w+\b', dc.get("content", "").lower())
        evidence_tokens.update(words)
        nums = re.findall(r'\b\d+(?:\.\d+)?\b', dc.get("content", ""))
        evidence_numbers.update(nums)

    # Extract key entity tokens and numbers mentioned in explanation
    explanation_tokens = re.findall(r'\b[A-Za-z]{3,}\b', explanation_text.lower())
    explanation_numbers = re.findall(r'\b\d+(?:\.\d+)?\b', explanation_text)

    # Calculate token overlap
    matched_tokens = [t for t in explanation_tokens if t in evidence_tokens]
    token_overlap_ratio = len(matched_tokens) / len(explanation_tokens) if explanation_tokens else 1.0

    # Calculate number overlap
    matched_numbers = [n for n in explanation_numbers if n in evidence_numbers]
    num_overlap_ratio = len(matched_numbers) / len(explanation_numbers) if explanation_numbers else 1.0

    confidence_score = round((token_overlap_ratio * 0.6) + (num_overlap_ratio * 0.4), 2)

    if confidence_score >= 0.70:
        return True, "Grounded", confidence_score
    elif confidence_score >= 0.40:
        return True, "Partially Grounded", confidence_score
    else:
        return False, "Unsupported", confidence_score
