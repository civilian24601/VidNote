
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

const MAX_AUTH_WAIT_TIME = 10000; // 10 seconds maximum wait
const AUTH_CHECK_INTERVAL = 100; // Check every 100ms

export function LoginForm() {
  const [_, navigate] = useLocation();
  const { signIn, user, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStarted, setAuthStarted] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle auth state changes and navigation
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let startTime: number;

    const checkAuthAndNavigate = async () => {
      if (!authStarted || !isAuthenticated || !user) return;

      console.log("🔍 Auth state check:", {
        isAuthenticated,
        user,
        loading,
        authStarted
      });

      if (user.role) {
        setAuthStarted(false);
        setIsSubmitting(false);
        
        const destination = user.role === "teacher" ? "/dashboard" : "/videos";
        console.log("✅ Login successful, navigating to:", destination);
        
        toast({
          title: "Welcome back!",
          description: `Logged in as ${user.fullName}`,
        });
        
        navigate(destination);
        return;
      }

      // Check if we've exceeded maximum wait time
      if (startTime && Date.now() - startTime > MAX_AUTH_WAIT_TIME) {
        setAuthStarted(false);
        setIsSubmitting(false);
        console.error("❌ Auth state timeout - user data not received in time");
        toast({
          title: "Login failed",
          description: "Could not complete login process. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Continue checking
      timeout = setTimeout(checkAuthAndNavigate, AUTH_CHECK_INTERVAL);
    };

    if (authStarted) {
      startTime = Date.now();
      checkAuthAndNavigate();
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [authStarted, isAuthenticated, user, loading, navigate, toast]);

  const onSubmit = async (values: LoginValues) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    console.log("🧠 Login form submitted with email:", values.email);

    try {
      await signIn(values.email, values.password);
      setAuthStarted(true);
      
    } catch (error) {
      console.error("❌ Login error:", error);
      setIsSubmitting(false);
      setAuthStarted(false);
      
      toast({
        title: "Login failed",
        description:
          error instanceof Error
            ? error.message
            : "Please check your credentials and try again.",
        variant: "destructive",
      });
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
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </Form>
  );
}
