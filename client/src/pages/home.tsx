import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";

export default function Home() {
  const [_, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/videos");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <div className="bg-white">
          <div className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32 lg:pb-36">
                <div className="md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
                  <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Better feedback for</span>
                    <span className="block text-primary-500">music practice</span>
                  </h1>
                  <p className="mt-6 text-lg text-gray-500 max-w-3xl">
                    VidNote helps music students get timestamped feedback on their practice
                    videos from teachers and peers. Upload a video, share it, and receive
                    detailed comments aligned to specific moments in your performance.
                  </p>
                  <div className="mt-10 flex space-x-4">
                    <Button size="lg" onClick={() => navigate("/register")}>
                      Get Started
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                      Log in
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-500 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Perfect for music education
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                A dedicated video feedback platform built for musicians and music teachers.
              </p>
            </div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 rounded-md bg-primary-100 flex items-center justify-center">
                    <i className="ri-video-upload-line text-xl text-primary-500"></i>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Simple Video Upload</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Upload your practice videos directly from your device with just a few clicks.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 rounded-md bg-primary-100 flex items-center justify-center">
                    <i className="ri-time-line text-xl text-primary-500"></i>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Timestamped Feedback</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Comments are tied to specific moments in your video for precise feedback.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 rounded-md bg-primary-100 flex items-center justify-center">
                    <i className="ri-lock-line text-xl text-primary-500"></i>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Private & Secure</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Your videos are private by default and only visible to people you invite.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 pt-8 flex flex-col items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-md bg-primary-500 flex items-center justify-center">
                <i className="ri-movie-2-line text-white text-lg"></i>
              </div>
              <span className="font-bold text-lg">VidNote</span>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              © {new Date().getFullYear()} VidNote. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
