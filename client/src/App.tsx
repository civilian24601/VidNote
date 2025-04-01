import { Switch, Route } from "wouter";
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
import { AuthProvider } from "./lib/auth";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Students from "./pages/students";
import StudentDetail from "./pages/student-detail";
import Analytics from "./pages/analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/videos" component={Videos} />
      <Route path="/watch/:id" component={Watch} />
      <Route path="/shared" component={Shared} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/students" component={Students} />
      <Route path="/students/:id" component={StudentDetail} />
      <Route path="/analytics" component={Analytics} />
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
