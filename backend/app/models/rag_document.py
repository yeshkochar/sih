import json
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from backend.app.database.base import Base

try:
    from pgvector.sqlalchemy import Vector
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False

class Document(Base):
    __tablename__ = "rag_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    document_type = Column(String, nullable=False, index=True)  # port_constraint, vessel_spec, procurement_policy, market_report
    source = Column(String, nullable=False)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    def get_metadata(self) -> dict:
        try:
            return json.loads(self.metadata_json or "{}")
        except Exception:
            return {}

class DocumentChunk(Base):
    __tablename__ = "rag_document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("rag_documents.id"), nullable=False)
    content = Column(Text, nullable=False)
    page = Column(Integer, nullable=True)
    section = Column(String, nullable=True)
    chunk_index = Column(Integer, default=0)
    metadata_json = Column(Text, default="{}")
    
    # Store embedding representation. If pgvector is enabled, use Vector(384).
    # Otherwise, store JSON string representation of embedding vector for dev/SQLite compatibility.
    if PGVECTOR_AVAILABLE:
        embedding = Column(Vector(384), nullable=True)
    else:
        embedding_json = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    def get_metadata(self) -> dict:
        try:
            return json.loads(self.metadata_json or "{}")
        except Exception:
            return {}

    def get_embedding_list(self) -> list:
        if hasattr(self, 'embedding') and self.embedding is not None:
            if isinstance(self.embedding, list):
                return self.embedding
            try:
                return list(self.embedding)
            except Exception:
                pass
        if hasattr(self, 'embedding_json') and self.embedding_json:
            try:
                return json.loads(self.embedding_json)
            except Exception:
                return []
        return []
