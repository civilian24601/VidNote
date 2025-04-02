import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

// Define our app's user type
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

interface UserMetadata {
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

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map Supabase user data to our application user format
function mapSupabaseUser(supabaseUser: SupabaseUser, userProfile?: any): User {
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
    )
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data from Supabase
  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }

  // Handle auth state changes
  useEffect(() => {
    // Initial session check
    async function getInitialSession() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(mapSupabaseUser(session.user, profile));
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: Session | null) => {
        setSession(session);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(mapSupabaseUser(session.user, profile));
        } else {
          setUser(null);
        }
      }
    );

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Register a new user
  async function signUp(email: string, password: string, metadata: UserMetadata) {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;

      // After signup, we need to store the user profile in the users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            username: metadata.username || '',
            full_name: metadata.full_name || '',
            role: metadata.role || 'student',
            instruments: metadata.instruments || null,
            experience_level: metadata.experience_level || null,
            bio: metadata.bio || null,
            avatar_url: metadata.avatar_url || null
          }]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // If profile creation fails, we should log the user out
          await supabase.auth.signOut();
          throw new Error('Failed to create user profile');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  // Sign in an existing user
  async function signIn(email: string, password: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      // We don't need to manually set user and session here as onAuthStateChange will handle it
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  // Sign out
  async function signOut() {
    try {
      await supabase.auth.signOut();
      // The onAuthStateChange handler will update the user state
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Update user profile
  async function updateProfile(data: Partial<User>) {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update auth metadata
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          username: data.username,
          full_name: data.fullName,
          role: data.role,
          avatar_url: data.avatarUrl,
          instruments: data.instruments,
          experience_level: data.experienceLevel,
          bio: data.bio
        }
      });

      if (authUpdateError) throw authUpdateError;

      // Update profile table
      const { error: profileUpdateError } = await supabase
        .from('users')
        .update({
          username: data.username,
          full_name: data.fullName,
          role: data.role,
          avatar_url: data.avatarUrl,
          instruments: data.instruments,
          experience_level: data.experienceLevel,
          bio: data.bio
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      // Update local state
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(mapSupabaseUser(session.user, profile));
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}