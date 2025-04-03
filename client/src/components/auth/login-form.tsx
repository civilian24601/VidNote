import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [_, navigate] = useLocation();
  const { signIn, user, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Monitor auth state changes
  useEffect(() => {
    console.log("Auth state updated - isAuthenticated:", isAuthenticated, "loading:", loading);
    
    if (isAuthenticated && !loading) {
      console.log("User is authenticated, redirecting...");
      console.log("Current user:", user);
      
      if (user?.role === 'teacher') {
        console.log("Redirecting to teacher dashboard");
        navigate("/dashboard");
      } else {
        console.log("Redirecting to videos page");
        navigate("/videos");
      }
    }
  }, [isAuthenticated, loading, user, navigate]);

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);
    console.log("Login form submitted with email:", values.email);
    
    try {
      console.log("Attempting sign in with auth context signIn method");
      await signIn(values.email, values.password);
      console.log("Sign in successful, auth context updated");
      console.log("isAuthenticated:", isAuthenticated);
      
      toast({
        title: "Login successful",
        description: "You have been successfully logged in.",
      });
      
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </Form>
  );
}
