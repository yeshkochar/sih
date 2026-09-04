import os

class RAGSettings:
    EMBEDDING_DIM: int = int(os.getenv("RAG_EMBEDDING_DIM", "384"))
    EVIDENCE_SIMILARITY_THRESHOLD: float = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.45"))
    MAX_DOCUMENT_CHUNKS: int = int(os.getenv("RAG_MAX_DOCUMENT_CHUNKS", "5"))
    MAX_STRUCTURED_RESULTS: int = int(os.getenv("RAG_MAX_STRUCTURED_RESULTS", "5"))
    
    DEFAULT_CHUNK_SIZE: int = int(os.getenv("RAG_CHUNK_SIZE", "400"))
    DEFAULT_CHUNK_OVERLAP: int = int(os.getenv("RAG_CHUNK_OVERLAP", "80"))

    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai").lower()
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

rag_config = RAGSettings()
