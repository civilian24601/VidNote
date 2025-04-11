import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "./pages/not-found";
import Home from "./pages/home";
import Videos from "./pages/videos";
import Shared from "./pages/shared";
import Login from "./pages/login";
import Register from "./pages/register";
import { AuthProvider, useAuth } from "./auth/auth-context";
import Profile from "./pages/profile";
import Analytics from "./pages/analytics";
import TestSupabaseAPI from "./pages/test-supabase-api";
import WebSocketDemo from "./pages/websocket-demo";
import DiagnosticsPage from "./pages/admin/diagnostics";
import { useEffect } from "react";
import { TestPathAlias } from '@/components/TestPathAlias'

// 👇 Dev tool import
import { AuthDebugPanel } from "@/components/dev/auth-debug-panel";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  return loading ? null : isAuthenticated ? <Component {...rest} /> : null;
}

function TeacherRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else if (user?.role !== "teacher") {
        navigate(user?.role === "student" ? "/videos" : "/");
      }
    }
  }, [isAuthenticated, loading, navigate, user, rest]);

  return loading ? null : (isAuthenticated && user?.role === "teacher") ? <Component {...rest} /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/videos" component={(props) => <ProtectedRoute component={Videos} {...props} />} />
      <Route path="/shared" component={(props) => <ProtectedRoute component={Shared} {...props} />} />
      <Route path="/profile" component={(props) => <ProtectedRoute component={Profile} {...props} />} />

      <Route path="/analytics" component={(props) => <TeacherRoute component={Analytics} {...props} />} />
      <Route path="/test-supabase-api" component={TestSupabaseAPI} />
      <Route path="/websocket-demo" component={WebSocketDemo} />
      <Route path="/admin/diagnostics" component={(props) => <TeacherRoute component={DiagnosticsPage} {...props} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background">
      <TestPathAlias />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
