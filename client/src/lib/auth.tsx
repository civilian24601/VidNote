import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@shared/schema";
import { supabase } from "./supabase";

// Use mock auth if Supabase isn't available or for development
const USE_MOCK_AUTH = !import.meta.env.VITE_SUPABASE_URL || 
                      !import.meta.env.VITE_SUPABASE_ANON_KEY || 
                      !import.meta.env.VITE_SUPABASE_URL.includes('supabase.co');

// Mock user data for development or fallback when Supabase is not available
const MOCK_STUDENT: User = {
  id: 1,
  username: "student_demo",
  email: "student@example.com",
  password: "password123", // This would not be exposed in a real app
  fullName: "Student Demo",
  role: "student",
  avatarUrl: null,
  instruments: ["Piano", "Guitar"],
  experienceLevel: "Intermediate",
  bio: "Music student passionate about classical piano and acoustic guitar.",
  verified: true,
  active: true,
  lastLogin: new Date(),
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
};

const MOCK_TEACHER: User = {
  id: 2,
  username: "teacher_demo",
  email: "teacher@example.com",
  password: "password123", // This would not be exposed in a real app
  fullName: "Teacher Demo",
  role: "teacher",
  avatarUrl: null,
  instruments: ["Violin", "Piano"],
  experienceLevel: "Expert",
  bio: "Conservatory-trained music teacher with 15+ years of experience.",
  verified: true,
  active: true,
  lastLogin: new Date(),
  createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
};

// Mapping from Supabase auth to our User model
const mapSupabaseAuthToUser = (supabaseUser: any, userProfile?: any): User => {
  return {
    id: parseInt(supabaseUser.id) || 0,
    username: userProfile?.username || supabaseUser.user_metadata?.username || 'user',
    email: supabaseUser.email || '',
    password: '', // We never store or return the actual password
    fullName: userProfile?.fullName || supabaseUser.user_metadata?.full_name || '',
    role: userProfile?.role || supabaseUser.user_metadata?.role || 'student',
    avatarUrl: userProfile?.avatarUrl || supabaseUser.user_metadata?.avatar_url || null,
    instruments: userProfile?.instruments || supabaseUser.user_metadata?.instruments || [],
    experienceLevel: userProfile?.experienceLevel || supabaseUser.user_metadata?.experience_level || '',
    bio: userProfile?.bio || supabaseUser.user_metadata?.bio || '',
    verified: supabaseUser.email_confirmed_at ? true : false,
    active: supabaseUser.confirmed_at ? true : false,
    lastLogin: new Date(supabaseUser.last_sign_in_at || Date.now()),
    createdAt: new Date(supabaseUser.created_at || Date.now())
  };
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session with Supabase
    const checkSession = async () => {
      try {
        if (USE_MOCK_AUTH) {
          // Use localStorage for mock auth
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else {
          // Use Supabase Auth
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            // Convert Supabase user to our User model
            const userData = mapSupabaseAuthToUser(sessionData.session.user);
            setUser(userData);
          }
          
          // Set up auth state change listener
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                const userData = mapSupabaseAuthToUser(session.user);
                setUser(userData);
              } else if (event === 'SIGNED_OUT') {
                setUser(null);
              }
            }
          );
          
          // Return cleanup function
          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      if (USE_MOCK_AUTH) {
        // Mock login logic for UI development
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        
        let userData: User;
        if (email.includes("teacher")) {
          userData = MOCK_TEACHER;
        } else {
          userData = MOCK_STUDENT;
        }
        
        // Store complete user data in localStorage for persistence across refreshes
        localStorage.setItem("user", JSON.stringify(userData));
        
        setUser(userData);
        return userData;
      } else {
        // Use Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          const userData = mapSupabaseAuthToUser(data.user);
          
          // Store complete user data in localStorage for persistence across refreshes
          localStorage.setItem("user", JSON.stringify(userData));
          
          setUser(userData);
          return userData;
        } else {
          throw new Error('Login successful but user data is missing');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any): Promise<User> => {
    setLoading(true);
    try {
      if (USE_MOCK_AUTH) {
        // Mock registration logic for UI development
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        const newUser: User = {
          ...MOCK_STUDENT,
          id: 3,
          username: userData.username || "new_user",
          email: userData.email || "new@example.com",
          fullName: userData.fullName || "New User",
          role: userData.role || "student",
          createdAt: new Date()
        };
        
        // Store complete user data in localStorage for persistence across refreshes
        localStorage.setItem("user", JSON.stringify(newUser));
        
        setUser(newUser);
        return newUser;
      } else {
        // Use Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              username: userData.username,
              full_name: userData.fullName,
              role: userData.role || 'student',
              instruments: userData.instruments || [],
              experience_level: userData.experienceLevel || 'Beginner',
              bio: userData.bio || ''
            }
          }
        });
        
        if (error) throw error;
        
        if (data.user) {
          const newUser = mapSupabaseAuthToUser(data.user, userData);
          
          // Store complete user data in localStorage for persistence across refreshes
          localStorage.setItem("user", JSON.stringify(newUser));
          
          setUser(newUser);
          return newUser;
        } else {
          throw new Error('Registration successful but user data is missing');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (USE_MOCK_AUTH) {
      // Mock logout
      setUser(null);
      localStorage.removeItem("user");
    } else {
      // Use Supabase Auth
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  const contextValue: AuthContextType = { 
    user, 
    loading, 
    login, 
    register, 
    logout, 
    isAuthenticated: !!user 
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
