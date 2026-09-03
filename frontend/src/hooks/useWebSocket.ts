import { useEffect, useState, useRef, useCallback } from 'react';

export interface WebSocketEvent {
  event: string;
  dataType: string;
  timestamp: string;
  source: string;
  status: string;
  data: any;
}

export function useWebSocket(onEvent?: (event: WebSocketEvent) => void) {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<any>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    // Clear any existing reconnect timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Primary WS path via Vite proxy, fallback to direct backend port 8000
    const primaryUrl = `${protocol}//${window.location.host}/api/ws`;
    const fallbackUrl = `ws://127.0.0.1:8000/api/ws`;

    const wsUrl = reconnectAttemptRef.current % 2 === 0 ? primaryUrl : fallbackUrl;
    setConnectionStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'disconnected');

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnectionStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
        reconnectAttemptRef.current = 0;
      };

      socket.onmessage = (messageEvent) => {
        try {
          const payload: WebSocketEvent = JSON.parse(messageEvent.data);
          if (payload.event === 'pong') return;
          
          setLastSyncTime(new Date().toLocaleTimeString());
          setLastEvent(payload);

          if (onEventRef.current) {
            onEventRef.current(payload);
          }
        } catch (e) {
          console.error("Error parsing WebSocket event message", e);
        }
      };

      socket.onerror = () => {
        // Socket error trigger, onclose handles reconnect
      };

      socket.onclose = () => {
        setConnectionStatus('reconnecting');
        wsRef.current = null;

        // Exponential backoff reconnect logic (1s, 2s, 4s, max 10s)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 10000);
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (err) {
      console.error("WebSocket connection error:", err);
      setConnectionStatus('reconnecting');
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 10000);
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(connect, delay);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connectionStatus,
    lastSyncTime,
    lastEvent,
    reconnect: connect
  };
}
