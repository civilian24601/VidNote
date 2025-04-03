import { Link, useLocation } from "wouter";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function MobileNav() {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="block sm:hidden fixed bottom-0 inset-x-0 header z-10 border-t border-gray-700">
      <div className="flex justify-around">
        {user?.role === "student" ? (
          // Student mobile navigation
          <>
            <Link href="/videos" className={`flex flex-col items-center py-2 px-3 ${
                location === "/videos" ? "text-primary" : "text-gray-300"
              }`}>
                <i className="ri-video-line text-xl"></i>
                <span className="text-xs mt-1">My Videos</span>
            </Link>
            <Link href="/shared" className={`flex flex-col items-center py-2 px-3 ${
                location === "/shared" ? "text-primary" : "text-gray-300"
              }`}>
                <i className="ri-feedback-line text-xl"></i>
                <span className="text-xs mt-1">Feedback</span>
            </Link>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center py-2 px-3 text-gray-300 relative">
                  <div className="w-14 h-14 rounded-full btn-gradient flex items-center justify-center text-white absolute -top-8 shadow-lg">
                    <i className="ri-add-line text-2xl"></i>
                  </div>
                  <span className="text-xs mt-8">Upload</span>
                </button>
              </DialogTrigger>
              <DialogContent className="glassmorphism text-white border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-gradient text-xl">Upload a new video</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-300">
                    Select a video file from your device to upload.
                  </p>
                  <div className="grid place-items-center p-6 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/30">
                    <i className="ri-upload-cloud-2-line text-4xl text-primary/80"></i>
                    <p className="mt-3 text-sm text-gray-300">Click to select a video</p>
                    <input
                      type="file"
                      accept="video/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        // Handle file selection
                        if (e.target.files && e.target.files[0]) {
                          // Preview logic would go here
                          setUploadDialogOpen(false);
                          toast({
                            title: "Upload initiated",
                            description: "Your video is being processed.",
                          });
                        }
                      }}
                    />
                  </div>
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800/50" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Link href="/dashboard" className={`flex flex-col items-center py-2 px-3 ${
                location === "/dashboard" ? "text-primary" : "text-gray-300"
              }`}>
                <i className="ri-dashboard-line text-xl"></i>
                <span className="text-xs mt-1">Dashboard</span>
            </Link>
            <Link href="/profile" className={`flex flex-col items-center py-2 px-3 ${
                location === "/profile" ? "text-primary" : "text-gray-300"
              }`}>
                <i className="ri-user-line text-xl"></i>
                <span className="text-xs mt-1">Profile</span>
            </Link>
          </>
        ) : (
          // Teacher mobile navigation
          <>
            <Link href="/students" className={`flex flex-col items-center py-2 px-3 ${
                location === "/students" ? "text-primary" : "text-gray-300"
              }`}>
                <i className="ri-user-line text-xl"></i>
                <span className="text-xs mt-1">Students</span>
            </Link>
            <Link href="/shared" className={`flex flex-col items-center py-2 px-3 ${
                location === "/shared" ? "text-primary" : "text-gray-300"
              }`}>
                <i className="ri-video-line text-xl"></i>
                <span className="text-xs mt-1">Reviews</span>
            </Link>
            <Link href="/dashboard" className={`flex flex-col items-center py-2 px-3 ${
                location === "/dashboard" ? "text-primary" : "text-gray-300"
              }`}>
                <i className="ri-dashboard-line text-xl"></i>
                <span className="text-xs mt-1">Dashboard</span>
            </Link>
            <Link href="/analytics" className={`flex flex-col items-center py-2 px-3 ${
                location === "/analytics" ? "text-primary" : "text-gray-300"
              }`}>
                <i className="ri-bar-chart-line text-xl"></i>
                <span className="text-xs mt-1">Analytics</span>
            </Link>
            <Link href="/profile" className={`flex flex-col items-center py-2 px-3 ${
                location === "/profile" ? "text-primary" : "text-gray-300"
              }`}>
                <i className="ri-settings-line text-xl"></i>
                <span className="text-xs mt-1">Settings</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
