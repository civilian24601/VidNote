import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Comment, User } from "@schema";
import { formatDateTime, getInitials, getAvatarColor } from "@/lib/utils";

// Ensure createdAt is properly typed as it might be null in some cases
interface CommentWithUser extends Omit<Comment, 'createdAt'> {
  user: Omit<User, "password">;
  createdAt: string | Date | null;
}

interface CommentListProps {
  comments: CommentWithUser[];
  onJumpToTimestamp: (timestamp: number) => void;
  typingUsers?: { [key: number]: boolean };
  activeUsers?: { id: number; fullName: string }[];
}

export function CommentList({ 
  comments, 
  onJumpToTimestamp,
  typingUsers = {},
  activeUsers = []
}: CommentListProps) {
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  
  // Sort comments by timestamp
  const sortedComments = [...comments].sort((a, b) => {
    if (viewMode === "timeline") {
      return a.timestamp - b.timestamp;
    } else {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    }
  });
  
  // Get all users who are currently typing
  const typingUsersList = Object.entries(typingUsers)
    .filter(([_, isTyping]) => isTyping)
    .map(([userId]) => parseInt(userId));

  return (
    <div className="card glassmorphism rounded-xl overflow-hidden border-primary/10">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gradient">Comments</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "timeline" ? "default" : "ghost"}
            size="sm"
            className={`text-sm flex items-center ${viewMode === "timeline" ? "btn-gradient" : "text-gray-300 hover:text-white hover:bg-gray-800/50"}`}
            onClick={() => setViewMode("timeline")}
          >
            <i className="ri-time-line mr-1"></i>
            Timeline View
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className={`text-sm flex items-center ${viewMode === "list" ? "btn-gradient" : "text-gray-300 hover:text-white hover:bg-gray-800/50"}`}
            onClick={() => setViewMode("list")}
          >
            <i className="ri-list-check mr-1"></i>
            List View
          </Button>
        </div>
      </div>
      
      <div className="p-4 max-h-[600px] overflow-y-auto space-y-6">
        {sortedComments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <i className="ri-chat-3-line block text-3xl mb-2 text-primary/50"></i>
            <p>No comments yet</p>
            <p className="text-sm">Be the first to leave feedback</p>
          </div>
        ) : (
          <>
            {sortedComments.map((comment) => (
              <div key={comment.id} className="comment-item animate-fade-in">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full ${getAvatarColor(comment.user.id)} flex items-center justify-center text-white font-medium shadow-lg`}>
                      {getInitials(comment.user.fullName)}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-white">{comment.user.fullName}</span>
                        <span className="text-sm text-gray-400 ml-2">{comment.user.role}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center text-primary font-medium px-2 py-1 rounded hover:bg-gray-800/50"
                          onClick={() => onJumpToTimestamp(comment.timestamp)}
                        >
                          <i className="ri-play-circle-line mr-1"></i>
                          {Math.floor(comment.timestamp / 60)}:
                          {(comment.timestamp % 60).toString().padStart(2, "0")}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 text-gray-300">
                      {comment.content}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {formatDateTime(comment.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicators */}
            {typingUsersList.length > 0 && (
              <div className="flex items-center space-x-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700 animate-pulse">
                <div className="flex -space-x-2">
                  {typingUsersList.slice(0, 3).map(userId => {
                    const user = activeUsers.find(u => u.id === userId);
                    return user ? (
                      <div 
                        key={userId}
                        className={`h-8 w-8 rounded-full ${getAvatarColor(userId)} flex items-center justify-center text-white font-medium shadow-lg border-2 border-gray-900`}
                      >
                        {getInitials(user.fullName)}
                      </div>
                    ) : null;
                  })}
                </div>
                
                <div className="text-sm text-gray-300 flex items-center">
                  <span className="mr-2">
                    {typingUsersList.length === 1 && activeUsers.find(u => u.id === typingUsersList[0])
                      ? activeUsers.find(u => u.id === typingUsersList[0])?.fullName
                      : `${typingUsersList.length} people`} typing
                  </span>
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
