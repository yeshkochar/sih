from typing import Dict, Any
from backend.app.rag.config import rag_config
from backend.app.rag.prompts import RAG_EXPLANATION_SYSTEM_PROMPT, build_user_prompt

def generate_grounded_explanation(query: str, evidence_package_dict: Dict[str, Any]) -> str:
    """
    Generates an evidence-grounded explanation.
    Uses LLM API if configured, or synthesizes a deterministic grounded response from the evidence package when API key is missing.
    """
    # 1. No Evidence Check
    if not evidence_package_dict.get("has_sufficient_evidence", False):
        return "Insufficient evidence available to answer this question reliably."

    user_prompt = build_user_prompt(query, evidence_package_dict)

    # 2. External LLM API Call if API key configured
    if rag_config.LLM_API_KEY and rag_config.LLM_API_KEY.strip():
        try:
            import urllib.request
            import json

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {rag_config.LLM_API_KEY}"
            }

            payload = {
                "model": rag_config.LLM_MODEL,
                "messages": [
                    {"role": "system", "content": RAG_EXPLANATION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.1
            }

            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=json.dumps(payload).encode('utf-8'),
                headers=headers,
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                return result["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print("LLM API call error, using grounded evidence synthesizer fallback:", e)

    # 3. Grounded Evidence Synthesizer Fallback (Offline / Demo Mode)
    # Synthesizes exact facts from retrieved evidence package without external API dependency.
    struct_facts = evidence_package_dict.get("structured_evidence", [])
    doc_chunks = evidence_package_dict.get("document_evidence", [])

    lines = []

    rec_fact = next((f for f in struct_facts if f.get("recommendation_id")), None)
    vessel_fact = next((f for f in struct_facts if "Vessel" in f.get("category", "")), None)
    port_facts = [f for f in struct_facts if "Port Constraint" in f.get("category", "")]

    if rec_fact:
        lines.append(f"Vessel '{rec_fact.get('recommended_vessel')}' was recommended for cargo request #{rec_fact.get('recommendation_id')} ({rec_fact.get('quantity_mt', 0):,.0f} MT {rec_fact.get('commodity')} from {rec_fact.get('origin')} to {rec_fact.get('destination')}).")
        lines.append(f"• Optimization Score: {rec_fact.get('recommendation_score')}/100 | Feasibility Status: {rec_fact.get('feasibility_status')}.")
        lines.append(f"• Total Voyage Cost: ${rec_fact.get('estimated_cost_usd', 0):,.2f} | Estimated Risk Score: {rec_fact.get('risk_score')}/100.")
        if rec_fact.get("is_overridden"):
            lines.append(f"• Human Override Applied: Overridden by {rec_fact.get('override_by')}. Reason: '{rec_fact.get('override_reason')}'.")

    if vessel_fact:
        lines.append(f"\nVessel Specifications ({vessel_fact.get('vessel_name')}):")
        lines.append(f"• Capacity: {vessel_fact.get('max_capacity_mt', 0):,.0f} MT DWT | Draft: {vessel_fact.get('draft_m')}m | LOA: {vessel_fact.get('loa_m')}m | Beam: {vessel_fact.get('beam_m')}m.")
        lines.append(f"• Daily Charter Rate: ${vessel_fact.get('daily_charter_rate_usd', 0):,.2f}/day | Speed: {vessel_fact.get('speed_knots')} knots.")

    if port_facts:
        lines.append("\nPort Constraints:")
        for pf in port_facts:
            lines.append(f"• {pf.get('port_name')}: Maximum Draft = {pf.get('max_draft_m')}m, Max LOA = {pf.get('max_loa_m')}m, Congestion Score = {pf.get('congestion_score_pct')}%.")

    if doc_chunks:
        lines.append("\nSupporting Maritime Documentation:")
        for idx, dc in enumerate(doc_chunks[:2], 1):
            snippet = dc.get("content", "")[:180] + "..." if len(dc.get("content", "")) > 180 else dc.get("content", "")
            lines.append(f"• [{dc.get('document_title')} - Section '{dc.get('section')}']: \"{snippet}\"")

    if not lines:
        return "Insufficient evidence available to answer this question reliably."

    return "\n".join(lines)
