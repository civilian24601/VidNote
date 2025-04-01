import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MOCK_USERS } from "@/lib/mockData"; 
import { StudentGroups } from "@/components/dashboard/student-groups";
import { StudentProgress } from "@/components/dashboard/student-progress";
import { TeacherNotes } from "@/components/dashboard/teacher-notes";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  // Simulate progress loading for effect
  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter mock users to get just students
  const mockStudents = MOCK_USERS.filter(user => user.role === "student");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      
      <main className="container p-4 mx-auto mt-16 mb-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Dashboard</h1>
            <p className="text-gray-400">Track your progress and manage your activities</p>
          </div>

          {user?.role === "teacher" && (
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <Button className="btn-gradient">
                <i className="ri-user-add-line mr-1.5"></i>
                Add Student
              </Button>
            </div>
          )}
        </div>
        
        {user?.role === "teacher" ? (
          // Teacher Dashboard
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 bg-gray-900/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {/* Stats Card */}
                <Card className="glassmorphism border-gray-700 text-white">
                  <CardHeader>
                    <CardTitle>Teacher Stats</CardTitle>
                    <CardDescription className="text-gray-400">Your activity overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Active Students</span>
                        <span className="font-semibold">{mockStudents.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Feedback Given</span>
                        <span className="font-semibold">127</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">This Week's Sessions</span>
                        <span className="font-semibold">14</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent Activity */}
                <Card className="glassmorphism border-gray-700 text-white">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription className="text-gray-400">Latest student activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                        <div className="font-medium">Emma Johnson</div>
                        <div className="text-sm text-gray-400">Uploaded new video • 1 hour ago</div>
                      </div>
                      <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                        <div className="font-medium">Michael Chen</div>
                        <div className="text-sm text-gray-400">Completed assignment • 3 hours ago</div>
                      </div>
                      <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                        <div className="font-medium">Sofia Rodriguez</div>
                        <div className="text-sm text-gray-400">Started new practice goal • 1 day ago</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Quick Actions */}
                <Card className="glassmorphism border-gray-700 text-white">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription className="text-gray-400">Common tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <Button className="w-full flex justify-start bg-gray-800 hover:bg-gray-700">
                        <i className="ri-video-upload-line mr-1.5"></i>
                        Create Assignment
                      </Button>
                      <Button className="w-full flex justify-start bg-gray-800 hover:bg-gray-700">
                        <i className="ri-calendar-event-line mr-1.5"></i>
                        Schedule Lesson
                      </Button>
                      <Button className="w-full flex justify-start bg-gray-800 hover:bg-gray-700">
                        <i className="ri-message-3-line mr-1.5"></i>
                        Message Students
                      </Button>
                      <Button className="w-full flex justify-start bg-gray-800 hover:bg-gray-700">
                        <i className="ri-file-chart-line mr-1.5"></i>
                        View Reports
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Student Progress Section */}
              <div className="mb-10">
                <StudentProgress students={mockStudents} />
              </div>
              
              {/* Teacher Notes Section */}
              <div className="mb-10">
                <TeacherNotes students={mockStudents} />
              </div>
            </TabsContent>
            
            <TabsContent value="students" className="mt-0">
              <div className="mb-10">
                <StudentGroups students={mockStudents} />
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recently Active Students</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockStudents.slice(0, 6).map((student, index) => (
                    <Card key={index} className="glassmorphism border-gray-700 text-white hover:border-primary/30 transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{student.fullName}</CardTitle>
                          <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                            {index % 2 === 0 ? "Active today" : "2 days ago"}
                          </span>
                        </div>
                        <CardDescription className="text-gray-400">
                          {index % 3 === 0 ? "Piano • Advanced" : 
                           index % 3 === 1 ? "Violin • Intermediate" : 
                           "Guitar • Beginner"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Weekly Practice</span>
                            <span>{50 + index * 5}%</span>
                          </div>
                          <Progress value={50 + index * 5} className="h-1" />
                          
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-gray-400">Videos</span>
                            <span>{5 + index}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Comments</span>
                            <span>{12 + index * 2}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-0">
              <Card className="glassmorphism border-gray-700 text-white mb-6">
                <CardHeader>
                  <CardTitle>Coming Soon</CardTitle>
                  <CardDescription className="text-gray-400">
                    Advanced analytics features are under development
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <i className="ri-line-chart-line text-5xl text-primary/50 mb-4"></i>
                  <p className="text-gray-300">
                    Detailed student practice analytics, performance tracking, and progress visualization
                    will be available in the next update.
                  </p>
                  <Button className="mt-6" variant="outline" onClick={() => {
                    toast({
                      title: "Feature coming soon",
                      description: "Analytics will be available in the next update!",
                    });
                  }}>
                    <i className="ri-notification-line mr-1.5"></i>
                    Notify Me When Available
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Student Dashboard
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
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Received Feedback</span>
                    <span className="font-semibold">34</span>
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
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription className="text-gray-400">Items due soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                    <div className="font-medium">Weekly Scale Practice</div>
                    <div className="text-sm text-gray-400">Due in 2 days</div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                    <div className="font-medium">Bach Invention Recording</div>
                    <div className="text-sm text-gray-400">Due in 5 days</div>
                  </div>
                  
                  <button 
                    className="p-2 w-full rounded-md bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 transition-colors"
                    onClick={() => {
                      toast({
                        title: "Feature coming soon",
                        description: "Calendar integration coming soon!",
                      });
                    }}
                  >
                    View All Deadlines
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      
      <MobileNav />
    </div>
  );
}