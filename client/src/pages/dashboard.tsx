import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);

  // Simulate progress loading for effect
  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      
      <main className="container p-4 mx-auto mt-16 mb-24">
        <h1 className="text-3xl font-bold text-gradient mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-6">Track your progress and activities</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <Card className="glassmorphism border-gray-700 text-white">
            <CardHeader>
              <CardTitle>My Stats</CardTitle>
              <CardDescription className="text-gray-400">Your activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Uploads</span>
                  <span className="font-semibold">{user?.role === "student" ? 12 : 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Received Feedback</span>
                  <span className="font-semibold">{user?.role === "student" ? 34 : 127}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Practice Streak</span>
                  <span className="font-semibold">7 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Progress Card */}
          <Card className="glassmorphism border-gray-700 text-white">
            <CardHeader>
              <CardTitle>Practice Goal</CardTitle>
              <CardDescription className="text-gray-400">Weekly target progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Weekly Practice: {progress}%</span>
                    <span className="text-sm font-medium">{progress}/100</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-gray-700" />
                </div>
                
                <button 
                  className="p-2 w-full rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                  onClick={() => {
                    toast({
                      title: "Feature coming soon",
                      description: "Practice tracking will be available soon!",
                    });
                  }}
                >
                  Log Practice Session
                </button>
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming Events/Tasks */}
          <Card className="glassmorphism border-gray-700 text-white">
            <CardHeader>
              <CardTitle>
                {user?.role === "student" ? "Upcoming Deadlines" : "Student Submissions"}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {user?.role === "student" ? "Items due soon" : "Recent submissions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {user?.role === "student" ? (
                  // Student upcoming deadlines
                  <>
                    <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                      <div className="font-medium">Weekly Scale Practice</div>
                      <div className="text-sm text-gray-400">Due in 2 days</div>
                    </div>
                    <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                      <div className="font-medium">Bach Invention Recording</div>
                      <div className="text-sm text-gray-400">Due in 5 days</div>
                    </div>
                  </>
                ) : (
                  // Teacher submissions to review
                  <>
                    <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                      <div className="font-medium">Emma Johnson</div>
                      <div className="text-sm text-gray-400">Scales Practice • 1 hour ago</div>
                    </div>
                    <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                      <div className="font-medium">Michael Chen</div>
                      <div className="text-sm text-gray-400">Chopin Etude • 3 hours ago</div>
                    </div>
                  </>
                )}
                
                <button 
                  className="p-2 w-full rounded-md bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 transition-colors"
                  onClick={() => {
                    toast({
                      title: "Feature coming soon",
                      description: user?.role === "student" 
                        ? "Calendar integration coming soon!"
                        : "Student management features coming soon!",
                    });
                  }}
                >
                  {user?.role === "student" ? "View All Deadlines" : "View All Submissions"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}