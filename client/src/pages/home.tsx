import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Music, Upload, Clock, Lock, Headphones, Users, Star,
  ChevronLeft, ChevronRight
} from "lucide-react";

export default function Home() {
  const [_, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Embla carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);
  
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);
  
  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/videos");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pt-16 pb-16 md:pt-20 md:pb-20 lg:pt-24 lg:pb-28">
              <div className="md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                  <span className="block text-white">Better feedback for</span>
                  <span className="block text-gradient">music practice</span>
                </h1>
                <p className="mt-6 text-xl text-gray-300 max-w-3xl">
                  VidNote helps music students get timestamped feedback on their practice
                  videos from teachers and peers. Upload a video, share it, and receive
                  detailed comments aligned to specific moments in your performance.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a 
                    href="/register"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/register");
                    }}
                    className="inline-flex items-center justify-center px-8 py-3 text-lg font-bold rounded-md cursor-pointer bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    Get Started
                  </a>
                  <a 
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login");
                    }}
                    className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white border border-primary/30 bg-black/50 rounded-md hover:bg-primary/10 cursor-pointer transition-colors"
                  >
                    Log In
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-card/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div>
              <div className="text-center">
                <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
                <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                  Perfect for music education
                </p>
                <p className="mt-4 max-w-2xl text-lg text-gray-300 mx-auto">
                  A dedicated video feedback platform built for musicians and music teachers.
                </p>
              </div>

              <div className="mt-12">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl flex flex-col h-full border-2 border-primary/50 hover:border-primary/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 shadow-md">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Simple Video Upload</h3>
                    <p className="mt-3 text-gray-200 text-base flex-grow">
                      Upload your practice videos directly from your device with just a few clicks.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl flex flex-col h-full border-2 border-primary/50 hover:border-primary/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 shadow-md">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Timestamped Feedback</h3>
                    <p className="mt-3 text-gray-200 text-base flex-grow">
                      Comments are tied to specific moments in your video for precise feedback.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl flex flex-col h-full border-2 border-primary/50 hover:border-primary/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 shadow-md">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Private & Secure</h3>
                    <p className="mt-3 text-gray-200 text-base flex-grow">
                      Your videos are private by default and only visible to people you invite.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl flex flex-col h-full border-2 border-primary/50 hover:border-primary/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 shadow-md">
                      <Music className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Music Focus</h3>
                    <p className="mt-3 text-gray-200 text-base flex-grow">
                      Built specifically for music education with features tailored for musicians.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl flex flex-col h-full border-2 border-primary/50 hover:border-primary/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 shadow-md">
                      <Headphones className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Audio Comments</h3>
                    <p className="mt-3 text-gray-200 text-base flex-grow">
                      Teachers can provide audio feedback for more nuanced performance insights.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl flex flex-col h-full border-2 border-primary/50 hover:border-primary/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 shadow-md">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Collaborative Learning</h3>
                    <p className="mt-3 text-gray-200 text-base flex-grow">
                      Multiple teachers can provide feedback on the same performance video.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Divider with How It Works Title */}
            <div className="relative mt-12 mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/10"></div>
              </div>
              <div className="relative flex justify-center text-center">
                <div className="bg-black px-8 py-4 rounded-lg">
                  <h2 className="text-base text-primary font-semibold tracking-wide uppercase">How it works</h2>
                  <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                    Improve faster with focused feedback
                  </p>
                  <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
                    Our platform makes it easy to get the specific guidance you need to advance your musical skills.
                  </p>
                </div>
              </div>
            </div>
            
            {/* How It Works Content */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-3 mt-12">
              <div className="relative p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl flex flex-col border-2 border-primary/50 transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  1
                </div>
                <div className="h-48 sm:h-56 w-full overflow-hidden rounded-lg mb-6 p-1 border border-primary/40">
                  <div className="w-full h-full rounded-md overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                      alt="Recording a music performance" 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Record & Upload</h3>
                <p className="text-gray-200 text-base">
                  Capture your musical practice or performance and upload it to the platform in just a few clicks.
                </p>
              </div>

              <div className="relative p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl flex flex-col border-2 border-primary/50 transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  2
                </div>
                <div className="h-48 sm:h-56 w-full overflow-hidden rounded-lg mb-6 p-1 border border-primary/40">
                  <div className="w-full h-full rounded-md overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                      alt="Sharing with teachers" 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Share With Teachers</h3>
                <p className="text-gray-200 text-base">
                  Invite your instructors to view your video and provide specific, timestamped feedback.
                </p>
              </div>

              <div className="relative p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl flex flex-col border-2 border-primary/50 transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  3
                </div>
                <div className="h-48 sm:h-56 w-full overflow-hidden rounded-lg mb-6 p-1 border border-primary/40">
                  <div className="w-full h-full rounded-md overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1513682121497-80211f36a7d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                      alt="Receiving feedback" 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Improve With Feedback</h3>
                <p className="text-gray-200 text-base">
                  Review feedback at the exact moments it applies to, helping you focus your practice on specific areas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials with Horizontal Scroll */}
        <div className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Testimonials</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                What musicians are saying
              </p>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
                See how VidNote is helping musicians around the world improve their skills
              </p>
            </div>

            <div className="relative mt-8">
              {/* Carousel Navigation */}
              <div className="absolute top-1/2 -left-6 -translate-y-1/2 z-10">
                <button 
                  className={`p-3 rounded-full bg-primary/30 ${!prevBtnEnabled ? 'opacity-30' : 'hover:bg-primary/50'}`}
                  onClick={scrollPrev}
                  disabled={!prevBtnEnabled}
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className="absolute top-1/2 -right-6 -translate-y-1/2 z-10">
                <button 
                  className={`p-3 rounded-full bg-primary/30 ${!nextBtnEnabled ? 'opacity-30' : 'hover:bg-primary/50'}`}
                  onClick={scrollNext}
                  disabled={!nextBtnEnabled}
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Carousel Container */}
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex py-6">
                  {/* Testimonial Card 1 */}
                  <div className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] mx-3">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-white font-bold text-lg">Sarah Johnson</h4>
                          <p className="text-gray-400 text-sm">Piano Student</p>
                        </div>
                      </div>
                      <p className="text-gray-200 italic flex-grow text-base">
                        "With VidNote, I get detailed feedback on my piano technique that would be impossible to convey in just a lesson. My teacher can pinpoint exactly where my hand position needs adjustment."
                      </p>
                      <div className="mt-4 flex text-primary gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-5 w-5 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Card 2 */}
                  <div className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] mx-3">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-white font-bold text-lg">Michael Chen</h4>
                          <p className="text-gray-400 text-sm">Violin Teacher</p>
                        </div>
                      </div>
                      <p className="text-gray-200 italic flex-grow text-base">
                        "As a teacher with 20+ students, VidNote has revolutionized how I provide feedback between lessons. I can give detailed guidance exactly where it's needed, saving time in our in-person sessions."
                      </p>
                      <div className="mt-4 flex text-primary gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-5 w-5 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Card 3 */}
                  <div className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] mx-3">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-white font-bold text-lg">Emma Martinez</h4>
                          <p className="text-gray-400 text-sm">Guitar Student</p>
                        </div>
                      </div>
                      <p className="text-gray-200 italic flex-grow text-base">
                        "Getting feedback from multiple teachers has been incredible. Each instructor focuses on different aspects of my playing, giving me a well-rounded perspective that's improved my technique dramatically."
                      </p>
                      <div className="mt-4 flex text-primary gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-5 w-5 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary/20 to-blue-500/20">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to improve your musical skills?</span>
              <span className="block text-primary mt-1">Start using VidNote today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <a
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/register");
                  }}
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 cursor-pointer"
                >
                  Get started
                </a>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/login");
                  }}
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Log in
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="bg-card/50">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-base text-gray-400">
                &copy; {new Date().getFullYear()} VidNote. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}