import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useVideos, useUploadVideo } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  video: z.instanceof(File, { message: "Video file is required" }),
});

type UploadValues = z.infer<typeof uploadSchema>;

export default function Videos() {
  const [_, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { data: videos, isLoading } = useVideos();
  const { mutateAsync: uploadVideo, isPending: isUploading } = useUploadVideo();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<UploadValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (values: UploadValues) => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description || "");
    formData.append("video", selectedFile);
    formData.append("isPublic", "false");

    try {
      await uploadVideo(formData);
      toast({
        title: "Video uploaded successfully",
        description: "Your video has been uploaded and is ready to view.",
      });
      setUploadDialogOpen(false);
      form.reset();
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred while uploading your video.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setSelectedFile(file);
      form.setValue("video", file);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 sm:pb-0">
      <Navbar />
      
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">My Videos</h1>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient flex items-center gap-1.5 shadow-lg">
                <i className="ri-add-line"></i>
                Upload Video
              </Button>
            </DialogTrigger>
            <DialogContent className="glassmorphism text-white border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gradient text-xl">Upload new video</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter video title" className="bg-gray-800/50 border-gray-600 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what you're working on"
                            className="bg-gray-800/50 border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="video"
                    render={({ field: { value, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-white">Video file</FormLabel>
                        <FormControl>
                          <div className="grid place-items-center p-6 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/30">
                            {selectedFile ? (
                              <div className="text-center">
                                <i className="ri-file-video-line text-4xl text-primary"></i>
                                <p className="mt-2 text-sm font-medium text-white">{selectedFile.name}</p>
                                <p className="text-xs text-gray-300">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  className="mt-3 border-gray-600 text-white hover:bg-gray-800/50"
                                  onClick={() => {
                                    setSelectedFile(null);
                                    form.setValue("video", undefined as any);
                                  }}
                                >
                                  Change
                                </Button>
                              </div>
                            ) : (
                              <>
                                <i className="ri-upload-cloud-2-line text-4xl text-primary/80"></i>
                                <p className="mt-3 text-sm text-gray-300">Click to select a video file</p>
                                <input
                                  type="file"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  accept="video/*"
                                  onChange={handleFileChange}
                                />
                              </>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-3 mt-2">
                    <Button type="button" variant="outline" className="border-gray-600 text-white hover:bg-gray-800/50" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="btn-gradient" disabled={isUploading}>
                      {isUploading ? "Uploading..." : "Upload Video"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="card overflow-hidden border-primary/10">
                <Skeleton className="h-48" />
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="card overflow-hidden border-primary/10">
                <div 
                  className="h-48 relative cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/watch/${video.id}`)}
                >
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="w-full h-full object-cover transition-transform hover:scale-110 duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <i className="ri-video-line text-5xl text-primary/40"></i>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70 hover:opacity-90 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary/30 backdrop-blur-sm flex items-center justify-center text-white shadow-lg opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <i className="ri-play-fill text-3xl"></i>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 
                    className="text-lg font-semibold text-white truncate cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/watch/${video.id}`)}
                  >
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-400">
                      {video.createdAt ? formatDate(video.createdAt) : ""}
                    </p>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {video.videoStatus || "Private"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 glassmorphism rounded-lg max-w-lg mx-auto animated-bg">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <i className="ri-video-line text-4xl text-primary"></i>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No videos yet</h3>
            <p className="text-lg text-gray-300 mb-8">
              Upload your first practice video to get started with feedback from your teachers.
            </p>
            <Button 
              className="btn-gradient text-lg px-6 py-6 h-auto"
              onClick={() => setUploadDialogOpen(true)}
            >
              <i className="ri-upload-cloud-2-line mr-2"></i>
              Upload Your First Video
            </Button>
          </div>
        )}
      </main>
      
      <MobileNav />
    </div>
  );
}
