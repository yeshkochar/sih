from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.rag.evidence import build_evidence_package
from backend.app.rag.generator import generate_grounded_explanation
from backend.app.rag.grounding import validate_grounding
from backend.app.models.audit_log import AuditLog

def execute_rag_query(
    db: Session,
    question: str,
    recommendation_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    High-level RAG Pipeline Orchestrator:
    1. Hybrid Retrieval (Structured DB + Vector Semantic Search)
    2. Evidence Package Construction & Sufficiency Filtering
    3. Grounded LLM Explanation Generation
    4. Anti-Hallucination Grounding Validation
    5. Audit Trail Logging
    """
    # 1. Build Evidence Package
    evidence_package = build_evidence_package(db, question, recommendation_id)
    evidence_dict = evidence_package.to_dict()

    # 2. Generate Grounded Explanation
    explanation = generate_grounded_explanation(question, evidence_dict)

    # 3. Validate Grounding
    is_grounded, grounding_status, confidence_score = validate_grounding(explanation, evidence_dict)

    # 4. Write Audit Trail
    try:
        audit = AuditLog(
            username="Procurement Manager",
            role="Procurement Manager",
            action="RAG_Query",
            target=str(recommendation_id or "General"),
            details=f"RAG Query: '{question}' | Grounded: {is_grounded} ({grounding_status}) | Confidence: {confidence_score}"
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print("RAG Audit logging note:", e)

    return {
        "question": question,
        "recommendation_id": recommendation_id,
        "answer": explanation,
        "grounded": is_grounded,
        "grounding_status": grounding_status,
        "confidence": confidence_score,
        "sources": evidence_dict.get("sources", []),
        "evidence": {
            "structured": evidence_dict.get("structured_evidence", []),
            "documents": evidence_dict.get("document_evidence", [])
        },
        "retrieval_metadata": evidence_dict.get("retrieval_metadata", {})
    }
