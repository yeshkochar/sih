import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.rag_document import Document, DocumentChunk
from backend.app.rag.embeddings import generate_embedding, cosine_similarity
from backend.app.rag.config import rag_config

def retrieve_document_chunks(
    db: Session,
    query: str,
    top_k: int = None,
    threshold: float = None
) -> List[Dict[str, Any]]:
    """
    Retrieves semantic document chunks using embedding similarity search.
    Enforces evidence confidence threshold filtering.
    """
    if top_k is None:
        top_k = rag_config.MAX_DOCUMENT_CHUNKS
    if threshold is None:
        threshold = rag_config.EVIDENCE_SIMILARITY_THRESHOLD

    if not query or not query.strip():
        return []

    query_emb = generate_embedding(query)
    chunks = db.query(DocumentChunk).all()

    scored_chunks = []

    for c in chunks:
        emb = c.get_embedding_list()
        if not emb:
            continue
        
        sim = cosine_similarity(query_emb, emb)
        
        if sim >= threshold:
            doc = db.query(Document).filter(Document.id == c.document_id).first()
            scored_chunks.append({
                "chunk_id": c.id,
                "document_id": c.document_id,
                "document_title": doc.title if doc else "Document",
                "document_type": doc.document_type if doc else "general",
                "source": doc.source if doc else "Knowledge Base",
                "page": c.page,
                "section": c.section or "General",
                "content": c.content,
                "similarity_score": round(sim, 4)
            })

    # Sort descending by similarity score
    scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
    return scored_chunks[:top_k]
