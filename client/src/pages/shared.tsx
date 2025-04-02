import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useSharedVideos } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Shared() {
  const [_, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: videos, isLoading } = useSharedVideos();

  // Don't do anything here, redirection is handled by the ProtectedRoute wrapper

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 sm:pb-0">
      <Navbar />
      
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Teacher Feedback</h1>
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
                      Feedback
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 glassmorphism rounded-lg max-w-lg mx-auto animated-bg">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <i className="ri-share-line text-4xl text-primary"></i>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No feedback yet</h3>
            <p className="text-lg text-gray-300 mb-8">
              Videos that have received teacher feedback will appear here.
            </p>
          </div>
        )}
      </main>
      
      <MobileNav />
    </div>
  );
}
