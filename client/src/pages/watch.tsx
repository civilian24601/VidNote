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
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";

const shareSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ShareValues = z.infer<typeof shareSchema>;

export default function Watch({ params }: { params: { id: string } }) {
  const videoId = parseInt(params.id);
  const [_, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { data: video, isLoading: isLoadingVideo } = useVideo(videoId);
  const { data: comments = [], isLoading: isLoadingComments } = useComments(videoId);
  const { data: sharingData, isLoading: isLoadingSharing } = useVideoSharing(videoId);
  const { mutateAsync: addComment } = useAddComment(videoId);
  const { mutateAsync: shareVideo, isPending: isSharing } = useShareVideo(videoId);
  const { mutateAsync: unshareVideo } = useUnshareVideo(videoId);
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const sharingUsers = Array.isArray(sharingData) 
    ? sharingData.map((sharing: any) => ({
        ...sharing,
        user: sharing.user
      })) 
    : [];

  const form = useForm<ShareValues>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleAddComment = async (content: string, timestamp: number) => {
    try {
      await addComment({ content, timestamp });
      toast({
        title: "Comment added",
        description: `Your comment at ${Math.floor(timestamp / 60)}:${(timestamp % 60).toString().padStart(2, "0")} has been added.`,
      });
    } catch (error) {
      toast({
        title: "Failed to add comment",
        description: error instanceof Error ? error.message : "An error occurred while adding your comment.",
        variant: "destructive",
      });
    }
  };

  const handleShareVideo = async (values: ShareValues) => {
    try {
      // This is a simplification - in a real app, you'd need to look up the user ID by email
      // Since we don't have that API, we'll assume user ID 2 for demo purposes
      await shareVideo(2);
      toast({
        title: "Video shared",
        description: `You've shared this video with ${values.email}.`,
      });
      setShareDialogOpen(false);
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" className="bg-gray-800/50 border-gray-600 text-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-3 mt-2">
                  <Button type="button" variant="outline" className="border-gray-600 text-white hover:bg-gray-800/50" onClick={() => setShareDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-gradient" disabled={isSharing}>
                    {isSharing ? "Sharing..." : "Share Video"}
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
            
            {/* Feedback Summary Card */}
            <div className="mt-6 card glassmorphism rounded-xl overflow-hidden border-primary/10">
              <div className="p-4 border-b border-gray-800">
                <h2 className="font-semibold text-gradient">Feedback Summary</h2>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Technical Accuracy</span>
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Interpretation</span>
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Dynamics</span>
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "70%" }}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Tempo</span>
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Key Areas to Improve</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li className="flex items-start">
                      <i className="ri-focus-3-line text-primary mr-1.5 mt-0.5"></i>
                      <span>Consistent pedaling through chord changes</span>
                    </li>
                    <li className="flex items-start">
                      <i className="ri-focus-3-line text-primary mr-1.5 mt-0.5"></i>
                      <span>Left hand position and wrist height</span>
                    </li>
                  </ul>
                </div>
                
                <div className="mt-4">
                  <Button className="btn-gradient w-full inline-flex justify-center items-center">
                    <i className="ri-sticky-note-line mr-1.5"></i>
                    Generate Practice Notes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
