import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
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

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 sm:pb-0">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Shared with me</h1>
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
              <i className="ri-share-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No shared videos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Videos shared with you will appear here.
            </p>
          </div>
        )}
      </main>
      
      <MobileNav />
    </div>
  );
}
