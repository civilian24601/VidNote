import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../../../supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: "student" | "teacher";
  avatarUrl: string | null;
  instruments: string[] | null;
  experienceLevel: string | null;
  bio: string | null;
  isComplete: boolean;
}

interface UserMetadata {
  username: string;
  full_name: string;
  role: "student" | "teacher";
  instruments?: string[] | null;
  experience_level?: string[] | null;
  bio?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: UserMetadata
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(supabaseUser: SupabaseUser, userProfile?: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    username:
      userProfile?.username || supabaseUser.user_metadata?.username || "",
    fullName:
      userProfile?.full_name || supabaseUser.user_metadata?.full_name || "",
    role: userProfile?.role || supabaseUser.user_metadata?.role || "student",
    avatarUrl:
      userProfile?.avatar_url || supabaseUser.user_metadata?.avatar_url || null,
    instruments:
      userProfile?.instruments || supabaseUser.user_metadata?.instruments || [],
    experienceLevel:
      userProfile?.experience_level ||
      supabaseUser.user_metadata?.experience_level ||
      null,
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

  async function fetchUserProfile(userId: string) {
    console.log("🔍 fetchUserProfile called with userId:", userId);
    try {
      console.log("🔍 Executing Supabase query for user:", userId);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      
      // Detailed query result logging
      console.log("🔍 Raw Supabase Response:", {
        hasData: !!data,
        dataFields: data ? Object.keys(data) : null,
        error: error ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        } : null
      });

      if (error || !data) {
        console.error("❌ fetchUserProfile failed:", {
          error,
          userId,
          timestamp: new Date().toISOString()
        });
        return null;
      }
      return data;
    } catch (err) {
      console.error("🔥 fetchUserProfile unexpected error:", err);
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
    async function getInitialSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(mapSupabaseUser(session.user, profile));
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("🔍 Auth State Change fired:", { event: _event, session });
      setSession(session);
      if (session?.user) {
        console.log("🔍 Fetching profile for user:", session.user.id);
        const profile = await fetchUserProfile(session.user.id);
        console.log("🔍 Profile fetch result:", { profile });
        const mappedUser = mapSupabaseUser(session.user, profile);
        console.log("🔍 Setting user state to:", mappedUser);
        setUser(mappedUser);
      } else {
        console.log("🔍 No session user, setting user state to null");
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(
    email: string,
    password: string,
    metadata: UserMetadata
  ) {
    setLoading(true);
    console.log("📝 Registering with:", email, metadata);
    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
            emailRedirectTo: window.location.origin,
          },
        });

      if (signUpError) throw new Error(signUpError.message || "Sign-up failed");

      const user = signUpData?.user;
      if (!user) {
        console.warn("⚠️ No user returned after sign-up");
        return;
      }

      const { error: insertError } = await supabase.from("users").insert([
        {
          id: user.id,
          email: user.email,
          username: metadata.username,
          full_name: metadata.full_name,
          role: metadata.role,
          instruments: metadata.instruments || [],
          experience_level: metadata.experience_level || null,
          bio: metadata.bio || null,
          avatar_url: metadata.avatar_url || null,
        },
      ]);

      if (insertError) {
        console.error("❌ Failed to insert profile:", insertError);
        throw new Error("Error creating user profile");
      }

      console.log("✅ Registered and profile saved");
    } catch (err: any) {
      console.error("🔥 signUp error:", err);
      throw new Error(err.message || "Unexpected error");
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
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      console.log("✅ Successfully signed out");
    } catch (err) {
      console.error("Error signing out:", err);
      throw new Error("Error signing out");
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