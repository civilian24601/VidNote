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
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 sm:pb-0">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Videos</h1>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1.5">
                <i className="ri-add-line"></i>
                Upload Video
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload new video</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter video title" {...field} />
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
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what you're working on"
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
                        <FormLabel>Video file</FormLabel>
                        <FormControl>
                          <div className="grid place-items-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                            {selectedFile ? (
                              <div className="text-center">
                                <i className="ri-file-video-line text-3xl text-primary-500"></i>
                                <p className="mt-2 text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  className="mt-2"
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
                                <i className="ri-upload-cloud-2-line text-3xl text-gray-400"></i>
                                <p className="mt-2 text-sm text-gray-500">Click to select a video file</p>
                                <input
                                  type="file"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  accept="video/*"
                                  onChange={handleFileChange}
                                  {...field}
                                />
                              </>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? "Uploading..." : "Upload Video"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div 
                  className="h-40 bg-gray-200 relative cursor-pointer"
                  onClick={() => navigate(`/watch/${video.id}`)}
                >
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <i className="ri-video-line text-4xl text-gray-400"></i>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                      <i className="ri-play-fill text-2xl"></i>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 
                    className="text-lg font-medium text-gray-900 truncate cursor-pointer"
                    onClick={() => navigate(`/watch/${video.id}`)}
                  >
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(video.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <i className="ri-video-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No videos yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload your first practice video to get started.
            </p>
            <Button 
              className="mt-6"
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Video
            </Button>
          </div>
        )}
      </main>
      
      <MobileNav />
    </div>
  );
}
