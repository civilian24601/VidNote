import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "./pages/not-found";
import Home from "./pages/home";
import Videos from "./pages/videos";
import Watch from "./pages/watch";
import Shared from "./pages/shared";
import Login from "./pages/login";
import Register from "./pages/register";
import { AuthProvider, useAuth } from "./lib/auth";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Students from "./pages/students";
import StudentDetail from "./pages/student-detail";
import Analytics from "./pages/analytics";
import TestSupabase from "./pages/test-supabase";
import WebSocketDemo from "./pages/websocket-demo";
import { useEffect } from "react";

// Protected route component that redirects to login if not authenticated
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  // If still loading or authenticated, render the component
  return loading ? null : isAuthenticated ? <Component {...rest} /> : null;
}

// Teacher-only route that checks if the user is a teacher
function TeacherRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else if (user?.role !== "teacher") {
        // Use history to handle back button properly when redirecting
        console.log("Non-teacher attempted to access teacher route", rest);
        // Instead of redirecting to /videos which causes navigation issues,
        // redirect to the appropriate role-based page
        navigate(user?.role === "student" ? "/videos" : "/");
      }
    }
  }, [isAuthenticated, loading, navigate, user, rest]);

  // If still loading or is a teacher, render the component
  return loading ? null : (isAuthenticated && user?.role === "teacher") ? <Component {...rest} /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes */}
      <Route path="/videos" component={(props) => <ProtectedRoute component={Videos} {...props} />} />
      <Route path="/watch/:id" component={(props) => <ProtectedRoute component={Watch} {...props} />} />
      <Route path="/shared" component={(props) => <ProtectedRoute component={Shared} {...props} />} />
      <Route path="/profile" component={(props) => <ProtectedRoute component={Profile} {...props} />} />
      
      {/* Dashboard is accessible by all users */}
      <Route path="/dashboard" component={(props) => <ProtectedRoute component={Dashboard} {...props} />} />
      
      {/* Teacher-only routes */}
      <Route path="/students" component={(props) => <TeacherRoute component={Students} {...props} />} />
      <Route path="/students/:id" component={(props) => <TeacherRoute component={StudentDetail} {...props} />} />
      <Route path="/analytics" component={(props) => <TeacherRoute component={Analytics} {...props} />} />
      
      {/* Test routes */}
      <Route path="/test-supabase" component={TestSupabase} />
      <Route path="/websocket-demo" component={WebSocketDemo} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
