import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export function MobileNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="block sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10">
      <div className="flex justify-around">
        <Link href="/videos">
          <a className={`flex flex-col items-center py-2 px-3 ${
            location === "/videos" ? "text-primary-500" : "text-gray-500"
          }`}>
            <i className="ri-video-line text-xl"></i>
            <span className="text-xs mt-1">Videos</span>
          </a>
        </Link>
        <Link href="/shared">
          <a className={`flex flex-col items-center py-2 px-3 ${
            location === "/shared" ? "text-primary-500" : "text-gray-500"
          }`}>
            <i className="ri-share-line text-xl"></i>
            <span className="text-xs mt-1">Shared</span>
          </a>
        </Link>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center py-2 px-3 text-gray-500 relative">
              <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white absolute -top-6">
                <i className="ri-add-line text-xl"></i>
              </div>
              <span className="text-xs mt-7">Upload</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload a new video</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                Select a video file from your device to upload.
              </p>
              <div className="grid place-items-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <i className="ri-upload-cloud-2-line text-3xl text-gray-400"></i>
                <p className="mt-2 text-sm text-gray-500">Click to select a video</p>
                <input
                  type="file"
                  accept="video/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    // Handle file selection
                    if (e.target.files && e.target.files[0]) {
                      // Preview logic would go here
                      setUploadDialogOpen(false);
                    }
                  }}
                />
              </div>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <button className="flex flex-col items-center py-2 px-3 text-gray-500">
          <i className="ri-notification-3-line text-xl"></i>
          <span className="text-xs mt-1">Alerts</span>
        </button>
        <button className="flex flex-col items-center py-2 px-3 text-gray-500">
          <i className="ri-user-line text-xl"></i>
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
}
