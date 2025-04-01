import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@shared/schema";

// Mock user data for UI development
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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user data exists in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      // Mock login logic for UI development
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      let userData: User;
      if (email.includes("teacher")) {
        userData = MOCK_TEACHER;
      } else {
        userData = MOCK_STUDENT;
      }
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw new Error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any): Promise<User> => {
    setLoading(true);
    try {
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
      
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    } catch (error) {
      throw new Error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const contextValue: AuthContextType = { 
    user, 
    loading, 
    login, 
    register, 
    logout, 
    isAuthenticated: !!user 
  };
  
  // @ts-ignore - JSX elements in .ts files can sometimes cause type errors
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
