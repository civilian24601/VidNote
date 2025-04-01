import React, { useState, useEffect } from 'react';
import useWebSocket, { getWebSocketUrl, ReadyState } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

interface Comment {
  id: string;
  videoId: number;
  userId: number;
  username: string;
  timestamp: number;
  content: string;
  createdAt: string;
}

interface RealTimeCommentsProps {
  videoId: number;
  userId: number;
  username: string;
}

const RealTimeComments: React.FC<RealTimeCommentsProps> = ({ videoId, userId, username }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  // Get the WebSocket URL
  const wsUrl = getWebSocketUrl();
  
  // Initialize WebSocket connection
  const { 
    sendMessage, 
    lastJsonMessage, 
    readyState, 
    reconnectCount 
  } = useWebSocket(wsUrl, {
    onOpen: () => {
      // Join the video room on connection
      sendMessage({
        type: 'join',
        videoId: videoId.toString(),
        userId: userId.toString(),
        username
      });
    }
  });

  // Handle incoming messages
  useEffect(() => {
    if (lastJsonMessage) {
      console.log('Received WebSocket message:', lastJsonMessage);
      
      const { type } = lastJsonMessage;
      
      switch (type) {
        case 'comment':
          // Add new comment to the list
          setComments(prevComments => [...prevComments, lastJsonMessage.comment]);
          break;
        
        case 'typing':
          // Update typing indicators
          const { username: typingUser, isTyping: userIsTyping } = lastJsonMessage;
          
          setTypingUsers(prev => {
            if (userIsTyping && !prev.includes(typingUser)) {
              return [...prev, typingUser];
            } else if (!userIsTyping && prev.includes(typingUser)) {
              return prev.filter(user => user !== typingUser);
            }
            return prev;
          });
          break;
          
        case 'initial':
          // Load initial comments
          setComments(lastJsonMessage.comments || []);
          break;
      }
    }
  }, [lastJsonMessage]);

  // Send comment
  const handleSendComment = () => {
    if (comment.trim() === '' || readyState !== ReadyState.OPEN) return;
    
    const newComment = {
      videoId,
      userId,
      username,
      content: comment,
      timestamp: currentTime,
    };
    
    sendMessage({
      type: 'comment',
      comment: newComment
    });
    
    setComment('');
    
    // Reset typing indicator
    handleTypingIndicator(false);
  };

  // Handle input changes and typing indicator
  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
    handleTypingIndicator(true);
  };

  // Debounce typing indicator
  let typingTimeout: ReturnType<typeof setTimeout>;
  
  const handleTypingIndicator = (isTyping: boolean) => {
    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Send typing status
    sendMessage({
      type: 'typing',
      videoId: videoId.toString(),
      userId: userId.toString(),
      username,
      isTyping
    });
    
    // Reset typing status after 3 seconds of inactivity
    if (isTyping) {
      typingTimeout = setTimeout(() => {
        sendMessage({
          type: 'typing',
          videoId: videoId.toString(),
          userId: userId.toString(),
          username,
          isTyping: false
        });
      }, 3000);
    }
  };

  // Format the connection status
  const connectionStatus = {
    [ReadyState.CONNECTING]: { text: 'Connecting...', color: 'bg-yellow-500' },
    [ReadyState.OPEN]: { text: 'Connected', color: 'bg-green-500' },
    [ReadyState.CLOSING]: { text: 'Closing...', color: 'bg-orange-500' },
    [ReadyState.CLOSED]: { text: `Disconnected${reconnectCount > 0 ? ` (retry: ${reconnectCount})` : ''}`, color: 'bg-red-500' },
  }[readyState];

  // Format timestamp (seconds) to mm:ss
  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Real-time Comments</span>
          <Badge className={connectionStatus.color}>
            {connectionStatus.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment, index) => (
              <div key={comment.id || index} className="flex flex-col bg-secondary/30 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold">{comment.username}</div>
                  <Badge variant="outline" className="text-xs">
                    {formatTimestamp(comment.timestamp)}
                  </Badge>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
        
        {typingUsers.length > 0 && (
          <div className="text-sm text-gray-500 mt-2 animate-pulse">
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.join(', ')} are typing...`}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Input
          value={comment}
          onChange={handleCommentChange}
          placeholder="Add a comment..."
          onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
          disabled={readyState !== ReadyState.OPEN}
        />
        <Button 
          onClick={handleSendComment}
          disabled={readyState !== ReadyState.OPEN || comment.trim() === ''}
        >
          Send
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RealTimeComments;