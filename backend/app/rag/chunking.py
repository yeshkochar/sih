import re
from typing import List, Dict, Any
from backend.app.rag.config import rag_config

def chunk_text(
    text: str,
    chunk_size: int = None,
    overlap: int = None,
    metadata: Dict[str, Any] = None
) -> List[Dict[str, Any]]:
    """
    Splits text into meaningful semantic chunks with overlap while preserving section/page context.
    """
    if chunk_size is None:
        chunk_size = rag_config.DEFAULT_CHUNK_SIZE
    if overlap is None:
        overlap = rag_config.DEFAULT_CHUNK_OVERLAP
    if metadata is None:
        metadata = {}

    if not text or not text.strip():
        return []

    # Clean whitespace
    clean_raw = text.replace('\r\n', '\n')
    
    # Split by section headers or double newlines
    paragraphs = re.split(r'\n\s*\n', clean_raw)
    
    chunks = []
    current_chunk_words = []
    current_len = 0
    chunk_index = 0
    current_section = metadata.get("section", "General")
    current_page = metadata.get("page", 1)

    for p in paragraphs:
        p_str = p.strip()
        if not p_str:
            continue

        # Check if line looks like a section header (e.g. SECTION 1, ### Header, 1.0 Title)
        if re.match(r'^(SECTION|CHAPTER|PART|\#{1,4}|\d+\.\d+)\s+.*', p_str, re.IGNORECASE):
            current_section = p_str.split('\n')[0].strip('#').strip()

        words = p_str.split()
        p_len = len(words)

        if current_len + p_len > chunk_size and current_chunk_words:
            # Emit current chunk
            chunk_content = " ".join(current_chunk_words)
            chunks.append({
                "content": chunk_content,
                "chunk_index": chunk_index,
                "section": current_section,
                "page": current_page,
                "metadata": {**metadata, "section": current_section, "page": current_page}
            })
            chunk_index += 1

            # Prepare next chunk with overlap
            overlap_words = current_chunk_words[-overlap:] if len(current_chunk_words) >= overlap else current_chunk_words
            current_chunk_words = overlap_words + words
            current_len = len(current_chunk_words)
        else:
            current_chunk_words.extend(words)
            current_len += p_len

    if current_chunk_words:
        chunk_content = " ".join(current_chunk_words)
        chunks.append({
            "content": chunk_content,
            "chunk_index": chunk_index,
            "section": current_section,
            "page": current_page,
            "metadata": {**metadata, "section": current_section, "page": current_page}
        })

    return chunks
