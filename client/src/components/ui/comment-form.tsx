import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { getInitials, formatTime, getAvatarColor } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Feedback categories for teachers
const FEEDBACK_CATEGORIES = [
  { value: "technique", label: "Technique" },
  { value: "interpretation", label: "Interpretation" },
  { value: "rhythm", label: "Rhythm" },
  { value: "dynamics", label: "Dynamics" },
  { value: "tone", label: "Tone Quality" },
  { value: "theory", label: "Music Theory" },
  { value: "general", label: "General" }
];

interface CommentFormProps {
  videoId: number;
  currentTime: number;
  onSubmit: (content: string, timestamp: number, category?: string) => Promise<void>;
}

export function CommentForm({ videoId, currentTime, onSubmit }: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Determine if the user is a teacher
  const isTeacher = user?.role === "teacher";

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      const timestamp = currentTime;
      const commentCategory = isTeacher ? category : undefined;
      
      // Submit comment through API
      await onSubmit(content, timestamp, commentCategory);
      
      // Reset form
      setContent("");
      if (isTeacher) setCategory(undefined);
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
    
    // Adjust height
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
          {/* Show feedback category selector for teachers */}
          {isTeacher && (
            <div className="mb-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-64 border-gray-700 bg-gray-800/30 text-gray-300 focus:ring-primary">
                  <SelectValue placeholder="Select feedback category (optional)" />
                </SelectTrigger>
                <SelectContent className="glassmorphism border-gray-700 text-white">
                  <SelectGroup>
                    <SelectLabel>Feedback Categories</SelectLabel>
                    {FEEDBACK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="hover:bg-gray-800/70">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {category && (
                <div className="mt-1 text-xs text-primary flex items-center">
                  <i className="ri-price-tag-3-line mr-1"></i>
                  Category: {FEEDBACK_CATEGORIES.find(c => c.value === category)?.label}
                </div>
              )}
            </div>
          )}
          
          <div className="relative rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <Textarea
              ref={textareaRef}
              rows={2}
              className="block w-full border-0 py-3 px-3 resize-none bg-transparent text-white placeholder-gray-400 focus:ring-0 sm:text-sm"
              placeholder={isTeacher 
                ? "Add feedback at current timestamp..."
                : "Add a comment at current timestamp..."
              }
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
