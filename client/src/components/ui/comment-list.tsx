import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Comment, User } from "@shared/schema";
import { formatDateTime, getInitials, getAvatarColor } from "@/lib/utils";

interface CommentWithUser extends Comment {
  user: Omit<User, "password">;
}

interface CommentListProps {
  comments: CommentWithUser[];
  onJumpToTimestamp: (timestamp: number) => void;
}

export function CommentList({ comments, onJumpToTimestamp }: CommentListProps) {
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  
  // Sort comments by timestamp
  const sortedComments = [...comments].sort((a, b) => {
    return viewMode === "timeline" 
      ? a.timestamp - b.timestamp 
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Comments</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "timeline" ? "default" : "ghost"}
            size="sm"
            className="text-sm flex items-center"
            onClick={() => setViewMode("timeline")}
          >
            <i className="ri-time-line mr-1"></i>
            Timeline View
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className="text-sm flex items-center"
            onClick={() => setViewMode("list")}
          >
            <i className="ri-list-check mr-1"></i>
            List View
          </Button>
        </div>
      </div>
      
      <div className="p-4 max-h-[600px] overflow-y-auto space-y-6">
        {sortedComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="ri-chat-3-line block text-3xl mb-2"></i>
            <p>No comments yet</p>
            <p className="text-sm">Be the first to leave feedback</p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} className="comment-item animate-fade-in">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className={`h-9 w-9 rounded-full ${getAvatarColor(comment.user.id)} flex items-center justify-center text-white font-medium`}>
                    {getInitials(comment.user.fullName)}
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{comment.user.fullName}</span>
                      <span className="text-sm text-gray-500 ml-2">{comment.user.role}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center text-primary-500 font-medium px-2 py-1 rounded hover:bg-gray-50"
                        onClick={() => onJumpToTimestamp(comment.timestamp)}
                      >
                        <i className="ri-play-circle-line mr-1"></i>
                        {Math.floor(comment.timestamp / 60)}:
                        {(comment.timestamp % 60).toString().padStart(2, "0")}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-1 text-gray-800">
                    {comment.content}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {formatDateTime(comment.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
