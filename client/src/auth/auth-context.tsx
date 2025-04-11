import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../../../supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { toast, useToast } from "@/hooks/use-toast";

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'student' | 'teacher';
  avatarUrl: string | null;
  instruments: string[] | null;
  experienceLevel: string | null;
  bio: string | null;
  isComplete: boolean;
}

export interface UserMetadata {
  username: string;
  full_name: string;
  role: 'student' | 'teacher';
  instruments?: string[] | null;
  experience_level?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: UserMetadata) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(supabaseUser: SupabaseUser, userProfile?: any): User {
  console.log('Mapping user data:', { 
    hasUserProfile: !!userProfile, 
    supabaseMetadata: supabaseUser.user_metadata 
  });
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    username: userProfile?.username || supabaseUser.user_metadata?.username || '',
    fullName: userProfile?.full_name || supabaseUser.user_metadata?.full_name || '',
    role: userProfile?.role || supabaseUser.user_metadata?.role || 'student',
    avatarUrl: userProfile?.avatar_url || supabaseUser.user_metadata?.avatar_url || null,
    instruments: userProfile?.instruments || supabaseUser.user_metadata?.instruments || [],
    experienceLevel: userProfile?.experience_level || supabaseUser.user_metadata?.experience_level || null,
    bio: userProfile?.bio || supabaseUser.user_metadata?.bio || null,
    isComplete: !!(
      (userProfile?.username || supabaseUser.user_metadata?.username) &&
      (userProfile?.full_name || supabaseUser.user_metadata?.full_name)
    ),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function fetchUserProfile(userId: string) {
    console.log('🔍 Fetching user profile for ID:', userId);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching user profile:', {
          message: error.message,
          code: error.code,
          details: error.details,
        });
        return null;
      }
      
      if (!data) {
        console.warn('⚠️ No profile found for user:', userId);
        return null;
      }
      
      console.log('✅ User profile fetched successfully');
      return data;
    } catch (err) {
      console.error('🔥 Unexpected error in fetchUserProfile:', err);
      return null;
    }
  }

  async function forceHydrateUser(supabaseUser: SupabaseUser) {
    const profile = await fetchUserProfile(supabaseUser.id);
    const refreshed = await supabase.auth.getSession();
    setSession(refreshed.data.session);
    setUser(mapSupabaseUser(supabaseUser, profile));
  }

  useEffect(() => {
    console.log('🔄 Initializing auth state');
    let mounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (!mounted) {
          return;
        }
        
        const session = data.session;
        setSession(session);
        
        if (session?.user) {
          console.log('✅ Found existing session for user:', session.user.id);
          const profile = await fetchUserProfile(session.user.id);
          
          if (profile) {
            setUser(mapSupabaseUser(session.user, profile));
          } else {
            console.warn('⚠️ Session exists but no profile found - using auth metadata fallback');
            setUser(mapSupabaseUser(session.user));
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Error getting initial session:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    };
    
    getInitialSession();
    
    // Set up auth state change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.id);
        
        if (mounted) {
          setSession(session);
          
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            setUser(mapSupabaseUser(session.user, profile));
          } else {
            setUser(null);
          }
          
          setLoading(false);
        }
      }
    );
    
    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string, metadata: UserMetadata) {
    console.log('🔄 Starting registration process');
    setLoading(true);
    
    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Registration failed');
      }
      
      if (!data.user) {
        throw new Error('No user returned from registration');
      }
      
      console.log('✅ Auth user created successfully');
      
      // Wait briefly for auth to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify session is active
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('No active session after registration');
      }
      
      // Insert profile in users table
      const userProfile = {
        id: data.user.id,
        email: data.user.email,
        username: metadata.username,
        full_name: metadata.full_name,
        role: metadata.role,
        instruments: metadata.instruments || [],
        experience_level: metadata.experience_level || null,
        bio: metadata.bio || null,
        avatar_url: metadata.avatar_url || null,
      };
      
      console.log('🔄 Creating user profile in database');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([userProfile]);
      
      if (insertError) {
        console.error('❌ Error inserting user profile:', insertError);
        throw new Error('Failed to create user profile: ' + insertError.message);
      }
      
      // Fetch the created profile to ensure it exists
      const profile = await fetchUserProfile(data.user.id);
      
      // Update local state
      setSession(sessionData.session);
      setUser(mapSupabaseUser(data.user, profile || userProfile));
      
      console.log('✅ Registration completed successfully');
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created successfully.',
      });
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      
      toast({
        title: 'Registration failed',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true);
    try {
      console.log("🔄 SignIn: Starting authentication process");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(error.message || "Login failed");
      console.log("✅ SignIn: Authentication successful");

      const user = data?.user;
      if (user) {
        console.log("🔄 SignIn: Fetching user profile");
        // Instead of using forceHydrateUser which might cause issues,
        // directly fetch profile and update state
        const profile = await fetchUserProfile(user.id);
        console.log("✅ SignIn: Profile fetched", !!profile);

        // Update session
        const refreshed = await supabase.auth.getSession();
        console.log("✅ SignIn: Session refreshed");

        // Set state directly without waiting for onAuthStateChange
        setSession(refreshed.data.session);
        setUser(mapSupabaseUser(user, profile));

        // Toast is now handled in the login form component
        console.log("✅ SignIn: Login successful");
      } else {
        console.warn("⚠️ SignIn: No user returned after successful authentication");
        throw new Error("Login succeeded but user data was not found");
      }
    } catch (err: any) {
      console.error("🔥 signIn error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      console.log("🔁 Starting signOut process");
      setLoading(true);

      // 1. Sign out from Supabase first
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      console.log("✅ Supabase signOut completed");

      // 2. Clear local state
      setUser(null);
      setSession(null);
      console.log("✅ Auth state cleared");

      // 3. Navigate to home page
      window.location.href = '/';
      
    } catch (err) {
      console.error("❌ Error during signOut:", err);
      // Still clear state on error for safety
      setUser(null);
      setSession(null);
      toast({
        title: "Error",
        description: "Failed to sign out properly. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(data: Partial<User>) {
    if (!user) return;
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          username: data.username,
          full_name: data.fullName,
          role: data.role,
          avatar_url: data.avatarUrl,
          instruments: data.instruments,
          experience_level: data.experienceLevel,
          bio: data.bio,
        },
      });

      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from("users")
        .update({
          username: data.username,
          full_name: data.fullName,
          role: data.role,
          avatar_url: data.avatarUrl,
          instruments: data.instruments,
          experience_level: data.experienceLevel,
          bio: data.bio,
        })
        .eq("id", user.id);

      if (dbError) throw dbError;

      const profile = await fetchUserProfile(user.id);
      if (profile) setUser(mapSupabaseUser(user as SupabaseUser, profile));
    } catch (err: any) {
      console.error("🔥 updateProfile error:", err);
      throw new Error(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
  };

  console.log("🔍 AuthProvider Debug — user:", user);
  console.log("🔍 AuthProvider Debug — isAuthenticated:", !!user);
  console.log("🔍 AuthProvider Debug — session:", session);
  console.log("🔍 AuthProvider Debug — loading:", loading);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}