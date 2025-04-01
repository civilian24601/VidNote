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
          // First check if we have a stored user from a previous login
          const storedUser = localStorage.getItem("user");
          
          if (storedUser) {
            // We have a stored user, use it first for immediate UI response
            const parsedUser = JSON.parse(storedUser);
            
            // Verify this user exists in our server storage
            try {
              console.log("Attempting to verify stored user with ID:", parsedUser.id);
              
              // Add the email parameter to help server recover in case user ID has changed
              const verifyResponse = await fetch(`/api/users/${parsedUser.id}?email=${encodeURIComponent(parsedUser.email)}`);
              
              if (verifyResponse.ok) {
                // Server confirms user exists, we can safely use the stored user
                // Get the latest user data from server
                const userData = await verifyResponse.json();
                
                // Update the user data in localStorage with latest from server
                const updatedUser = {
                  ...parsedUser,
                  ...userData
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                
                setUser(updatedUser);
                console.log("Restored session for user ID:", updatedUser.id);
              } else if (verifyResponse.status === 404) {
                // Server doesn't recognize this user ID - try to recover with email
                console.warn("Stored user not found in server with ID:", parsedUser.id);
                
                try {
                  // Try to look up user by email as a fallback
                  const lookupResponse = await fetch('/api/users/lookup', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: parsedUser.email }),
                  });
                  
                  if (lookupResponse.ok) {
                    // Found user by email
                    const serverUser = await lookupResponse.json();
                    
                    // Update stored user with correct ID
                    const recoveredUser = {
                      ...parsedUser,
                      id: serverUser.id, // Use correct server ID
                    };
                    
                    localStorage.setItem("user", JSON.stringify(recoveredUser));
                    setUser(recoveredUser);
                    console.log("Recovered user session via email lookup, new ID:", serverUser.id);
                  } else {
                    // Couldn't recover - will try Supabase instead
                    console.warn("Failed to recover user by email:", parsedUser.email);
                    localStorage.removeItem("user");
                  }
                } catch (lookupError) {
                  console.error("Error looking up user by email:", lookupError);
                  localStorage.removeItem("user");
                }
              } else {
                // Other error, not a 404 - will try Supabase instead
                console.warn("Error verifying stored user:", verifyResponse.status);
                localStorage.removeItem("user");
              }
            } catch (verifyError) {
              console.error("Error verifying stored user:", verifyError);
              // We'll continue with Supabase auth in case of error
            }
          }
          
          // Use Supabase Auth as backup or if no stored user
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user && !user) {
            console.log("Found Supabase session, retrieving user...");
            
            // We have a Supabase session but no valid user in server
            // Try to get user from server by email
            try {
              const email = sessionData.session.user.email;
              
              if (email) {
                const serverResponse = await fetch('/api/users/lookup', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email }),
                });
                
                if (serverResponse.ok) {
                  // Server found a user with this email
                  const serverUser = await serverResponse.json();
                  
                  // Map Supabase user data but use our server ID
                  const userData = {
                    ...mapSupabaseAuthToUser(sessionData.session.user),
                    id: serverUser.id // Use server-assigned ID
                  };
                  
                  localStorage.setItem("user", JSON.stringify(userData));
                  setUser(userData);
                  console.log("Retrieved user from server ID:", userData.id);
                } else {
                  console.warn("Supabase user not found in server storage:", email);
                  // Clean up by signing out from Supabase too
                  await supabase.auth.signOut();
                }
              }
            } catch (lookupError) {
              console.error("Error looking up user by email:", lookupError);
            }
          }
          
          // Set up auth state change listener
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                // We handle sign-in in the login and register functions
                // No need to handle it here as we need the server ID
                console.log("Auth state change: SIGNED_IN");
              } else if (event === 'SIGNED_OUT') {
                console.log("Auth state change: SIGNED_OUT");
                localStorage.removeItem("user");
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
          // Server login to get our internal user with the correct ID
          try {
            const serverResponse = await fetch('/api/users/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });
            
            if (!serverResponse.ok) {
              throw new Error(`Server login failed: ${serverResponse.statusText}`);
            }
            
            // Get the server-side user with proper ID
            const serverUser = await serverResponse.json();
            
            // Map Supabase user data but use our server ID
            const userData = {
              ...mapSupabaseAuthToUser(data.user),
              id: serverUser.id // Use server-assigned ID
            };
            
            console.log("User logged in successfully with ID:", userData.id);
            
            // Store complete user data in localStorage for persistence across refreshes
            localStorage.setItem("user", JSON.stringify(userData));
            
            setUser(userData);
            return userData;
          } catch (serverError) {
            console.error("Server login error:", serverError);
            throw serverError;
          }
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
          // After Supabase registration succeeds, we need to register the user with our server too
          try {
            // Create user in our server API
            const serverResponse = await fetch('/api/users/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: userData.username,
                email: userData.email,
                password: userData.password, // This should be hashed on the server
                fullName: userData.fullName,
                role: userData.role || 'student',
                instruments: userData.instruments || [],
                experienceLevel: userData.experienceLevel || 'Beginner',
                bio: userData.bio || ''
              }),
            });
            
            if (!serverResponse.ok) {
              throw new Error(`Server registration failed: ${serverResponse.statusText}`);
            }
            
            // Parse the server response to get our internal user
            const serverUser = await serverResponse.json();
            
            // Map the Supabase user to our format but use the server-assigned ID
            const newUser = {
              ...mapSupabaseAuthToUser(data.user, userData),
              id: serverUser.id // Use the ID from our server
            };
            
            console.log("User registered successfully with ID:", newUser.id);
            
            // Store complete user data in localStorage for persistence across refreshes
            localStorage.setItem("user", JSON.stringify(newUser));
            
            setUser(newUser);
            return newUser;
          } catch (serverError) {
            console.error("Server registration error:", serverError);
            throw serverError;
          }
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
