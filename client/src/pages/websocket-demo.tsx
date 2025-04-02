import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWebSocket, getWebSocketUrl } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Send, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  userId: number;
  username: string;
  text: string;
  timestamp: number;
}

const WebSocketDemo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [videoId, setVideoId] = useState<number>(1); // Simulating a single video room
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ensure user is available for demo purposes
  const userId = user?.id || 99;
  const username = user?.username || 'Demo User';
  
  // Initialize WebSocket connection
  const wsUrl = getWebSocketUrl();
  
  const { 
    sendMessage, 
    lastMessage, 
    readyState,
    isConnecting,
    isOpen,
    isClosed,
    isClosing
  } = useWebSocket(
    wsUrl,
    {
      onOpen: () => {
        console.log('WebSocket connection established');
        // Join the room
        sendMessage({
          type: 'join',
          videoId: videoId,
          userId: userId
        });
      },
      onClose: () => {
        console.log('WebSocket connection closed');
      },
      onError: () => {
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to the WebSocket server',
          variant: 'destructive'
        });
      }
    }
  );
  
  // Get connection status for UI display
  const getConnectionStatus = () => {
    if (isConnecting) return 'CONNECTING';
    if (isOpen) return 'OPEN';
    if (isClosing) return 'CLOSING';
    if (isClosed) return 'CLOSED';
    return 'UNKNOWN';
  };
  const connectionStatus = getConnectionStatus();
  
  // Handle received messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        // Handle different message types
        if (data.type === 'joined') {
          toast({
            title: 'Connected',
            description: `Successfully joined video room ${data.videoId}`,
            variant: 'default'
          });
        }
        
        if (data.type === 'new_comment') {
          const newMessage: Message = {
            id: `msg-${Date.now()}`,
            userId: data.comment.userId,
            username: data.comment.username || 'Unknown User',
            text: data.comment.content,
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
        
        if (data.type === 'typing') {
          // Could implement a typing indicator here
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, toast]);
  
  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (message.trim() === '') return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      userId,
      username,
      text: message,
      timestamp: Date.now()
    };
    
    // Add to local messages
    setMessages(prev => [...prev, newMessage]);
    
    // Send to WebSocket server
    sendMessage({
      type: 'new_comment',
      videoId,
      comment: {
        id: newMessage.id,
        userId,
        username,
        content: message,
        videoId,
        parentId: null,
        createdAt: new Date().toISOString()
      }
    });
    
    // Clear input
    setMessage('');
  };
  
  // Connection status indicator
  const ConnectionStatus = () => {
    switch (connectionStatus) {
      case 'CONNECTING':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" /> Connecting...
          </Badge>
        );
      case 'OPEN':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Connected
          </Badge>
        );
      case 'CLOSING':
      case 'CLOSED':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" /> Disconnected
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>WebSocket Real-Time Chat Demo</CardTitle>
            <ConnectionStatus />
          </div>
          <CardDescription>
            Demonstrating real-time collaboration features using WebSockets.
            {connectionStatus !== 'OPEN' && (
              <p className="text-sm text-red-500 mt-1">
                {connectionStatus === 'CONNECTING' 
                  ? 'Connecting to server...' 
                  : 'Not connected to the server. Messages will not be sent.'}
              </p>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4 h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.userId === userId ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.userId === userId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {msg.userId === userId ? 'You' : msg.username}
                      </span>
                    </div>
                    <p>{msg.text}</p>
                    <div className="text-xs opacity-70 text-right mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="p-4">
          <div className="flex gap-2 w-full">
            <Input
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={connectionStatus !== 'OPEN'}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={connectionStatus !== 'OPEN' || message.trim() === ''}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <div className="mt-8 bg-muted p-4 rounded-md text-sm">
        <h3 className="font-medium mb-2">How It Works:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>The WebSocket connection is established when this page loads</li>
          <li>Messages are sent in real-time to all connected clients in the same "room"</li>
          <li>Try opening this page in another browser tab to see messages sync between them</li>
          <li>The connection status indicator shows the current state of your WebSocket connection</li>
        </ol>
      </div>
    </div>
  );
};

export default WebSocketDemo;