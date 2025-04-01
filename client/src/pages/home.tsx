import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  Music, Upload, Clock, Lock, Headphones, Users, 
  MessageSquare, Award, TrendingUp, ArrowRight, Sparkles,
  Lightbulb, GraduationCap, Share2, Layers, Mic, Star
} from "lucide-react";

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
        {/* Hero Section */}
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

        {/* Features & How It Works Combined Section */}
        <div className="py-20 sm:py-24 bg-gradient-to-b from-card/50 to-background/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Features Section */}
            <div ref={featuresRef}>
              <div className="lg:text-center features-heading">
                <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
                <p className="mt-3 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                  Perfect for music education
                </p>
                <p className="mt-5 max-w-2xl text-xl text-gray-300 lg:mx-auto">
                  A dedicated video feedback platform built for musicians and music teachers.
                </p>
              </div>

              <div ref={featureCardsRef} className="mt-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
            
            {/* Divider */}
            <div className="relative my-20">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background/20 backdrop-blur-sm px-6 text-sm text-primary">HOW IT WORKS</span>
              </div>
            </div>
            
            {/* How It Works Section */}
            <div className="text-center mb-16">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">How it works</h2>
              <p className="mt-3 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                Improve faster with focused feedback
              </p>
              <p className="mt-5 max-w-2xl mx-auto text-xl text-gray-300">
                Our platform makes it easy to get the specific guidance you need to advance your musical skills.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
              <div className="relative">
                <div className="h-52 w-full overflow-hidden rounded-2xl mb-6 glassmorphism p-1">
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                      alt="Recording a music performance" 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                </div>
                <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Record & Upload</h3>
                <p className="text-gray-300">
                  Capture your musical practice or performance and upload it to the platform in just a few clicks.
                </p>
              </div>

              <div className="relative">
                <div className="h-52 w-full overflow-hidden rounded-2xl mb-6 glassmorphism p-1">
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                      alt="Sharing with teachers" 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                </div>
                <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Share With Teachers</h3>
                <p className="text-gray-300">
                  Invite your instructors to view your video and provide specific, timestamped feedback.
                </p>
              </div>

              <div className="relative">
                <div className="h-52 w-full overflow-hidden rounded-2xl mb-6 glassmorphism p-1">
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1513682121497-80211f36a7d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                      alt="Receiving feedback" 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                </div>
                <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Improve With Feedback</h3>
                <p className="text-gray-300">
                  Review feedback at the exact moments it applies to, helping you focus your practice on specific areas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Testimonials</h2>
              <p className="mt-3 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                What musicians are saying
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="card p-8 rounded-2xl glassmorphism hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-bold">Sarah Johnson</h4>
                    <p className="text-gray-400 text-sm">Piano Student</p>
                  </div>
                </div>
                <p className="text-gray-300 italic flex-grow">
                  "With VidNote, I get detailed feedback on my piano technique that would be impossible to convey in just a lesson. My teacher can pinpoint exactly where my hand position needs adjustment."
                </p>
                <div className="mt-6 flex text-primary gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>

              <div className="card p-8 rounded-2xl glassmorphism hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-bold">Michael Chen</h4>
                    <p className="text-gray-400 text-sm">Violin Teacher</p>
                  </div>
                </div>
                <p className="text-gray-300 italic flex-grow">
                  "As a teacher with 20+ students, VidNote has revolutionized how I provide feedback between lessons. I can give detailed guidance exactly where it's needed, saving time in our in-person sessions."
                </p>
                <div className="mt-6 flex text-primary gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>

              <div className="card p-8 rounded-2xl glassmorphism hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-bold">Emma Martinez</h4>
                    <p className="text-gray-400 text-sm">Guitar Student</p>
                  </div>
                </div>
                <p className="text-gray-300 italic flex-grow">
                  "Getting feedback from multiple teachers has been incredible. Each instructor focuses on different aspects of my playing, giving me a well-rounded perspective that's improved my technique dramatically."
                </p>
                <div className="mt-6 flex text-primary gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background/80 to-background">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block p-1 rounded-full bg-primary/20 mb-8">
              <div className="w-20 h-20 rounded-full bg-primary/30 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8 text-white">
              Ready to accelerate your musical progress?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Join thousands of musicians who are improving faster with personalized, timestamped feedback from their teachers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="btn-gradient text-lg" size="lg" onClick={() => navigate("/register")}>
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button className="glassmorphism text-lg border-primary/40" variant="outline" size="lg" onClick={() => navigate("/login")}>
                Login to Your Account
              </Button>
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