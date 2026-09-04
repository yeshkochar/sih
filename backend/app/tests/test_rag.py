import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.connection import SessionLocal, init_db
from backend.app.utils.demo_data import reset_demo_data
from backend.app.utils.seed_knowledge_base import seed_knowledge_base_documents
from backend.app.rag.ingestion import ingest_document
from backend.app.rag.vector_retriever import retrieve_document_chunks
from backend.app.rag.structured_retriever import retrieve_structured_evidence
from backend.app.rag.evidence import build_evidence_package
from backend.app.rag.prompts import build_user_prompt
from backend.app.rag.grounding import validate_grounding
from backend.app.services.optimization import optimize_charter

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_db():
    init_db()
    db = SessionLocal()
    reset_demo_data(db, "normal")
    seed_knowledge_base_documents(db)
    yield db
    db.close()

def test_document_ingestion_and_vector_retrieval(setup_db):
    db = setup_db
    # Test Ingestion
    doc = ingest_document(
        db=db,
        title="Test Port Anchorage Regulation",
        document_type="port_constraint",
        source="Test Marine Authority",
        text_content="Visakhapatnam Outer Harbour Anchorage Section 4: Deep draft vessels exceeding 16.5m draft must maintain a safe distance of 2 nautical miles."
    )
    assert doc.id is not None

    # Test Vector Search Retrieval
    chunks = retrieve_document_chunks(db, "What is the anchorage distance for deep draft vessels at Visakhapatnam?", top_k=3, threshold=0.1)
    assert len(chunks) > 0
    assert any("draft" in c["content"].lower() or "visakhapatnam" in c["content"].lower() for c in chunks)

def test_structured_retrieval(setup_db):
    db = setup_db
    # Create a recommendation first
    rec_res = optimize_charter(db, request_id=1)
    assert rec_res is not None
    rec_id = rec_res["recommendation_id"]

    # Test Structured Retrieval
    struct_facts = retrieve_structured_evidence(db, "Why was this vessel selected?", recommendation_id=rec_id)
    assert len(struct_facts) > 0
    rec_fact = next((f for f in struct_facts if f.get("recommendation_id") == rec_id), None)
    assert rec_fact is not None
    assert rec_fact["recommended_vessel"] is not None

def test_evidence_package_and_thresholding(setup_db):
    db = setup_db
    package = build_evidence_package(db, "Visakhapatnam port draft restriction", recommendation_id=1)
    pkg_dict = package.to_dict()

    assert pkg_dict["has_sufficient_evidence"] is True
    assert len(pkg_dict["sources"]) > 0

def test_no_evidence_threshold_behavior(setup_db):
    db = setup_db
    # Query completely unrelated / unsupported question
    unsupported_query = "XyZ12399_Which space vessel will land on Jupiter next century?"
    package = build_evidence_package(db, unsupported_query)
    pkg_dict = package.to_dict()

    # Document chunks below threshold should result in insufficient evidence or empty docs
    assert len(pkg_dict["document_evidence"]) == 0 or pkg_dict["max_similarity_score"] < 0.45

def test_prompt_construction(setup_db):
    evidence_sample = {
        "structured_evidence": [
            {"category": "Vessel Spec", "vessel_name": "MV SAIL Express", "draft_m": 13.5}
        ],
        "document_evidence": [
            {"document_title": "Port Guidelines", "source": "Visakhapatnam Auth", "section": "Draft Limits", "page": 1, "content": "Max draft is 16.5m."}
        ]
    }
    user_p = build_user_prompt("Why MV SAIL Express?", evidence_sample)
    assert "MV SAIL Express" in user_p
    assert "Max draft is 16.5m" in user_p
    assert "AUTHENTIC SYSTEM DATA & DOCUMENTS" in user_p

def test_grounding_validator():
    sample_evidence = {
        "has_sufficient_evidence": True,
        "structured_evidence": [
            {"category": "Vessel Spec", "vessel_name": "MV Paradip Pioneer", "draft_m": 14.0}
        ],
        "document_evidence": [
            {"content": "Paradip Quay 1 accommodates 13.0m draft."}
        ]
    }

    # Test grounded text
    explanation = "Vessel MV Paradip Pioneer has a draft of 14.0m."
    is_g, status, score = validate_grounding(explanation, sample_evidence)
    assert is_g is True
    assert status in ["Grounded", "Partially Grounded"]

    # Test ungrounded refusal text
    refusal = "Insufficient evidence available to answer this question reliably."
    is_g2, status2, score2 = validate_grounding(refusal, sample_evidence)
    assert is_g2 is False
    assert status2 == "Insufficient Evidence"

def test_rag_api_endpoint(setup_db):
    # Test valid RAG query with recommendation context
    response = client.post("/api/rag/query", json={
        "question": "Why was this vessel recommended for cargo shipment?",
        "recommendation_id": 1
    })
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["grounded"] is True
    assert len(data["sources"]) > 0

def test_rag_api_unsupported_question(setup_db):
    # Test unsupported question returning Insufficient Evidence
    response = client.post("/api/rag/query", json={
        "question": "Which vessel will definitely have the lowest freight rate next year?",
        "recommendation_id": None
    })
    assert response.status_code == 200
    data = response.json()
    assert "Insufficient evidence" in data["answer"] or data["grounded"] is False
