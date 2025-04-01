import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useVideo, useComments, useAddComment, useVideoSharing, useShareVideo, useUnshareVideo } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { MOCK_USERS } from "@/lib/mockData";

// Import our new enhanced components
import EnhancedVideoPlayer from "@/components/video/enhanced-video-player";
import { CategorizedComments } from "@/components/video/categorized-comments";
import TeacherFeedback from "@/components/video/teacher-feedback";
import FeedbackExport from "@/components/video/feedback-export";

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

  // New state for our enhanced UI
  const [activeTab, setActiveTab] = useState("comments");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const videoPlayerRef = useRef<HTMLDivElement>(null);

  // Handle adding a comment at a specific timestamp
  const handleAddCommentAtTime = (time: number) => {
    // This would be used to add a comment at the current video time
    setCurrentTime(time);
    
    // Scroll to comment section if needed
    if (activeTab !== "comments") {
      setActiveTab("comments");
    }
  };

  // Handle seeking to a specific timestamp in the video
  const handleSeekToTimestamp = (timestamp: number) => {
    // In a real implementation, this would directly interact with the video player
    setCurrentTime(timestamp);
    
    // Scroll to video player for mobile views
    if (videoPlayerRef.current) {
      videoPlayerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle exporting feedback
  const handleExportFeedback = () => {
    setExportDialogOpen(true);
  };

  // Process comments to add user data and structure replies
  const processedComments = comments.map((comment: any) => {
    // In a real implementation, this would be properly typed
    // and would handle nested replies
    const user = MOCK_USERS.find(u => u.id === comment.userId) || {
      id: comment.userId,
      fullName: `User ${comment.userId}`,
      role: "student"
    };
    
    return {
      ...comment,
      user,
      replies: comments
        .filter((reply: any) => reply.parentId === comment.id)
        .map((reply: any) => ({
          ...reply,
          user: MOCK_USERS.find(u => u.id === reply.userId) || {
            id: reply.userId,
            fullName: `User ${reply.userId}`,
            role: "student"
          }
        }))
    };
  }).filter((comment: any) => !comment.parentId);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 sm:pb-0">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Video Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-gray-400 text-sm">
            <span>Uploaded on {formatDate(video.createdAt)}</span>
            <span className="text-gray-500">•</span>
            <span>by {video.userId && MOCK_USERS.find(u => u.id === video.userId)?.fullName}</span>
            
            <div className="ml-auto flex gap-2">
              <Button 
                variant="outline" 
                className="h-8 px-3 text-xs border-gray-700"
                onClick={() => setShareDialogOpen(true)}
              >
                <i className="ri-share-line mr-1.5"></i>
                Share
              </Button>
              <Button 
                className="h-8 px-3 text-xs bg-primary text-white"
                onClick={() => window.open(video.url, '_blank')}
              >
                <i className="ri-download-line mr-1.5"></i>
                Download
              </Button>
            </div>
          </div>
        </div>
        
        {/* Enhanced Video Player */}
        <div ref={videoPlayerRef}>
          <EnhancedVideoPlayer 
            videoUrl={video.url} 
            thumbnailUrl={video.thumbnailUrl}
            comments={processedComments}
            onTimeUpdate={(time) => setCurrentTime(time)}
            onCommentAtTime={handleAddCommentAtTime}
            onSeekToMarker={handleSeekToTimestamp}
          />
        </div>

        {/* Sharing Dialog */}
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

        {/* Feedback Export Dialog */}
        <FeedbackExport 
          video={video}
          comments={processedComments}
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
        />

        {/* Video Details and Comments Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="glassmorphism mb-6 bg-gray-900/50 border-gray-700">
              <TabsTrigger value="comments">Comments & Feedback</TabsTrigger>
              <TabsTrigger value="details">Video Details</TabsTrigger>
              <TabsTrigger value="teachers">Teacher Feedback</TabsTrigger>
            </TabsList>
            
            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-6 animate-slide-up">
              <CategorizedComments 
                videoId={videoId} 
                onSeek={handleSeekToTimestamp}
              />
            </TabsContent>
            
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 animate-slide-up">
              <div>
                <h3 className="text-xl font-semibold mb-4">Video Information</h3>
                <div className="space-y-4 text-gray-300">
                  <div>
                    <h4 className="text-white font-medium">Description</h4>
                    <p className="mt-1">{video.description || "No description provided."}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium">Piece Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="bg-gray-800/40 p-3 rounded-md border border-gray-700">
                        <div className="text-sm text-gray-400">Title</div>
                        <div>{video.pieceName || "Not specified"}</div>
                      </div>
                      <div className="bg-gray-800/40 p-3 rounded-md border border-gray-700">
                        <div className="text-sm text-gray-400">Composer</div>
                        <div>{video.composer || "Not specified"}</div>
                      </div>
                      <div className="bg-gray-800/40 p-3 rounded-md border border-gray-700">
                        <div className="text-sm text-gray-400">Difficulty</div>
                        <div>{video.difficulty || "Not specified"}</div>
                      </div>
                      <div className="bg-gray-800/40 p-3 rounded-md border border-gray-700">
                        <div className="text-sm text-gray-400">Practice Time</div>
                        <div>{video.practiceTime ? `${video.practiceTime} hours` : "Not tracked"}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium">Practice Goals</h4>
                    <ul className="mt-2 space-y-2">
                      <li className="bg-gray-800/40 p-3 rounded-md border border-gray-700">
                        Improve finger independence
                      </li>
                      <li className="bg-gray-800/40 p-3 rounded-md border border-gray-700">
                        Work on pedaling technique
                      </li>
                      <li className="bg-gray-800/40 p-3 rounded-md border border-gray-700">
                        Maintain consistent tempo
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium">Shared With</h4>
                    {sharingUsers.length === 0 ? (
                      <p className="mt-2 text-gray-400">
                        This video hasn't been shared with any teachers yet.
                      </p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {sharingUsers.map((sharing: any) => (
                          <div key={sharing.id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-md border border-gray-700">
                            <div className="flex items-center gap-2">
                              <div className={`h-8 w-8 rounded-full ${getAvatarColor(sharing.user.id)} flex items-center justify-center text-white font-medium`}>
                                {getInitials(sharing.user.fullName)}
                              </div>
                              <div>
                                <div className="font-medium">{sharing.user.fullName}</div>
                                <div className="text-xs text-gray-400">
                                  Shared on {formatDate(sharing.createdAt)}
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs hover:bg-red-900/20 hover:text-red-400" 
                              onClick={() => {
                                unshareVideo(sharing.userId);
                                toast({
                                  title: "Video unshared",
                                  description: `You've removed ${sharing.user.fullName} from this video.`
                                });
                              }}
                            >
                              <i className="ri-close-line mr-1"></i>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        className="border-gray-700 w-full"
                        onClick={() => setShareDialogOpen(true)}
                      >
                        <i className="ri-share-line mr-1.5"></i>
                        Share with a Teacher
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Teacher Feedback Tab */}
            <TabsContent value="teachers" className="space-y-6 animate-slide-up">
              <TeacherFeedback
                comments={processedComments.filter((comment: any) => 
                  comment.user && comment.user.role === "teacher"
                )}
                onExportFeedback={handleExportFeedback}
                onSeek={handleSeekToTimestamp}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
