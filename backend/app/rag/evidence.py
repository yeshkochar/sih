from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.rag.structured_retriever import retrieve_structured_evidence
from backend.app.rag.vector_retriever import retrieve_document_chunks
from backend.app.rag.config import rag_config

class EvidencePackage:
    def __init__(
        self,
        query: str,
        recommendation_id: Optional[int] = None,
        structured_evidence: List[Dict[str, Any]] = None,
        document_evidence: List[Dict[str, Any]] = None
    ):
        self.query = query
        self.recommendation_id = recommendation_id
        self.structured_evidence = structured_evidence or []
        self.document_evidence = document_evidence or []
        
        # Calculate max similarity score across document chunks
        self.max_similarity_score = max(
            [c.get("similarity_score", 0.0) for c in self.document_evidence],
            default=0.0
        )
        
        # Evaluate sufficiency threshold:
        # If recommendation_id is provided, structured context exists.
        # Otherwise, query must retrieve structured facts or document chunks above threshold.
        has_struct = len(self.structured_evidence) > 0
        has_docs = self.max_similarity_score >= rag_config.EVIDENCE_SIMILARITY_THRESHOLD
        
        if recommendation_id is not None:
            self.has_sufficient_evidence = has_struct or has_docs
        else:
            self.has_sufficient_evidence = has_docs or (has_struct and any(k in query.lower() for k in ["vessel", "port", "draft", "coal", "ore", "recommendation", "forecast"]))

        # Extract deduplicated citations/sources
        self.sources = self._extract_sources()

    def _extract_sources(self) -> List[Dict[str, Any]]:
        sources_list = []

        # Structured DB sources
        for item in self.structured_evidence:
            source_entry = {
                "type": "database",
                "title": item.get("category", item.get("source_type", "PostgreSQL Database")),
                "source": item.get("source_type", "PostgreSQL"),
                "details": f"{item.get('vessel_name', '')} {item.get('port_name', '')}".strip()
            }
            if source_entry not in sources_list:
                sources_list.append(source_entry)

        # Document sources
        for chunk in self.document_evidence:
            source_entry = {
                "type": "document",
                "title": chunk.get("document_title", "Maritime Document"),
                "source": chunk.get("source", "Knowledge Base"),
                "page": chunk.get("page"),
                "section": chunk.get("section", "General")
            }
            if source_entry not in sources_list:
                sources_list.append(source_entry)

        return sources_list

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "recommendation_id": self.recommendation_id,
            "has_sufficient_evidence": self.has_sufficient_evidence,
            "max_similarity_score": round(self.max_similarity_score, 4),
            "structured_evidence": self.structured_evidence,
            "document_evidence": self.document_evidence,
            "sources": self.sources,
            "retrieval_metadata": {
                "structured_results": len(self.structured_evidence),
                "document_chunks": len(self.document_evidence)
            }
        }

def build_evidence_package(
    db: Session,
    query: str,
    recommendation_id: Optional[int] = None
) -> EvidencePackage:
    """
    Executes hybrid retrieval (Structured DB + Semantic Vector Search)
    and constructs a validated EvidencePackage.
    """
    struct_evidence = retrieve_structured_evidence(db, query, recommendation_id)
    doc_evidence = retrieve_document_chunks(db, query)
    
    return EvidencePackage(
        query=query,
        recommendation_id=recommendation_id,
        structured_evidence=struct_evidence,
        document_evidence=doc_evidence
    )
