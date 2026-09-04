import math
import hashlib
from typing import List
from backend.app.rag.config import rag_config

_st_model = None

def _get_st_model():
    global _st_model
    if _st_model is not None:
        return _st_model
    try:
        from sentence_transformers import SentenceTransformer
        _st_model = SentenceTransformer(rag_config.EMBEDDING_MODEL)
        return _st_model
    except Exception:
        _st_model = False
        return False

def generate_embedding(text: str, dim: int = 384) -> List[float]:
    """
    Generates a normalized embedding vector for the input text.
    Uses sentence-transformers if available, or a deterministic hash-based feature vector fallback.
    """
    if not text or not text.strip():
        return [0.0] * dim

    model = _get_st_model()
    if model:
        try:
            vec = model.encode(text, convert_to_numpy=True).tolist()
            if len(vec) == dim:
                return vec
        except Exception:
            pass

    # Deterministic feature hashing fallback for offline/test environments
    tokens = text.lower().split()
    vector = [0.0] * dim
    for i, token in enumerate(tokens):
        # Generate multiple hashes per token to distribute across dimension
        h1 = int(hashlib.md5(f"{token}_{i}".encode('utf-8')).hexdigest(), 16)
        h2 = int(hashlib.sha256(token.encode('utf-8')).hexdigest(), 16)
        
        idx1 = h1 % dim
        idx2 = h2 % dim
        
        val1 = ((h1 % 200) - 100) / 100.0
        val2 = ((h2 % 200) - 100) / 100.0
        
        vector[idx1] += val1
        vector[idx2] += val2

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vector))
    if norm > 1e-9:
        vector = [x / norm for x in vector]
    else:
        vector = [1.0 / math.sqrt(dim)] * dim

    return vector

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Computes cosine similarity between two vector lists."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 < 1e-9 or norm2 < 1e-9:
        return 0.0
    return dot / (norm1 * norm2)
