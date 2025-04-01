import { useState, useEffect, useRef, useCallback } from 'react';

// Define message types for TypeScript
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// WebSocket connection states
export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

interface UseWebSocketOptions {
  onOpen?: (event: WebSocketEventMap['open']) => void;
  onClose?: (event: WebSocketEventMap['close']) => void;
  onMessage?: (event: WebSocketEventMap['message']) => void;
  onError?: (event: WebSocketEventMap['error']) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  autoReconnect?: boolean;
  shouldConnect?: boolean;
}

/**
 * Custom React hook for WebSocket communication
 */
export const useWebSocket = (
  url: string | null = null,
  options: UseWebSocketOptions = {}
) => {
  // Extract options with defaults
  const {
    onOpen,
    onClose,
    onMessage,
    onError,
    reconnectInterval = 5000,
    reconnectAttempts = 10,
    autoReconnect = true,
    shouldConnect = true,
  } = options;

  // State for the WebSocket instance and connection status
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.CLOSED);
  const [lastMessage, setLastMessage] = useState<WebSocketEventMap['message'] | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  // Use refs for WebSocket instance and callbacks to prevent unnecessary re-renders
  const websocketRef = useRef<WebSocket | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create WebSocket connection
  const connect = useCallback(() => {
    // Clear any existing timeout
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }

    // Don't connect if URL is not provided or shouldConnect is false
    if (!url || !shouldConnect) {
      return;
    }

    // Create WebSocket connection
    console.log(`Connecting to WebSocket server: ${url}`);
    const ws = new WebSocket(url);
    websocketRef.current = ws;
    setReadyState(ReadyState.CONNECTING);

    // Set up event handlers
    ws.onopen = (event) => {
      console.log('WebSocket connection established');
      setReadyState(ReadyState.OPEN);
      setReconnectCount(0);
      if (onOpen) onOpen(event);
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed');
      setReadyState(ReadyState.CLOSED);
      if (onClose) onClose(event);

      // Attempt to reconnect if enabled and we haven't exceeded the retry limit
      if (autoReconnect && (reconnectAttempts === -1 || reconnectCount < reconnectAttempts)) {
        console.log(`Attempting to reconnect (${reconnectCount + 1}/${reconnectAttempts === -1 ? 'unlimited' : reconnectAttempts})`);
        
        connectTimeoutRef.current = setTimeout(() => {
          setReconnectCount((prevCount) => prevCount + 1);
          connect();
        }, reconnectInterval);
      }
    };

    ws.onmessage = (event) => {
      setLastMessage(event);
      if (onMessage) onMessage(event);
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      if (onError) onError(event);
    };
  }, [url, shouldConnect, onOpen, onClose, onMessage, onError, autoReconnect, reconnectAttempts, reconnectCount, reconnectInterval]);

  // Send a message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Send a raw string message (not wrapped in JSON)
  const sendRawMessage = useCallback((message: string) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(message);
      return true;
    }
    return false;
  }, []);

  // Close the connection
  const disconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  // Connect on mount and reconnect when URL changes
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Parse the last message if it's JSON
  const lastJsonMessage = useCallback(() => {
    if (lastMessage && lastMessage.data) {
      try {
        return JSON.parse(lastMessage.data.toString());
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [lastMessage]);

  return {
    readyState,
    sendMessage,
    sendRawMessage,
    lastMessage,
    lastJsonMessage: lastJsonMessage(),
    connect,
    disconnect,
    reconnectCount,
    isConnecting: readyState === ReadyState.CONNECTING,
    isOpen: readyState === ReadyState.OPEN,
    isClosed: readyState === ReadyState.CLOSED,
    isClosing: readyState === ReadyState.CLOSING,
  };
};

/**
 * Helper function to create the WebSocket URL
 */
export const getWebSocketUrl = (path: string = '/ws'): string => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}${path}`;
};

export default useWebSocket;