import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MOCK_USERS, MOCK_VIDEOS } from "@/lib/mockData";
import { getInitials, getAvatarColor, formatDate } from "@/lib/utils";

export default function StudentDetail({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Find the student from the mock data
  const studentId = parseInt(params.id);
  const student = MOCK_USERS.find(u => u.id === studentId);
  
  // Get student videos
  const studentVideos = MOCK_VIDEOS.filter(video => video.userId === studentId)
    .map(video => ({
      ...video,
      status: Math.random() > 0.5 ? "reviewed" : "pending" // Add status for display purposes
    }));
  
  // Mock practice data
  const mockPracticeData = [
    { week: "Week 1", hours: 4.5 },
    { week: "Week 2", hours: 3.2 },
    { week: "Week 3", hours: 5.7 },
    { week: "Week 4", hours: 4.0 }
  ];
  
  // Mock notes for this student
  const mockNotes = [
    {
      id: 1,
      date: new Date(2025, 3, 15),
      content: "Shows excellent progress with Bach inventions. Articulation has improved significantly.",
      category: "progress"
    },
    {
      id: 2,
      date: new Date(2025, 3, 8),
      content: "Needs to work on pedaling technique. Recommended specific exercises for next lesson.",
      category: "technique"
    },
    {
      id: 3,
      date: new Date(2025, 3, 1),
      content: "Ready to move on to Chopin nocturnes next semester. Expressiveness is developing well.",
      category: "repertoire"
    }
  ];

  useEffect(() => {
    // Redirect if not a teacher or if student not found
    if ((user && user.role !== "teacher") || !student) {
      setLocation("/");
    }
  }, [user, student, setLocation]);

  if (!user || user.role !== "teacher" || !student) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      
      <main className="container p-4 mx-auto mt-16 mb-24">
        {/* Student Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
          <Avatar className={`h-20 w-20 ${getAvatarColor(student.id)}`}>
            <AvatarFallback className="text-2xl text-white">
              {getInitials(student.fullName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gradient mb-1">{student.fullName}</h1>
            <div className="flex flex-wrap gap-2 items-center text-gray-400">
              <span>Piano • Intermediate</span>
              <span className="text-gray-600">|</span>
              <span>{student.email}</span>
              <span className="text-gray-600">|</span>
              <span>Student since Jan 2025</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mt-4 md:mt-0">
            <Button className="bg-primary text-white">
              <i className="ri-message-3-line mr-1.5"></i>
              Message
            </Button>
            <Button variant="outline" className="border-gray-700">
              <i className="ri-settings-line mr-1.5"></i>
              Manage
            </Button>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4 mb-6 bg-gray-900/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Card */}
              <Card className="glassmorphism border-gray-700 text-white">
                <CardHeader>
                  <CardTitle>Student Stats</CardTitle>
                  <CardDescription className="text-gray-400">Activity overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Videos</span>
                      <span className="font-semibold">{studentVideos.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Feedback Received</span>
                      <span className="font-semibold">27</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Practice Streak</span>
                      <span className="font-semibold">5 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Average Practice</span>
                      <span className="font-semibold">4.3 hrs/week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Activity Card */}
              <Card className="glassmorphism border-gray-700 text-white md:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription className="text-gray-400">Latest submissions and practice sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studentVideos.slice(0, 3).map((video, idx) => (
                      <div key={idx} className="p-3 rounded-md bg-gray-800/40 border border-gray-700 hover:bg-gray-800/60 transition-colors cursor-pointer" onClick={() => setLocation(`/watch/${video.id}`)}>
                        <div className="flex justify-between">
                          <div className="font-medium">{video.title}</div>
                          <Badge variant="outline" className="bg-gray-900/50">
                            {video.status === "reviewed" ? "Reviewed" : "Pending"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400 flex items-center mt-1">
                          <i className="ri-time-line mr-1.5"></i>
                          Uploaded {formatDate(video.createdAt)}
                        </div>
                      </div>
                    ))}
                    
                    <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                      <div className="font-medium">Practice Session</div>
                      <div className="text-sm text-gray-400 flex items-center mt-1">
                        <i className="ri-time-line mr-1.5"></i>
                        2 hours • Yesterday
                      </div>
                    </div>
                    
                    <button 
                      className="p-2 w-full rounded-md bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 transition-colors text-sm"
                      onClick={() => setActiveTab("videos")}
                    >
                      View All Activity
                    </button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Current Assignments */}
              <Card className="glassmorphism border-gray-700 text-white md:col-span-2">
                <CardHeader>
                  <CardTitle>Current Assignments</CardTitle>
                  <CardDescription className="text-gray-400">Pending tasks and deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                      <div className="flex justify-between">
                        <div className="font-medium">Bach Invention in F Major</div>
                        <Badge className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
                          Due Soon
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Due in 3 days</div>
                    </div>
                    
                    <div className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                      <div className="flex justify-between">
                        <div className="font-medium">Scale Mastery - Week 3</div>
                        <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                          In Progress
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Due in 10 days</div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="outline" className="border-gray-700 text-sm">
                        <i className="ri-add-line mr-1.5"></i>
                        Add Assignment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Practice Overview Card */}
              <Card className="glassmorphism border-gray-700 text-white">
                <CardHeader>
                  <CardTitle>Practice Overview</CardTitle>
                  <CardDescription className="text-gray-400">Weekly practice hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px] flex items-end justify-between gap-1">
                    {mockPracticeData.map((week, idx) => (
                      <div key={idx} className="flex flex-col items-center w-1/4">
                        <div className="text-xs text-gray-400 mb-1">{week.hours}h</div>
                        <div 
                          className="w-full bg-primary/30 rounded-t-sm" 
                          style={{ height: `${(week.hours/6) * 100}px` }}
                        ></div>
                        <div className="text-xs text-gray-400 mt-2">{week.week}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Monthly Average:</span>
                      <span className="font-medium">4.5 hours/week</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-400">Goal:</span>
                      <span className="font-medium">5 hours/week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-0">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Student Videos</h2>
              <div className="flex gap-2">
                <Button variant="outline" className="border-gray-700 text-sm">
                  <i className="ri-filter-line mr-1.5"></i>
                  Filter
                </Button>
                <Button className="text-sm">
                  <i className="ri-video-upload-line mr-1.5"></i>
                  Request Upload
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentVideos.map((video, idx) => (
                <Card key={idx} className="glassmorphism border-gray-700 text-white overflow-hidden hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setLocation(`/watch/${video.id}`)}>
                  <div className="aspect-video bg-gray-800 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <i className="ri-play-fill text-xl"></i>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-xs px-2 py-1 rounded">
                      {Math.floor(Math.random() * 10) + 1}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">{video.title}</CardTitle>
                      <Badge variant="outline" className={`${
                        video.status === "reviewed" 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {video.status === "reviewed" ? "Reviewed" : "Pending"}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">
                      Uploaded on {formatDate(video.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <i className="ri-message-3-line text-primary/80 mr-1"></i>
                        <span>{Math.floor(Math.random() * 20) + 1} comments</span>
                      </div>
                      <div className="flex items-center">
                        <i className="ri-eye-line text-primary/80 mr-1"></i>
                        <span>{Math.floor(Math.random() * 15) + 1} views</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Progress Tab */}
          <TabsContent value="progress" className="mt-0">
            <Card className="glassmorphism border-gray-700 text-white mb-6">
              <CardHeader>
                <CardTitle>Practice Analytics</CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed practice data coming soon
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <i className="ri-line-chart-line text-5xl text-primary/50 mb-4"></i>
                <p className="text-gray-300">
                  Advanced practice analytics, goal tracking, and performance metrics 
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
          
          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-0">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Teacher Notes</h2>
              <Button onClick={() => {
                toast({
                  title: "Feature coming soon",
                  description: "The add note feature will be fully implemented soon!",
                });
              }}>
                <i className="ri-add-line mr-1.5"></i>
                Add Note
              </Button>
            </div>
            
            <div className="space-y-4">
              {mockNotes.map((note, idx) => (
                <Card key={idx} className="glassmorphism border-gray-700 text-white">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base flex items-center">
                        <i className="ri-sticky-note-line mr-2 text-primary/80"></i>
                        {formatDate(note.date)}
                      </CardTitle>
                      <Badge variant="outline" className="bg-gray-800/50">
                        {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{note.content}</p>
                    <div className="flex justify-end mt-3">
                      <Button variant="ghost" className="h-8 px-3 text-xs">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
}