import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.rag_document import Document, DocumentChunk
from backend.app.rag.chunking import chunk_text
from backend.app.rag.embeddings import generate_embedding

def ingest_document(
    db: Session,
    title: str,
    document_type: str,
    source: str,
    text_content: str,
    metadata: Dict[str, Any] = None
) -> Document:
    """
    Ingests a document into the RAG database:
    1. Creates Document record.
    2. Chunks text with overlap.
    3. Generates embeddings.
    4. Saves DocumentChunk records.
    """
    if metadata is None:
        metadata = {}

    doc_metadata = {
        "title": title,
        "document_type": document_type,
        "source": source,
        **metadata
    }

    doc = Document(
        title=title,
        document_type=document_type,
        source=source,
        metadata_json=json.dumps(doc_metadata)
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    chunks = chunk_text(text_content, metadata=doc_metadata)
    
    for c in chunks:
        emb = generate_embedding(c["content"])
        chunk_meta = {
            "document_id": doc.id,
            "document_title": title,
            "document_type": document_type,
            "source": source,
            "page": c["page"],
            "section": c["section"],
            "chunk_index": c["chunk_index"]
        }
        
        chunk_obj = DocumentChunk(
            document_id=doc.id,
            content=c["content"],
            page=c["page"],
            section=c["section"],
            chunk_index=c["chunk_index"],
            metadata_json=json.dumps(chunk_meta),
            embedding_json=json.dumps(emb)
        )
        
        # If pgvector is present on model, assign embedding vector
        if hasattr(chunk_obj, 'embedding'):
            chunk_obj.embedding = emb

        db.add(chunk_obj)

    db.commit()
    return doc
