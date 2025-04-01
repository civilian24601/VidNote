import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

// Define WebSocket message types
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketProps {
  videoId?: number | string;
  onNewComment?: (comment: any) => void;
  onTypingIndicator?: (userId: number, isTyping: boolean) => void;
}

export function useWebSocket({ videoId, onNewComment, onTypingIndicator }: UseWebSocketProps) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { user } = useAuth();

  // Connect to WebSocket server
  useEffect(() => {
    if (!videoId) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection opened');
      setConnected(true);
      setError(null);
      
      // Join video room
      if (videoId && user) {
        sendMessage({
          type: 'join',
          videoId: videoId,
          userId: user.id
        });
      }
    });
    
    // Connection closed
    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    });
    
    // Connection error
    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      setError('Failed to connect to real-time collaboration service');
      setConnected(false);
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        switch (data.type) {
          case 'joined':
            console.log(`Successfully joined video room ${data.videoId}`);
            break;
            
          case 'new_comment':
            if (onNewComment && data.comment) {
              onNewComment(data.comment);
            }
            break;
            
          case 'typing':
            if (onTypingIndicator && data.userId) {
              onTypingIndicator(data.userId, data.isTyping);
            }
            break;
            
          default:
            console.log('Received unknown message type:', data.type);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });
    
    // Clean up on unmount
    return () => {
      console.log('Closing WebSocket connection');
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [videoId, user, onNewComment, onTypingIndicator]);
  
  // Function to send messages
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);
  
  // Function to send new comment notification
  const sendNewComment = useCallback((comment: any) => {
    if (!videoId) return false;
    
    return sendMessage({
      type: 'new_comment',
      videoId: videoId,
      comment: comment
    });
  }, [videoId, sendMessage]);
  
  // Function to send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!videoId || !user) return false;
    
    return sendMessage({
      type: 'typing',
      videoId: videoId,
      userId: user.id,
      isTyping: isTyping
    });
  }, [videoId, user, sendMessage]);
  
  return {
    connected,
    error,
    sendMessage,
    sendNewComment,
    sendTypingIndicator
  };
}