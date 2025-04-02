import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials, getAvatarColor } from "@/lib/utils";
import { MOCK_USERS } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

// Filter mock users to get just students
const mockStudents = MOCK_USERS.filter(user => user.role === "student");

export default function Students() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Redirect if not a teacher
    if (user && user.role !== "teacher") {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user || user.role !== "teacher") {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      
      <main className="container p-4 mx-auto mt-16 mb-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">My Students</h1>
            <p className="text-gray-400">Manage your students and their progress</p>
          </div>
          
          <Button className="mt-4 sm:mt-0" onClick={() => {
            toast({
              title: "Coming soon",
              description: "Student invitation feature will be available soon!",
            });
          }}>
            <i className="ri-user-add-line mr-2"></i>
            Add Student
          </Button>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6 bg-gray-900/50">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="all">All Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockStudents.slice(0, 5).map((student, index) => (
                <Card key={index} className="glassmorphism border-gray-700 text-white overflow-hidden hover:border-primary/50 transition-colors cursor-pointer" onClick={() => {
                  toast({
                    title: "Student profile",
                    description: "Student detail view coming soon!",
                  });
                }}>
                  <CardHeader className="pb-2 flex flex-row items-center space-x-4">
                    <Avatar className={`h-12 w-12 ${getAvatarColor(student.id)}`}>
                      <AvatarFallback className="text-white">
                        {getInitials(student.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{student.fullName}</CardTitle>
                      <p className="text-sm text-gray-400">Piano • Intermediate</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-400">Last activity</span>
                      <span className="text-sm">2 days ago</span>
                    </div>
                    
                    <div className="flex justify-between mb-2">
                      <div className="space-y-1">
                        <div className="text-sm font-medium flex items-center">
                          <i className="ri-video-line mr-1.5 text-primary/80"></i> 
                          Videos
                        </div>
                        <Badge variant="outline" className="bg-gray-800/50 text-xs">
                          {Math.floor(Math.random() * 15) + 5}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium flex items-center">
                          <i className="ri-feedback-line mr-1.5 text-primary/80"></i> 
                          Comments
                        </div>
                        <Badge variant="outline" className="bg-gray-800/50 text-xs">
                          {Math.floor(Math.random() * 30) + 10}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium flex items-center">
                          <i className="ri-time-line mr-1.5 text-primary/80"></i> 
                          Hours
                        </div>
                        <Badge variant="outline" className="bg-gray-800/50 text-xs">
                          {Math.floor(Math.random() * 20) + 5}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="pending" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="glassmorphism border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <i className="ri-user-add-line mr-2 text-primary/80"></i>
                    Pending Invitations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4">
                    <p className="text-gray-400 mb-4">You have no pending student invitations</p>
                    <Button variant="outline" className="border-gray-700 hover:bg-gray-800/50" onClick={() => {
                      toast({
                        title: "Coming soon",
                        description: "Student invitation feature will be available soon!",
                      });
                    }}>
                      Send Invitation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockStudents.map((student, index) => (
                <Card key={index} className="glassmorphism border-gray-700 text-white overflow-hidden hover:border-primary/50 transition-colors cursor-pointer" onClick={() => {
                  toast({
                    title: "Student profile",
                    description: "Student detail view coming soon!",
                  });
                }}>
                  <CardHeader className="pb-2 flex flex-row items-center space-x-4">
                    <Avatar className={`h-12 w-12 ${getAvatarColor(student.id)}`}>
                      <AvatarFallback className="text-white">
                        {getInitials(student.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{student.fullName}</CardTitle>
                      <p className="text-sm text-gray-400">Piano • Intermediate</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-400">Last activity</span>
                      <span className="text-sm">{index % 2 === 0 ? "2 days ago" : "5 days ago"}</span>
                    </div>
                    
                    <div className="flex justify-between mb-2">
                      <div className="space-y-1">
                        <div className="text-sm font-medium flex items-center">
                          <i className="ri-video-line mr-1.5 text-primary/80"></i> 
                          Videos
                        </div>
                        <Badge variant="outline" className="bg-gray-800/50 text-xs">
                          {Math.floor(Math.random() * 15) + 5}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium flex items-center">
                          <i className="ri-feedback-line mr-1.5 text-primary/80"></i> 
                          Comments
                        </div>
                        <Badge variant="outline" className="bg-gray-800/50 text-xs">
                          {Math.floor(Math.random() * 30) + 10}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium flex items-center">
                          <i className="ri-time-line mr-1.5 text-primary/80"></i> 
                          Hours
                        </div>
                        <Badge variant="outline" className="bg-gray-800/50 text-xs">
                          {Math.floor(Math.random() * 20) + 5}
                        </Badge>
                      </div>
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