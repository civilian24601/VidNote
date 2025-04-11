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

// Connection diagnostics utility
const diagnostics = {
  timers: new Map<string, number>(),
  
  start(operation: string) {
    this.timers.set(operation, performance.now());
    console.log(`⏱️ Starting ${operation}`);
  },
  
  end(operation: string) {
    const startTime = this.timers.get(operation);
    if (startTime) {
      const duration = Math.round(performance.now() - startTime);
      console.log(`⏱️ ${operation} completed in ${duration}ms`);
      this.timers.delete(operation);
      return duration;
    }
    return null;
  },
  
  log(operation: string, details?: any) {
    const duration = this.end(operation);
    if (details) {
      console.log(`📊 ${operation} details:`, details);
    }
    return duration;
  }
};

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

  // Background refresh utility (add below AuthProvider state declarations)
  function startBackgroundRefresh(userId: string, isMounted: () => boolean) {
    if (!userId) return;
    
    let isRefreshing = false;
    let lastRefreshTime = 0;
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    const refreshHandler = async () => {
      const now = Date.now();
      // Only refresh if enough time has passed and not already refreshing
      if (!isRefreshing && now - lastRefreshTime > REFRESH_INTERVAL) {
        isRefreshing = true;
        
        try {
          diagnostics.start('background-refresh');
          const profile = await fetchUserProfile(userId);
          const sessionResult = await supabase.auth.getSession();
          
          // Check if component is still mounted before updating state
          if (sessionResult.data.session?.user && profile && isMounted()) {
            setUser(mapSupabaseUser(sessionResult.data.session.user, profile));
            console.log('🔄 Background refresh completed successfully');
          }
          
          lastRefreshTime = Date.now();
          diagnostics.log('background-refresh', { success: true });
        } catch (error) {
          console.warn('🔄 Background refresh failed:', error);
          diagnostics.log('background-refresh', { success: false, error });
        } finally {
          isRefreshing = false;
        }
      }
    };
    
    // Initial refresh after a small delay
    setTimeout(refreshHandler, 10000);
    
    // Set up interval for recurring refreshes
    const intervalId = setInterval(refreshHandler, 60000); // Check every minute
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }

  // Now update fetchUserProfile with diagnostics
  async function fetchUserProfile(userId: string, retryCount = 1) {
    const operationId = `fetch-profile-${userId.slice(0, 6)}${retryCount > 1 ? `-retry-${retryCount}` : ''}`;
    diagnostics.start(operationId);
    
    console.log('🔍 Fetching user profile for ID:', userId);
    
    // Increase timeout slightly to accommodate slower connections
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
    });
    
    try {
      // Use Promise.race to implement the timeout
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        // Check if it's specifically a "no rows" error
        if (error.details?.includes('0 rows') || error.code === 'PGRST116') {
          console.log('ℹ️ No profile found for user:', userId);
          diagnostics.log(operationId, { result: 'no-rows' });
          return null;
        }
        
        // Other errors - try retry if count permits
        if (retryCount > 0) {
          console.warn('⚠️ Error fetching profile, retrying...', error);
          diagnostics.log(operationId, { result: 'error-retrying', error });
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchUserProfile(userId, retryCount - 1);
        }
        
        console.error('❌ Error fetching user profile:', {
          message: error.message,
          code: error.code,
          details: error.details,
        });
        diagnostics.log(operationId, { result: 'error-final', error });
        return null;
      }
      
      if (!data) {
        console.warn('⚠️ No profile found for user:', userId);
        diagnostics.log(operationId, { result: 'no-data' });
        return null;
      }
      
      console.log('✅ User profile fetched successfully');
      diagnostics.log(operationId, { result: 'success' });
      return data;
    } catch (err) {
      // On timeout or other error, try retry if count permits
      if (retryCount > 0 && err instanceof Error && err.message === 'Profile fetch timeout') {
        console.warn('⚠️ Profile fetch timed out, retrying...');
        diagnostics.log(operationId, { result: 'timeout-retrying' });
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchUserProfile(userId, retryCount - 1);
      }
      
      console.error('🔥 Unexpected error in fetchUserProfile:', err);
      diagnostics.log(operationId, { result: 'unexpected-error', error: err });
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
    let cleanupBackgroundRefresh: (() => void) | undefined;
    
    // Create a function that returns the current mounted state
    const isMounted = () => mounted;
    
    // Get initial session
    const getInitialSession = async () => {
      diagnostics.start('initial-session');
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          diagnostics.log('initial-session', { result: 'error', error });
          throw error;
        }
        
        if (!mounted) {
          return;
        }
        
        const session = data.session;
        setSession(session);
        
        if (session?.user) {
          console.log('✅ Found existing session for user:', session.user.id);
          diagnostics.log('initial-session', { result: 'session-found', userId: session.user.id });
          
          // Set user with metadata immediately for instant auth
          setUser(mapSupabaseUser(session.user));
          setLoading(false);
          
          // Start background refresh cycle with mounted check
          cleanupBackgroundRefresh = startBackgroundRefresh(session.user.id, isMounted);
          
          // Then fetch profile asynchronously to enhance user data
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              setUser(mapSupabaseUser(session.user, profile));
            }
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
          }
        } else {
          diagnostics.log('initial-session', { result: 'no-session' });
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error);
        diagnostics.log('initial-session', { result: 'error', error });
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
        const eventId = `auth-change-${event}`;
        diagnostics.start(eventId);
        
        console.log('🔄 Auth state change:', event, session?.user?.id);
        
        setSession(session);
        
        if (session?.user) {
          // Set user with metadata first for immediate auth feedback
          setUser(mapSupabaseUser(session.user));
          
          // Start or restart background refresh
          if (cleanupBackgroundRefresh) {
            cleanupBackgroundRefresh();
          }
          cleanupBackgroundRefresh = startBackgroundRefresh(session.user.id, isMounted);
          
          // Then fetch profile asynchronously
          try {
            const profile = await fetchUserProfile(session.user.id);
            
            // Update with profile data if available
            if (mounted) {
              setUser(mapSupabaseUser(session.user, profile));
            }
            
            diagnostics.log(eventId, { result: 'success', hasProfile: !!profile });
          } catch (profileError) {
            console.error('Error during profile fetch:', profileError);
            diagnostics.log(eventId, { result: 'profile-error', error: profileError });
          }
        } else {
          setUser(null);
          if (cleanupBackgroundRefresh) {
            cleanupBackgroundRefresh();
            cleanupBackgroundRefresh = undefined;
          }
          diagnostics.log(eventId, { result: 'no-user' });
        }
        
        setLoading(false);
      }
    );
    
    // Cleanup
    return () => {
      mounted = false;
      if (cleanupBackgroundRefresh) {
        cleanupBackgroundRefresh();
      }
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
    console.log('🔄 Starting login process');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw new Error(error.message || 'Login failed');
      }
      
      if (!data.user) {
        throw new Error('No user returned after login');
      }
      
      console.log('✅ Authentication successful');
      
      // Fetch user profile
      const profile = await fetchUserProfile(data.user.id);
      
      if (!profile) {
        console.warn('⚠️ No profile found for authenticated user - using metadata fallback');
      }
      
      // Update local state
      setSession(data.session);
      setUser(mapSupabaseUser(data.user, profile));
      
      console.log('✅ Login completed successfully');
    } catch (err: any) {
      console.error('❌ Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    console.log('🔄 Starting logout process');
    setLoading(true);
    
    // Clear local state first for immediate UI feedback
    setUser(null);
    setSession(null);
    
    try {
      // Then perform the actual signout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Logout completed successfully');
      
      // Use a small delay before redirect to ensure state is cleared
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (err) {
      console.error('❌ Logout error:', err);
      
      toast({
        title: 'Logout error',
        description: 'Failed to sign out properly. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Add diagnostics to the updateProfile function
  async function updateProfile(data: Partial<User>) {
    if (!user) {
      console.error('❌ Cannot update profile: No authenticated user');
      return;
    }
    
    console.log('🔄 Starting profile update');
    diagnostics.start('profile-update');
    setLoading(true);
    
    try {
      // Update auth metadata first
      diagnostics.start('update-auth-metadata');
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
      diagnostics.log('update-auth-metadata');
      
      if (authError) {
        throw authError;
      }
      
      // Add a small delay to ensure auth update has propagated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update profile in users table
      diagnostics.start('update-db-profile');
      const { error: dbError } = await supabase
        .from('users')
        .update({
          username: data.username,
          full_name: data.fullName,
          role: data.role,
          avatar_url: data.avatarUrl,
          instruments: data.instruments,
          experience_level: data.experienceLevel,
          bio: data.bio,
        })
        .eq('id', user.id);
      diagnostics.log('update-db-profile');
      
      if (dbError) {
        throw dbError;
      }
      
      // Update local state with the new data immediately
      const updatedUser = {
        ...user,
        username: data.username || user.username,
        fullName: data.fullName || user.fullName,
        role: data.role || user.role,
        avatarUrl: data.avatarUrl ?? user.avatarUrl,
        instruments: data.instruments ?? user.instruments,
        experienceLevel: data.experienceLevel ?? user.experienceLevel,
        bio: data.bio ?? user.bio,
      };
      setUser(updatedUser);
      
      // Then refresh from server asynchronously to ensure data consistency
      setTimeout(async () => {
        try {
          const profile = await fetchUserProfile(user.id, 2); // Try up to 2 retries
          if (profile && session?.user) {
            setUser(mapSupabaseUser(session.user, profile));
          }
        } catch (refreshErr) {
          console.warn('Profile refresh after update failed:', refreshErr);
          // Not critical since we already updated local state
        }
      }, 1000);
      
      console.log('✅ Profile updated successfully');
      diagnostics.log('profile-update', { result: 'success' });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (err: any) {
      console.error('❌ Profile update error:', err);
      diagnostics.log('profile-update', { result: 'error', error: err });
      
      toast({
        title: 'Update failed',
        description: err.message || 'Failed to update profile',
        variant: 'destructive',
      });
      
      throw new Error(err.message || 'Failed to update profile');
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}