import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Music, Upload, Clock, Lock, Headphones, Users } from "lucide-react";

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [_, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  
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
        <div className="relative overflow-hidden animated-bg">
          <div ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pt-20 pb-24 md:pt-32 md:pb-32 lg:pt-40 lg:pb-40">
              <div className="md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
                <h1 className="hero-title text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                  <span className="block text-white">Better feedback for</span>
                  <span className="block text-gradient">music practice</span>
                </h1>
                <p className="hero-text mt-8 text-lg text-gray-300 max-w-3xl">
                  VidNote helps music students get timestamped feedback on their practice
                  videos from teachers and peers. Upload a video, share it, and receive
                  detailed comments aligned to specific moments in your performance.
                </p>
                <div className="hero-buttons mt-12 flex flex-wrap gap-4">
                  <Button className="btn-gradient text-lg" size="lg" onClick={() => navigate("/register")}>
                    Get Started
                  </Button>
                  <Button className="glassmorphism text-lg" variant="outline" size="lg" onClick={() => navigate("/login")}>
                    Log in
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-20 sm:py-28 bg-card/50">
          <div ref={featuresRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center features-heading">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-3 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                Perfect for music education
              </p>
              <p className="mt-5 max-w-2xl text-xl text-gray-300 lg:mx-auto">
                A dedicated video feedback platform built for musicians and music teachers.
              </p>
            </div>

            <div ref={featureCardsRef} className="mt-20">
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
                <div className="feature-card card p-6 rounded-lg">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-5">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Simple Video Upload</h3>
                  <p className="mt-3 text-gray-300">
                    Upload your practice videos directly from your device with just a few clicks.
                  </p>
                </div>

                <div className="feature-card card p-6 rounded-lg">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-5">
                    <Clock className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Timestamped Feedback</h3>
                  <p className="mt-3 text-gray-300">
                    Comments are tied to specific moments in your video for precise feedback.
                  </p>
                </div>

                <div className="feature-card card p-6 rounded-lg">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-5">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Private & Secure</h3>
                  <p className="mt-3 text-gray-300">
                    Your videos are private by default and only visible to people you invite.
                  </p>
                </div>

                <div className="feature-card card p-6 rounded-lg">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-5">
                    <Music className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Music Focus</h3>
                  <p className="mt-3 text-gray-300">
                    Built specifically for music education with features tailored for musicians.
                  </p>
                </div>

                <div className="feature-card card p-6 rounded-lg">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-5">
                    <Headphones className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Audio Comments</h3>
                  <p className="mt-3 text-gray-300">
                    Teachers can provide audio feedback for more nuanced performance insights.
                  </p>
                </div>

                <div className="feature-card card p-6 rounded-lg">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-5">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Collaborative Learning</h3>
                  <p className="mt-3 text-gray-300">
                    Multiple teachers can provide feedback on the same performance video.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-background/70 backdrop-blur-sm border-t border-primary/10">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Music className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xl text-gradient">VidNote</span>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            © {new Date().getFullYear()} VidNote. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
