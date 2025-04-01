import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useVideo, useComments, useAddComment, useVideoSharing, useShareVideo, useUnshareVideo } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { VideoPlayer } from "@/components/ui/video-player";
import { CommentList } from "@/components/ui/comment-list";
import { CommentForm } from "@/components/ui/comment-form";
import { VideoInfo } from "@/components/ui/video-info";
import { TeacherFeedback } from "@/components/ui/teacher-feedback";
import { Button } from "@/components/ui/button";
import { formatDate, getInitials, getAvatarColor, formatTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { MOCK_USERS } from "@/lib/mockData";

const shareSchema = z.object({
  teacherId: z.number({
    required_error: "Please select a teacher"
  }),
  customMessage: z.string().optional(),
});

type ShareValues = z.infer<typeof shareSchema>;

export default function Watch({ params }: { params: { id: string } }) {
  const videoId = parseInt(params.id);
  const [_, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { data: video, isLoading: isLoadingVideo } = useVideo(videoId);
  const { data: comments = [], isLoading: isLoadingComments, refetch: refetchComments } = useComments(videoId);
  const { data: sharingData, isLoading: isLoadingSharing } = useVideoSharing(videoId);
  const { mutateAsync: addComment } = useAddComment(videoId);
  const { mutateAsync: shareVideo, isPending: isSharing } = useShareVideo(videoId);
  const { mutateAsync: unshareVideo } = useUnshareVideo(videoId);
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [typingUsers, setTypingUsers] = useState<{ [key: number]: boolean }>({});
  
  // Set up WebSocket connection for real-time collaboration
  const { connected, error: wsError } = useWebSocket({
    videoId,
    onNewComment: (comment: { 
      user?: { id: number; fullName: string; }; 
      timestamp: number; 
    }) => {
      // Fetch latest comments when a new one is received via WebSocket
      refetchComments();
      
      // Show a notification
      if (comment.user?.id !== user?.id) {
        toast({
          title: "New comment added",
          description: `${comment.user?.fullName || 'Someone'} left a comment at ${formatTime(comment.timestamp)}.`,
        });
      }
    },
    onTypingIndicator: (userId: number, isTyping: boolean) => {
      // Update typing indicators
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
    }
  });

  const sharingUsers = Array.isArray(sharingData) 
    ? sharingData.map((sharing: any) => ({
        ...sharing,
        user: sharing.user
      })) 
    : [];

  // Filter for available teachers
  const availableTeachers = MOCK_USERS.filter(
    user => user.role === 'teacher' && !sharingUsers.some(su => su.user.id === user.id)
  );
  
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  
  const form = useForm<ShareValues>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      teacherId: 0,
      customMessage: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleAddComment = async (content: string, timestamp: number, category?: string) => {
    try {
      await addComment({ content, timestamp, category });
      toast({
        title: category ? "Feedback added" : "Comment added",
        description: `Your ${category ? 'feedback' : 'comment'} at ${Math.floor(timestamp / 60)}:${(timestamp % 60).toString().padStart(2, "0")} has been added.`,
      });
    } catch (error) {
      toast({
        title: `Failed to add ${category ? 'feedback' : 'comment'}`,
        description: error instanceof Error ? error.message : `An error occurred while adding your ${category ? 'feedback' : 'comment'}.`,
        variant: "destructive",
      });
    }
  };

  const handleShareVideo = async (values: ShareValues) => {
    try {
      if (!values.teacherId) {
        toast({
          title: "Teacher required",
          description: "Please select a teacher to share this video with.",
          variant: "destructive"
        });
        return;
      }
      
      // Share with the selected teacher
      await shareVideo(values.teacherId);
      
      // Find the teacher name for the toast message
      const teacherName = MOCK_USERS.find(u => u.id === values.teacherId)?.fullName || "the teacher";
      
      toast({
        title: "Video shared for feedback",
        description: `You've shared this video with ${teacherName} for collaborative feedback.`,
      });
      setShareDialogOpen(false);
      setSelectedTeacher(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Failed to share video",
        description: error instanceof Error ? error.message : "An error occurred while sharing your video.",
        variant: "destructive",
      });
    }
  };

  const handleJumpToTimestamp = (timestamp: number) => {
    setCurrentTime(timestamp);
    // In a real implementation, this would be connected to the video player
    // to make it seek to the specified timestamp
  };

  if (isLoadingVideo) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-[400px] w-full rounded-xl mb-6" />
          <div className="lg:flex lg:space-x-6">
            <div className="lg:w-2/3">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
            <div className="lg:w-1/3 mt-6 lg:mt-0">
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-16 px-4 glassmorphism rounded-lg max-w-lg mx-auto animated-bg">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <i className="ri-error-warning-line text-4xl text-primary"></i>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Video not found</h3>
            <p className="text-lg text-gray-300 mb-8">
              The video you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button 
              className="btn-gradient"
              onClick={() => navigate("/videos")}
            >
              Back to videos
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 sm:pb-0">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <VideoPlayer
          videoUrl={video.url}
          title={video.title}
          uploadDate={formatDate(video.createdAt)}
          comments={comments}
          onAddComment={() => {
            const commentForm = document.getElementById('comment-form');
            if (commentForm) {
              commentForm.scrollIntoView({ behavior: 'smooth' });
              const textarea = commentForm.querySelector('textarea');
              if (textarea) textarea.focus();
            }
          }}
          onShareVideo={() => setShareDialogOpen(true)}
          onCommentClick={handleJumpToTimestamp}
        />

        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gradient text-xl">Share video</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleShareVideo)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Select teacher for feedback</FormLabel>
                      <FormControl>
                        <Command className="rounded-lg border border-gray-700 bg-gray-800/50">
                          <CommandInput 
                            placeholder="Search for a teacher..." 
                            className="text-white border-none focus:ring-0"
                          />
                          <CommandList className="text-white">
                            <CommandEmpty>No teachers found.</CommandEmpty>
                            <CommandGroup heading="Available Teachers">
                              {availableTeachers.map((teacher) => (
                                <CommandItem
                                  key={teacher.id}
                                  value={teacher.fullName}
                                  onSelect={() => {
                                    form.setValue('teacherId', teacher.id);
                                    setSelectedTeacher(teacher.id);
                                  }}
                                  className={selectedTeacher === teacher.id ? "bg-primary/20 text-white" : "text-gray-200"}
                                >
                                  <div className="flex items-center">
                                    <div className={`h-8 w-8 rounded-full ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-medium mr-2`}>
                                      {getInitials(teacher.fullName)}
                                    </div>
                                    <div>
                                      <div className="font-medium">{teacher.fullName}</div>
                                      <div className="text-xs text-gray-400">{teacher.email}</div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Add a message (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Request specific feedback or add context about the performance..." 
                          className="bg-gray-800/50 border-gray-600 text-white resize-none min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-3 mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-gray-600 text-white hover:bg-gray-800/50" 
                    onClick={() => {
                      setShareDialogOpen(false);
                      setSelectedTeacher(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-gradient" disabled={isSharing || !selectedTeacher}>
                    {isSharing ? "Sharing..." : "Request Feedback"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <div className="mt-6 lg:flex lg:space-x-6">
          <div className="lg:w-2/3 animate-slide-up">
            <CommentList 
              comments={comments} 
              onJumpToTimestamp={handleJumpToTimestamp} 
              typingUsers={typingUsers}
              activeUsers={MOCK_USERS} // In a real app, this would be the list of active users in the session
            />
            
            <div id="comment-form" className="mt-4">
              <CommentForm 
                videoId={video.id} 
                currentTime={currentTime}
                onSubmit={handleAddComment}
              />
            </div>
          </div>
          
          <div className="lg:w-1/3 mt-6 lg:mt-0 animate-slide-up">
            <VideoInfo
              title={video.title}
              description={video.description || ""}
              practiceGoals={["Improve finger independence", "Work on pedaling technique", "Maintain consistent tempo"]}
              sharingUsers={sharingUsers}
              onManageSharing={() => setShareDialogOpen(true)}
              onDownload={() => {
                // Download video logic
                toast({
                  title: "Download started",
                  description: "Your video is being downloaded.",
                });
                window.open(video.url, '_blank');
              }}
            />
            
            {/* Collaborative Teacher Feedback Component */}
            <div className="mt-6">
              <TeacherFeedback
                comments={comments}
                onJumpToTimestamp={handleJumpToTimestamp}
              />
            </div>
            
            {/* Practice Notes Button */}
            <div className="mt-4">
              <Button className="btn-gradient w-full inline-flex justify-center items-center">
                <i className="ri-sticky-note-line mr-1.5"></i>
                Generate Practice Notes
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
