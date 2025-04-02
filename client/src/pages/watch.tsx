import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
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

// Import enhanced components
import EnhancedVideoPlayer from "@/components/video/enhanced-video-player";
import { CategorizedComments } from "@/components/video/categorized-comments";
import TeacherFeedback from "@/components/video/teacher-feedback";
import FeedbackExport from "@/components/video/feedback-export";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
  const { data: video, isLoading: isLoadingVideo, error: videoError } = useVideo(videoId);
  const { data: comments = [], isLoading: isLoadingComments, refetch: refetchComments } = useComments(videoId);
  const { data: sharingData, isLoading: isLoadingSharing } = useVideoSharing(videoId);
  const { mutateAsync: addComment } = useAddComment(videoId);
  const { mutateAsync: shareVideo, isPending: isSharing } = useShareVideo(videoId);
  const { mutateAsync: unshareVideo } = useUnshareVideo(videoId);
  const { toast } = useToast();
  
  // All React hooks declarations - placed at the top level to comply with rules of hooks
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [typingUsers, setTypingUsers] = useState<{ [key: number]: boolean }>({});
  const [activeTab, setActiveTab] = useState("comments");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoStatus, setVideoStatus] = useState<"loading" | "ready" | "error" | "processing">("loading");
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  
  // Real-time collaboration functionality has been removed as requested

  // Process sharing users
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
  
  // Form setup
  const form = useForm<ShareValues>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      teacherId: 0,
      customMessage: "",
    },
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Handle video status checking
  useEffect(() => {
    if (isLoadingVideo) {
      setVideoStatus("loading");
    } else if (videoError) {
      setVideoStatus("error");
    } else if (video) {
      // First check the videoStatus from the server
      console.log(`Video status from server: ${video.videoStatus}`);
      
      if (video.videoStatus === "ready") {
        setVideoStatus("ready");
        setIsVideoReady(true);
        return;
      }
      
      // Continue with existing checks only if server status isn't explicitly "ready"
      // Check if video exists but URL might not be valid yet
      if (!video.url || video.url.includes('undefined') || video.url.trim() === '') {
        setVideoStatus("processing");
      } else {
        // Try to load the video to verify it's accessible
        const checkVideoUrl = () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          fetch(video.url, {
            method: 'HEAD',
            signal: controller.signal
          })
            .then(response => {
              clearTimeout(timeoutId);
              if (response.ok) {
                setVideoStatus("ready");
                setIsVideoReady(true);
              } else {
                console.warn(`Video URL returned status ${response.status}`);
                setVideoStatus("processing");
              }
            })
            .catch(error => {
              clearTimeout(timeoutId);
              console.error("Error checking video URL:", error);
              if (error.name === 'AbortError') {
                console.warn("Video URL check timed out");
                setVideoStatus("processing");
              } else {
                setVideoStatus("error");
                setPlayerError(`Failed to load video: ${error.message}`);
              }
            });
        };

        checkVideoUrl();
      }
    }
  }, [isLoadingVideo, videoError, video]);

  // Handle comments
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

  // Handle video sharing
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

  // Handle adding comment at specific time
  const handleAddCommentAtTime = (time: number) => {
    setCurrentTime(time);
    
    // Scroll to comment section if needed
    if (activeTab !== "comments") {
      setActiveTab("comments");
    }
  };

  // Handle seeking to timestamps
  const handleSeekToTimestamp = (timestamp: number) => {
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

  // Process comments for display
  const processedComments = comments.map((comment: any) => {
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

  // Handle video retry
  const handleVideoRetry = () => {
    setVideoStatus("loading");
    setPlayerError(null);
    window.location.reload();
  };

  // Loading state
  if (isLoadingVideo) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-4">
            <Skeleton className="h-8 w-64" />
            <div className="ml-auto">
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl mb-6" />
          <div className="lg:flex lg:space-x-6">
            <div className="lg:w-2/3">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
            <div className="lg:w-1/3 mt-6 lg:mt-0">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-[280px] w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Video not found
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
        {/* Video Header with Status */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h1 className="text-2xl font-bold text-white">{video.title}</h1>
            
            {/* Video Status Badge */}
            {videoStatus === "processing" && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-600">
                <span className="mr-1.5">⚙️</span> Processing
              </Badge>
            )}
            {videoStatus === "ready" && (
              <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-600">
                <span className="mr-1.5">✓</span> Ready
              </Badge>
            )}
            {videoStatus === "error" && (
              <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-600">
                <span className="mr-1.5">⚠️</span> Error
              </Badge>
            )}
          </div>
          
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
              {videoStatus === "ready" && (
                <Button 
                  className="h-8 px-3 text-xs bg-primary text-white"
                  onClick={() => window.open(video.url, '_blank')}
                >
                  <i className="ri-download-line mr-1.5"></i>
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Video Status Messages */}
        {videoStatus === "processing" && (
          <Alert className="bg-yellow-500/10 border-yellow-600 mb-6">
            <AlertTitle className="text-yellow-300">Video is still processing</AlertTitle>
            <AlertDescription className="text-gray-300">
              Your video has been uploaded and is currently being processed. This usually takes a few minutes depending on the video size.
              The player will automatically update once processing is complete.
            </AlertDescription>
          </Alert>
        )}
        
        {videoStatus === "error" && (
          <Alert className="bg-red-500/10 border-red-600 mb-6">
            <AlertTitle className="text-red-300">Failed to load video</AlertTitle>
            <AlertDescription className="text-gray-300 mb-2">
              {playerError || "There was an error loading your video. This might be due to processing issues or an invalid file format."}
            </AlertDescription>
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-600 hover:bg-red-600/20 ml-auto"
              onClick={handleVideoRetry}
            >
              <i className="ri-refresh-line mr-1.5"></i>
              Try again
            </Button>
          </Alert>
        )}
        
        {/* Enhanced Video Player */}
        <div ref={videoPlayerRef}>
          {videoStatus === "ready" ? (
            <EnhancedVideoPlayer 
              videoUrl={video.url} 
              thumbnailUrl={video.thumbnailUrl}
              comments={processedComments}
              onTimeUpdate={(time) => setCurrentTime(time)}
              onCommentAtTime={handleAddCommentAtTime}
              onSeekToMarker={handleSeekToTimestamp}
            />
          ) : videoStatus === "processing" ? (
            <div className="glassmorphism border border-gray-700 rounded-md overflow-hidden">
              <div className="relative bg-gray-800 h-[400px] flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Video Processing</h3>
                  <p className="text-gray-300 max-w-md">
                    Your video is still being processed. This usually takes a few minutes. You can add comments and share the video while you wait.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glassmorphism border border-gray-700 rounded-md overflow-hidden">
              <div className="relative bg-gray-800 h-[400px] flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <i className="ri-error-warning-line text-4xl text-red-300"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Video Unavailable</h3>
                  <p className="text-gray-300 max-w-md mb-6">
                    {playerError || "There was an issue loading your video. This could be due to processing errors or permissions."}
                  </p>
                  <Button 
                    variant="outline"
                    className="border-red-600 hover:bg-red-600/20"
                    onClick={handleVideoRetry}
                  >
                    <i className="ri-refresh-line mr-1.5"></i>
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                    </div>
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