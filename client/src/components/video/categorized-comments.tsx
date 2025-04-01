import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getInitials, getAvatarColor, formatDateTime } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Comment, User } from "@/shared/schema";

// Define comment categories with colors
export const COMMENT_CATEGORIES = {
  technique: { label: "Technique", color: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" },
  interpretation: { label: "Interpretation", color: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30" },
  expression: { label: "Expression", color: "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30" },
  rhythm: { label: "Rhythm", color: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" },
  tone: { label: "Tone", color: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" },
  general: { label: "General", color: "bg-green-500/20 text-green-400 hover:bg-green-500/30" },
};

type CommentWithUser = Comment & {
  user: User;
  replies?: CommentWithUser[];
};

// Helper to format timestamp in MM:SS format
export const formatTimestamp = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

interface CommentItemProps {
  comment: CommentWithUser;
  videoId: number;
  currentUser: User;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onSeek: (time: number) => void;
  depth?: number;
}

export const CommentItem = ({ 
  comment, 
  videoId, 
  currentUser, 
  onReply, 
  onDelete, 
  onSeek,
  depth = 0 
}: CommentItemProps) => {
  const [showReplies, setShowReplies] = useState(true);
  const canDelete = currentUser.id === comment.userId || currentUser.role === "teacher";
  const category = comment.category ? comment.category : "general";
  const categoryData = COMMENT_CATEGORIES[category as keyof typeof COMMENT_CATEGORIES] || COMMENT_CATEGORIES.general;
  
  return (
    <div className={`mb-3 ${depth > 0 ? "ml-8" : ""}`}>
      <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            <Avatar className={`h-8 w-8 ${getAvatarColor(comment.user.id)}`}>
              <AvatarFallback className="text-sm">
                {getInitials(comment.user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.user.fullName}</span>
                {comment.user.role === "teacher" && (
                  <Badge variant="outline" className="bg-primary/20 text-primary h-5">
                    Teacher
                  </Badge>
                )}
                <Badge className={categoryData.color}>
                  {categoryData.label}
                </Badge>
                {comment.timestamp !== null && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-auto px-2 text-xs rounded-full bg-gray-700/50"
                    onClick={() => onSeek(comment.timestamp || 0)}
                  >
                    {formatTimestamp(comment.timestamp || 0)}
                  </Button>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {formatDateTime(comment.createdAt)}
              </div>
            </div>
          </div>
          {canDelete && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-red-900/20 hover:text-red-400"
              onClick={() => onDelete(comment.id)}
            >
              <i className="ri-delete-bin-line text-sm"></i>
            </Button>
          )}
        </div>
        
        <div className="mt-2 text-sm text-gray-300">
          {comment.content}
        </div>
        
        <div className="mt-2 flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => onReply(comment.id)}
          >
            <i className="ri-reply-line mr-1"></i>
            Reply
          </Button>
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          <button 
            className="text-xs text-gray-400 flex items-center hover:text-gray-300 transition-colors"
            onClick={() => setShowReplies(!showReplies)}
          >
            <i className={`ri-arrow-${showReplies ? 'down' : 'right'}-s-line mr-1`}></i>
            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          
          {showReplies && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  videoId={videoId}
                  currentUser={currentUser}
                  onReply={onReply}
                  onDelete={onDelete}
                  onSeek={onSeek}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CommentFormProps {
  videoId: number;
  parentId?: number | null;
  currentTimestamp?: number | null;
  onCancel?: () => void;
}

export const CommentForm = ({ 
  videoId, 
  parentId = null,
  currentTimestamp = null,
  onCancel 
}: CommentFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // WebSocket functionality for real-time collaboration has been removed
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Create the comment object
      const commentData = {
        userId: user.id,
        videoId,
        content,
        category,
        parentId,
        timestamp: currentTimestamp,
      };
      
      // Make an API call to persist the comment
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commentData),
      });
      
      if (response.ok) {
        setContent("");
        setCategory("general");
        if (onCancel) onCancel();
      } else {
        toast({
          title: "Error",
          description: "Failed to post comment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
      console.error("Failed to post comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex items-start gap-3">
        <Avatar className={`h-8 w-8 mt-1 ${getAvatarColor(user.id)}`}>
          <AvatarFallback>
            {getInitials(user.fullName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {Object.entries(COMMENT_CATEGORIES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {currentTimestamp !== null && (
              <div className="flex items-center h-10 px-3 rounded-md bg-gray-800 border border-gray-700 text-sm">
                <i className="ri-time-line mr-1.5"></i>
                At {formatTimestamp(currentTimestamp)}
              </div>
            )}
          </div>
          
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={parentId ? "Write a reply..." : "Add a comment..."}
            className="min-h-[100px] bg-gray-800 border-gray-700 focus:border-primary"
          />
          
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                className="border-gray-700"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              className="bg-primary text-white"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-1.5"></i>
                  Posting...
                </>
              ) : (
                <>
                  <i className="ri-send-plane-fill mr-1.5"></i>
                  {parentId ? "Reply" : "Comment"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

interface TypingIndicatorProps {
  typingUsers: User[];
}

export const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;
  
  return (
    <div className="text-sm text-gray-400 italic flex items-center gap-2 h-6 mb-2">
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((user) => (
          <Avatar key={user.id} className={`h-6 w-6 border-2 border-gray-900 ${getAvatarColor(user.id)}`}>
            <AvatarFallback className="text-xs">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span>
        {typingUsers.length === 1
          ? `${typingUsers[0].fullName} is typing...`
          : `${typingUsers.length} people are typing...`}
      </span>
      <span className="typing-animation">
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  );
};

interface CategorizedCommentsProps {
  videoId: number;
  onSeek: (time: number) => void;
}

export const CategorizedComments = ({ videoId, onSeek }: CategorizedCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  
  // WebSocket functionality for real-time collaboration has been removed
  
  // Fetch comments from API
  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      
      // In a real app, we'd make an API call here
      // For now, let's use mock data
      const response = await fetch(`/api/videos/${videoId}/comments`);
      
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else {
        console.error("Failed to fetch comments");
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  useEffect(() => {
    fetchComments();
  }, [videoId]);
  
  const handleAddComment = () => {
    setIsAddingComment(true);
    setReplyingTo(null);
  };
  
  const handleAddCommentAtCurrentTime = (time: number) => {
    setCurrentTimestamp(time);
    setIsAddingComment(true);
    setReplyingTo(null);
  };
  
  const handleReply = (commentId: number) => {
    setReplyingTo(commentId);
    setIsAddingComment(false);
    setCurrentTimestamp(null);
  };
  
  const handleCancelReply = () => {
    setReplyingTo(null);
  };
  
  const handleCancelAddComment = () => {
    setIsAddingComment(false);
    setCurrentTimestamp(null);
  };
  
  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    
    try {
      // Make an API call to delete the comment
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        toast({
          title: "Comment deleted",
          description: "Your comment has been removed."
        });
        
        // Update local state
        setComments(prevComments => 
          prevComments.filter(comment => {
            // Remove comment if it matches the deleted ID
            if (comment.id === commentId) return false;
            
            // Filter out the deleted comment from replies
            if (comment.replies) {
              comment.replies = comment.replies.filter(reply => reply.id !== commentId);
            }
            
            return true;
          })
        );
      } else {
        toast({
          title: "Error",
          description: "Failed to delete comment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
      console.error("Failed to delete comment:", error);
    }
  };
  
  // Filter comments by category
  const filteredComments = activeCategory === "all" 
    ? comments 
    : comments.filter(comment => comment.category === activeCategory);
  
  if (!user) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Feedback</h3>
        <Button 
          className="bg-primary text-white"
          onClick={handleAddComment}
        >
          <i className="ri-add-line mr-1.5"></i>
          Add Comment
        </Button>
      </div>
      
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
        <Badge 
          variant={activeCategory === "all" ? "default" : "outline"}
          className={`cursor-pointer ${activeCategory === "all" ? "bg-primary text-white" : "border-gray-700 hover:bg-gray-800"}`}
          onClick={() => setActiveCategory("all")}
        >
          All
        </Badge>
        
        {Object.entries(COMMENT_CATEGORIES).map(([key, { label, color }]) => (
          <Badge 
            key={key}
            variant={activeCategory === key ? "default" : "outline"}
            className={`cursor-pointer ${activeCategory === key ? "bg-primary text-white" : color}`}
            onClick={() => setActiveCategory(key)}
          >
            {label}
          </Badge>
        ))}
      </div>
      
      {/* Add comment form */}
      {isAddingComment && (
        <CommentForm 
          videoId={videoId} 
          currentTimestamp={currentTimestamp}
          onCancel={handleCancelAddComment}
        />
      )}
      
      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />
      
      {/* Comments list */}
      {isLoadingComments ? (
        <div className="flex justify-center items-center py-8 text-gray-400">
          <i className="ri-loader-4-line animate-spin mr-2 text-xl"></i>
          <span>Loading comments...</span>
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <i className="ri-chat-3-line text-5xl mb-3 block"></i>
          <p>No comments yet. Be the first to provide feedback!</p>
        </div>
      ) : (
        <div>
          {filteredComments.map(comment => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                videoId={videoId}
                currentUser={user}
                onReply={handleReply}
                onDelete={handleDeleteComment}
                onSeek={onSeek}
              />
              
              {replyingTo === comment.id && (
                <div className="ml-8 mt-2">
                  <CommentForm
                    videoId={videoId}
                    parentId={comment.id}
                    onCancel={handleCancelReply}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};