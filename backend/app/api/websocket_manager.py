import json
import logging
from datetime import datetime
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("websocket_manager")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast_json(self, message: Dict[str, Any]):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error sending WebSocket message: {e}")
                disconnected.append(connection)
        
        for connection in disconnected:
            self.disconnect(connection)

    async def broadcast_event(
        self,
        event_type: str,
        data_type: str,
        data: Any,
        source: str = "FreightSense Ingestion Engine",
        status: str = "LIVE"
    ):
        event_payload = {
            "event": event_type,  # e.g., "data.updated", "recommendation.updated"
            "dataType": data_type,  # e.g., "vessel", "port", "freight", "fx", "bunker", "weather"
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": source,
            "status": status,
            "data": data
        }
        await self.broadcast_json(event_payload)

# Global singleton connection manager instance
manager = ConnectionManager()
