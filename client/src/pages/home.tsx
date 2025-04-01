import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Music, Upload, Clock, Lock, Headphones, Users, 
  MessageSquare, Award, TrendingUp, ArrowRight, Sparkles,
  Lightbulb, GraduationCap, Share2, Layers, Mic, Star,
  ChevronLeft, ChevronRight
} from "lucide-react";

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

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
  
  // Refs for animations
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const featureCardsRef = useRef<HTMLDivElement>(null);
  
  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/videos");
    }
  }, [isAuthenticated, navigate]);
  
  // Hero animations
  useEffect(() => {
    if (heroRef.current) {
      const tl = gsap.timeline();
      
      tl.from(".hero-title span:first-child", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      })
      .from(".hero-title span:last-child", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.6")
      .from(".hero-text", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.6")
      .from(".hero-buttons", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.6");
    }
  }, []);
  
  // Feature section animations
  useEffect(() => {
    if (featuresRef.current) {
      gsap.from(".features-heading", {
        scrollTrigger: {
          trigger: ".features-heading",
          start: "top 80%"
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
      });
    }
    
    if (featureCardsRef.current) {
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: ".feature-card",
          start: "top 80%"
        },
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: "power3.out"
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main>
        {/* Hero Section */}
        <div className="relative overflow-hidden animated-bg pt-2">
          <div ref={heroRef} className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="pt-8 pb-8 md:pt-10 md:pb-10 lg:pt-12 lg:pb-16">
              <div className="md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
                <h1 className="hero-title text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                  <span className="block text-white">Better feedback for</span>
                  <span className="block text-gradient">music practice</span>
                </h1>
                <p className="hero-text mt-3 text-base text-gray-300 max-w-3xl">
                  VidNote helps music students get timestamped feedback on their practice
                  videos from teachers and peers. Upload a video, share it, and receive
                  detailed comments aligned to specific moments in your performance.
                </p>
                <div className="hero-buttons mt-4 flex flex-wrap gap-3">
                  <Button className="btn-gradient" onClick={() => navigate("/register")}>
                    Get Started
                  </Button>
                  <Button className="glassmorphism" variant="outline" onClick={() => navigate("/login")}>
                    Log in
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features & How It Works Combined Section */}
        <div className="py-8 sm:py-12 bg-gradient-to-b from-card/50 to-background/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Features Section */}
            <div ref={featuresRef}>
              <div className="lg:text-center features-heading">
                <h2 className="text-sm text-primary font-semibold tracking-wide uppercase">Features</h2>
                <p className="mt-2 text-2xl leading-8 font-extrabold tracking-tight text-white sm:text-3xl">
                  Perfect for music education
                </p>
                <p className="mt-3 max-w-2xl text-base text-gray-300 lg:mx-auto">
                  A dedicated video feedback platform built for musicians and music teachers.
                </p>
              </div>

              <div ref={featureCardsRef} className="mt-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="feature-card card p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Simple Video Upload</h3>
                    <p className="mt-2 text-gray-300 text-sm">
                      Upload your practice videos directly from your device with just a few clicks.
                    </p>
                  </div>

                  <div className="feature-card card p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Timestamped Feedback</h3>
                    <p className="mt-2 text-gray-300 text-sm">
                      Comments are tied to specific moments in your video for precise feedback.
                    </p>
                  </div>

                  <div className="feature-card card p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Private & Secure</h3>
                    <p className="mt-2 text-gray-300 text-sm">
                      Your videos are private by default and only visible to people you invite.
                    </p>
                  </div>

                  <div className="feature-card card p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Music Focus</h3>
                    <p className="mt-2 text-gray-300 text-sm">
                      Built specifically for music education with features tailored for musicians.
                    </p>
                  </div>

                  <div className="feature-card card p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                      <Headphones className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Audio Comments</h3>
                    <p className="mt-2 text-gray-300 text-sm">
                      Teachers can provide audio feedback for more nuanced performance insights.
                    </p>
                  </div>

                  <div className="feature-card card p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Collaborative Learning</h3>
                    <p className="mt-2 text-gray-300 text-sm">
                      Multiple teachers can provide feedback on the same performance video.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Divider with How It Works Title */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/10"></div>
              </div>
              <div className="relative flex justify-center text-center">
                <div className="bg-background/20 backdrop-blur-sm px-6 py-2">
                  <h2 className="text-sm text-primary font-semibold tracking-wide uppercase">How it works</h2>
                  <p className="mt-1 text-2xl leading-8 font-extrabold tracking-tight text-white sm:text-3xl">
                    Improve faster with focused feedback
                  </p>
                  <p className="mt-2 max-w-2xl mx-auto text-base text-gray-300">
                    Our platform makes it easy to get the specific guidance you need to advance your musical skills.
                  </p>
                </div>
              </div>
            </div>
            
            {/* How It Works Content */}

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3">
              <div className="relative">
                <div className="h-40 w-full overflow-hidden rounded-lg mb-4 glassmorphism p-1">
                  <div className="w-full h-full rounded-md overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                      alt="Recording a music performance" 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                </div>
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Record & Upload</h3>
                <p className="text-gray-300 text-sm">
                  Capture your musical practice or performance and upload it to the platform in just a few clicks.
                </p>
              </div>

              <div className="relative">
                <div className="h-40 w-full overflow-hidden rounded-lg mb-4 glassmorphism p-1">
                  <div className="w-full h-full rounded-md overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                      alt="Sharing with teachers" 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                </div>
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Share With Teachers</h3>
                <p className="text-gray-300 text-sm">
                  Invite your instructors to view your video and provide specific, timestamped feedback.
                </p>
              </div>

              <div className="relative">
                <div className="h-40 w-full overflow-hidden rounded-lg mb-4 glassmorphism p-1">
                  <div className="w-full h-full rounded-md overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1513682121497-80211f36a7d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                      alt="Receiving feedback" 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                </div>
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Improve With Feedback</h3>
                <p className="text-gray-300 text-sm">
                  Review feedback at the exact moments it applies to, helping you focus your practice on specific areas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials with Horizontal Scroll */}
        <div className="py-6 px-4 sm:px-6 lg:px-8 bg-card/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-sm text-primary font-semibold tracking-wide uppercase">Testimonials</h2>
              <p className="mt-1 text-2xl leading-8 font-extrabold tracking-tight text-white sm:text-3xl">
                What musicians are saying
              </p>
            </div>

            <div className="relative mt-4">
              {/* Carousel Navigation */}
              <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-10">
                <button 
                  className={`p-2 rounded-full bg-primary/30 ${!prevBtnEnabled ? 'opacity-30' : 'hover:bg-primary/50'}`}
                  onClick={scrollPrev}
                  disabled={!prevBtnEnabled}
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                <button 
                  className={`p-2 rounded-full bg-primary/30 ${!nextBtnEnabled ? 'opacity-30' : 'hover:bg-primary/50'}`}
                  onClick={scrollNext}
                  disabled={!nextBtnEnabled}
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              </div>

              {/* Carousel Container */}
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {/* Testimonial Card 1 */}
                  <div className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] mx-2">
                    <div className="card p-4 rounded-xl glassmorphism hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                          <Music className="h-4 w-4 text-primary" />
                        </div>
                        <div className="ml-2">
                          <h4 className="text-white font-bold text-sm">Sarah Johnson</h4>
                          <p className="text-gray-400 text-xs">Piano Student</p>
                        </div>
                      </div>
                      <p className="text-gray-300 italic flex-grow text-xs">
                        "With VidNote, I get detailed feedback on my piano technique that would be impossible to convey in just a lesson. My teacher can pinpoint exactly where my hand position needs adjustment."
                      </p>
                      <div className="mt-3 flex text-primary gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Card 2 */}
                  <div className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] mx-2">
                    <div className="card p-4 rounded-xl glassmorphism hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                          <Music className="h-4 w-4 text-primary" />
                        </div>
                        <div className="ml-2">
                          <h4 className="text-white font-bold text-sm">Michael Chen</h4>
                          <p className="text-gray-400 text-xs">Violin Teacher</p>
                        </div>
                      </div>
                      <p className="text-gray-300 italic flex-grow text-xs">
                        "As a teacher with 20+ students, VidNote has revolutionized how I provide feedback between lessons. I can give detailed guidance exactly where it's needed, saving time in our in-person sessions."
                      </p>
                      <div className="mt-3 flex text-primary gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Card 3 */}
                  <div className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] mx-2">
                    <div className="card p-4 rounded-xl glassmorphism hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                          <Music className="h-4 w-4 text-primary" />
                        </div>
                        <div className="ml-2">
                          <h4 className="text-white font-bold text-sm">Emma Martinez</h4>
                          <p className="text-gray-400 text-xs">Guitar Student</p>
                        </div>
                      </div>
                      <p className="text-gray-300 italic flex-grow text-xs">
                        "Getting feedback from multiple teachers has been incredible. Each instructor focuses on different aspects of my playing, giving me a well-rounded perspective that's improved my technique dramatically."
                      </p>
                      <div className="mt-3 flex text-primary gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Card 4 */}
                  <div className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] mx-2">
                    <div className="card p-4 rounded-xl glassmorphism hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                          <Music className="h-4 w-4 text-primary" />
                        </div>
                        <div className="ml-2">
                          <h4 className="text-white font-bold text-sm">James Wilson</h4>
                          <p className="text-gray-400 text-xs">Drum Teacher</p>
                        </div>
                      </div>
                      <p className="text-gray-300 italic flex-grow text-xs">
                        "VidNote has changed how I teach percussion. Being able to annotate videos at precise moments helps students understand exactly when their timing is off or when they need to adjust their technique."
                      </p>
                      <div className="mt-3 flex text-primary gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Card 5 */}
                  <div className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] mx-2">
                    <div className="card p-4 rounded-xl glassmorphism hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                          <Music className="h-4 w-4 text-primary" />
                        </div>
                        <div className="ml-2">
                          <h4 className="text-white font-bold text-sm">Olivia Taylor</h4>
                          <p className="text-gray-400 text-xs">Cello Student</p>
                        </div>
                      </div>
                      <p className="text-gray-300 italic flex-grow text-xs">
                        "The ability to receive feedback from multiple teachers has been transformative. Each focuses on different aspects of my bowing technique, which has helped me improve much faster than with just one teacher."
                      </p>
                      <div className="mt-3 flex text-primary gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background/80 to-background">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block p-1 rounded-full bg-primary/20 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-white">
              Ready to accelerate your musical progress?
            </h2>
            <p className="text-base text-gray-300 max-w-3xl mx-auto mb-4">
              Join thousands of musicians who are improving faster with personalized, timestamped feedback from their teachers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button className="btn-gradient" onClick={() => navigate("/register")}>
                Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button className="glassmorphism border-primary/40" variant="outline" onClick={() => navigate("/login")}>
                Login to Your Account
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-5 px-4 sm:px-6 lg:px-8 bg-background/70 backdrop-blur-sm border-t border-primary/10">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Music className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-lg text-gradient">VidNote</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            © {new Date().getFullYear()} VidNote. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}