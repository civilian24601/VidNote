import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";

// Mock data for charts
const practiceData = [
  { name: "Monday", minutes: 45 },
  { name: "Tuesday", minutes: 30 },
  { name: "Wednesday", minutes: 60 },
  { name: "Thursday", minutes: 45 },
  { name: "Friday", minutes: 20 },
  { name: "Saturday", minutes: 75 },
  { name: "Sunday", minutes: 50 },
];

const weeklyTrend = [
  { week: "Week 1", minutes: 230 },
  { week: "Week 2", minutes: 280 },
  { week: "Week 3", minutes: 210 },
  { week: "Week 4", minutes: 320 },
  { week: "Week 5", minutes: 350 },
  { week: "Week 6", minutes: 290 },
  { week: "Week 7", minutes: 380 },
  { week: "Week 8", minutes: 410 },
];

const pieData = [
  { name: "Scales", value: 25 },
  { name: "Technique", value: 35 },
  { name: "Repertoire", value: 40 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

export default function Analytics() {
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
            <h1 className="text-3xl font-bold text-gradient mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Track student practice and performance trends</p>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6 bg-gray-900/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glassmorphism border-gray-700 text-white col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Student Practice Trend</CardTitle>
                  <CardDescription className="text-gray-400">Weekly practice minutes across all students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        width={500}
                        height={300}
                        data={weeklyTrend}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="week" stroke="#aaa" />
                        <YAxis stroke="#aaa" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }} />
                        <Line type="monotone" dataKey="minutes" stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glassmorphism border-gray-700 text-white">
                <CardHeader>
                  <CardTitle>Daily Practice Distribution</CardTitle>
                  <CardDescription className="text-gray-400">Minutes practiced per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        width={500}
                        height={300}
                        data={practiceData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#aaa" />
                        <YAxis stroke="#aaa" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }} />
                        <Bar dataKey="minutes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glassmorphism border-gray-700 text-white">
                <CardHeader>
                  <CardTitle>Practice Focus</CardTitle>
                  <CardDescription className="text-gray-400">Time allocation by practice category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-60 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart width={400} height={300}>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="students" className="mt-0">
            <Card className="glassmorphism border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Student Analytics</CardTitle>
                <CardDescription className="text-gray-400">Individual student performance details</CardDescription>
              </CardHeader>
              <CardContent className="p-10 text-center">
                <div className="flex flex-col items-center">
                  <i className="ri-bar-chart-box-line text-6xl text-primary/40 mb-4"></i>
                  <h3 className="text-xl font-medium mb-2">Student-specific analytics coming soon</h3>
                  <p className="text-gray-400 max-w-md">
                    This feature will provide detailed insights into individual student practice habits,
                    progress tracking, and performance analytics.
                  </p>
                  <button 
                    className="mt-6 p-2 px-4 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    onClick={() => {
                      toast({
                        title: "Feature coming soon",
                        description: "Student-specific analytics will be available in the next update!",
                      });
                    }}
                  >
                    Request Early Access
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activities" className="mt-0">
            <Card className="glassmorphism border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Activity Analytics</CardTitle>
                <CardDescription className="text-gray-400">Analysis of practice activities and exercises</CardDescription>
              </CardHeader>
              <CardContent className="p-10 text-center">
                <div className="flex flex-col items-center">
                  <i className="ri-bubble-chart-line text-6xl text-primary/40 mb-4"></i>
                  <h3 className="text-xl font-medium mb-2">Activity analytics coming soon</h3>
                  <p className="text-gray-400 max-w-md">
                    This feature will provide detailed information about which exercises and activities 
                    are most effective for student progress.
                  </p>
                  <button 
                    className="mt-6 p-2 px-4 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    onClick={() => {
                      toast({
                        title: "Feature coming soon",
                        description: "Activity analytics will be available in the next update!",
                      });
                    }}
                  >
                    Request Early Access
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
}