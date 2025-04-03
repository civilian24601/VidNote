import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../../../supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

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
  experience_level?: string | null;
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
    metadata: UserMetadata,
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
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (error || !data) {
        console.error("❌ fetchUserProfile failed:", error);
        return null;
      }
      return data;
    } catch (err) {
      console.error("🔥 fetchUserProfile unexpected error:", err);
      return null;
    }
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
      setSession(session);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(mapSupabaseUser(session.user, profile));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(
    email: string,
    password: string,
    metadata: UserMetadata,
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
          id: user.id, // 🔥 critical for RLS policy
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
    console.log("🔐 Sign-in attempt for:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log("📬 Supabase response:", { data, error });
      if (error) throw new Error(error.message || "Login failed");

      const user = data?.user;
      if (!user) {
        console.warn("⚠️ Login returned no user");
        return;
      }

      const profile = await fetchUserProfile(user.id);
      if (!profile) {
        console.warn("📭 No profile found — creating...");
        const { error: insertError } = await supabase.from("users").insert([
          {
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username || "",
            full_name: user.user_metadata?.full_name || "",
            role: user.user_metadata?.role || "student",
            instruments: user.user_metadata?.instruments || [],
            experience_level: user.user_metadata?.experience_level || null,
            bio: user.user_metadata?.bio || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          },
        ]);
        if (insertError)
          console.error("❌ Failed to insert fallback profile:", insertError);
      }

      console.log("✅ Sign-in success for:", user.id);
    } catch (err: any) {
      console.error("🔥 signIn error:", err);
      throw new Error(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
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
      if (profile) setUser(mapSupabaseUser(user, profile));
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
