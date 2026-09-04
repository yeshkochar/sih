from sqlalchemy.orm import Session
from backend.app.models.rag_document import Document
from backend.app.rag.ingestion import ingest_document

KNOWLEDGE_DOCUMENTS = [
    {
        "title": "Visakhapatnam Port Guidelines & Draft Restrictions",
        "document_type": "port_constraint",
        "source": "Visakhapatnam Port Authority Marine Dept",
        "text": """
SECTION 1: NAVIGATION AND DRAFT LIMITATIONS
Visakhapatnam Port Outer Harbour maintains a maximum permissible draft of 16.5 meters for Capesize and Panamax bulk carriers.
Inner Harbour berths maintain maximum draft restrictions ranging from 11.5 meters to 14.5 meters depending on tidal water levels.
Vessels exceeding 14.5 meters draft must anchor in the Outer Harbour deep-water anchorage zone prior to berth allocation.

SECTION 2: VESSEL DIMENSION CONSTRAINTS
Maximum Length Overall (LOA) permitted at Outer Harbour coal berths is 290 meters with maximum Beam of 45.0 meters.
Panamax and Supramax vessels under 230 meters LOA may proceed to Inner Harbour General Cargo Berth 1 and 2 provided current draft does not exceed 13.5 meters.
Night navigation is strictly prohibited for vessels exceeding 260 meters LOA or draft greater than 15.0 meters.

SECTION 3: DISCHARGE RATES AND DEMURRAGE
Standard daily discharge capacity for coking coal at Outer Harbour mechanised coal berth is 35,000 metric tons per day.
Despatch and demurrage rates are governed by standard Charter Party (CP) terms. Standard demurrage penalty is benchmarked at $15,000 to $22,000 per day depending on vessel deadweight (DWT).
        """
    },
    {
        "title": "Paradip Port Bulk Terminal Operating Manual",
        "document_type": "port_constraint",
        "source": "Paradip Port Trust Marine Operations",
        "text": """
SECTION 1: BERTH CAPACITIES AND DRAFT CONSTRAINTS
Paradip Port Mechanised Coal Handling Plant (MCHP) accommodates Capesize vessels up to 185,000 DWT with maximum draft of 14.5 meters.
Central Quay 1 and Quay 2 accommodate Panamax vessels up to 85,000 DWT with maximum permissible draft of 13.0 meters.
Tidal allowance adds up to 1.2 meters during spring tide windows. Vessels requiring tidal draft approval must notify Port Control 48 hours prior to arrival.

SECTION 2: CONGESTION AND ANCHORAGE WAITING TIMES
Average anchorage waiting time during monsoon season (June to September) increases by 24 to 48 hours due to swell conditions.
Vessels carrying coking coal for SAIL steel plants receive priority berth allocation under Eastern Fleet Maritime Coordination agreements.
        """
    },
    {
        "title": "Gangavaram Port Deep-Draft Capesize Terminal Manual",
        "document_type": "port_constraint",
        "source": "Gangavaram Port Limited Operations",
        "text": """
SECTION 1: CAPESIZE DEEP DRAFT CAPACITY
Gangavaram Port features deep-water berth facilities capable of accommodating Fully Laden Capesize vessels up to 200,000 DWT with maximum draft of 18.0 meters.
Maximum LOA permitted is 300 meters and maximum Beam is 50 meters.
Gangavaram serves as the primary deep-draft transshipment and discharge hub for SAIL Eastern Steel Plants (Bhilai, Rourkela, Bokaro, Durgapur).

SECTION 2: DISCHARGE EFFICIENCY AND STORAGE
Mechanized mobile harbor cranes provide high-efficiency discharge rates averaging 45,000 MT per day for metallurgical coal and iron ore.
Turnaround time for Capesize vessels at Gangavaram is 3.5 days under normal operational conditions.
        """
    },
    {
        "title": "Haldia Dock Complex Feeder & Draft Restrictions",
        "document_type": "port_constraint",
        "source": "Syama Prasad Mookerjee Port Authority",
        "text": """
SECTION 1: SHALLOW DRAFT AND FEERDER RESTRICTIONS
Haldia Dock Complex operates under riverine shallow draft restrictions dictated by Hooghly River estuary bars (Balari and Eden channels).
Maximum draft at Haldia is restricted between 7.5 meters and 12.5 meters depending on daily tide tables.
Large Capesize or Panamax bulk carriers cannot enter Haldia fully laden and must undergo lighterage or transshipment at Sandheads or Sagar Anchorage prior to river transit.

SECTION 2: DECK GEAR REQUIREMENT
Vessels calling at Haldia berths 4B and 4C must be equipped with self-unloading deck cranes (minimum 30 MT crane capacity) and grabs. Gearless vessels cannot discharge at unequipped berths.
        """
    },
    {
        "title": "SAIL Bulk Charter Party & Procurement Policy Guidelines",
        "document_type": "procurement_policy",
        "source": "Ministry of Steel / SAIL Maritime Logistics Wing",
        "text": """
SECTION 1: CHARTERING RULES AND VESSEL SELECTION POLICY
All raw material imports (Coking Coal, Limestone, Iron Ore Pellets) must adhere to SAIL Procurement Guidelines 2024.
Preferred vessel selection prioritizes lowest total landed voyage cost per metric ton while strictly satisfying 100% hard feasibility constraints (draft, LOA, beam, DWT, deck gear).

SECTION 2: SPOT vs COA CONTRACT STRATEGY
Contracts of Affreightment (COA) should cover 60% of annual projected import volume (approx 15 Million MT).
Spot charter fixtures are utilized for remaining 40% volume to capitalize on Baltic Dry Index spot troughs.
Chartering managers must not fix spot vessels when 30-day forecasted freight rates indicate a market drop exceeding 5.0%.

SECTION 3: DEMURRAGE PREVENTION AND RISK CONTROLS
Vessels with estimated arrival idle time exceeding 96 hours at destination port must be flagged for scenario stress-testing.
If demurrage risk exceeds $50,000 per fixture, alternative discharge port redirection (e.g. Gangavaram instead of Haldia) must be evaluated.
        """
    },
    {
        "title": "Baltic Dry Market Operating Standards & Charter Party Terms",
        "document_type": "market_report",
        "source": "Baltic Exchange / Maritime Freight Standards",
        "text": """
SECTION 1: BALTIC INDEX BENCHMARKS
Capesize Index (BCI) reflects 180,000 DWT bulk carrier routes with standard daily charter rates.
Panamax Index (BPI) reflects 74,000 to 82,500 DWT vessels on major coal and grain corridors.
Supramax Index (BSI) covers 58,000 DWT geared bulk carriers.

SECTION 2: LAYTIME AND ARBITRATION TERMS
Standard charter party laytime is calculated based on Weather Working Days of 24 consecutive hours (WWDSHEX).
Demurrage rates are payable if laytime is exceeded. Despatch is calculated at 50% of demurrage rate for laytime saved.
        """
    }
]

def seed_knowledge_base_documents(db: Session):
    """Checks if knowledge base has documents. If empty, seeds initial reference documents."""
    count = db.query(Document).count()
    if count == 0:
        print("Seeding RAG Maritime Knowledge Base with reference documents...")
        for doc in KNOWLEDGE_DOCUMENTS:
            ingest_document(
                db=db,
                title=doc["title"],
                document_type=doc["document_type"],
                source=doc["source"],
                text_content=doc["text"]
            )
        print(f"RAG Knowledge Base seeded with {len(KNOWLEDGE_DOCUMENTS)} core maritime documents.")
    else:
        print("RAG Knowledge Base already populated.")
