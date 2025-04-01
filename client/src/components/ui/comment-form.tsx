import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { getInitials, formatTime, getAvatarColor } from "@/lib/utils";

interface CommentFormProps {
  videoId: number;
  currentTime: number;
  onSubmit: (content: string, timestamp: number) => Promise<void>;
}

export function CommentForm({ videoId, currentTime, onSubmit }: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content, currentTime);
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;
  
  const handleTextareaInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <div className="p-4 border-t border-gray-800 glassmorphism rounded-lg mt-2">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className={`h-10 w-10 rounded-full ${getAvatarColor(user.id)} flex items-center justify-center text-white font-medium shadow-lg`}>
            {getInitials(user.fullName)}
          </div>
        </div>
        <div className="flex-grow">
          <div className="relative rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <Textarea
              ref={textareaRef}
              rows={2}
              className="block w-full border-0 py-3 px-3 resize-none bg-transparent text-white placeholder-gray-400 focus:ring-0 sm:text-sm"
              placeholder="Add a comment at current timestamp..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onInput={handleTextareaInput}
            />
            <div className="py-2 px-3 border-t border-gray-700 flex justify-between items-center">
              <div className="flex space-x-1">
                <button 
                  type="button" 
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-300 hover:bg-gray-700"
                >
                  <i className="ri-mic-line mr-1 text-primary"></i>
                  Record
                </button>
                <button 
                  type="button" 
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-300 hover:bg-gray-700"
                >
                  <i className="ri-attachment-2 mr-1 text-primary"></i>
                  Attach
                </button>
              </div>
              <Button 
                type="submit" 
                size="sm"
                className="btn-gradient"
                disabled={!content.trim() || isSubmitting}
                onClick={handleSubmit}
              >
                Post at {formatTime(currentTime)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
