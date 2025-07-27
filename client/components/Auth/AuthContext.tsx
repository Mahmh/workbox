// AuthContext.tsx
"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback
} from "react"
import { createClient, Session, User } from "@supabase/supabase-js"

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<string | null>
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_PUBLIC_KEY || ""
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000"

// Initialize Supabase client
const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Effect to listen for Supabase auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user || null)
        setLoading(false)
      }
    )

    // Initial check for session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user || null)
      setLoading(false)
    })

    return () => {
      authListener?.unsubscribe()
    }
  }, [])

  // Function to handle user login via backend API
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Login failed")
      }

      // Supabase client handles setting the session from the token returned by backend
      const { data: { session: newSession }, error } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (error) {
        throw new Error(error.message || "Failed to set session after login");
      }

      setSession(newSession);
      setUser(newSession?.user || null);
      return null; // No error message
    } catch (err: any) {
      console.error("Login error:", err.message)
      return err.message || "An unexpected error occurred during login."
    } finally {
      setLoading(false)
    }
  }, [])

  // Function to handle user signup via backend API
  const signup = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Signup failed")
      }

      if (data.session) {
        // If session is returned (auto-login after signup)
        const { data: { session: newSession }, error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (error) {
          throw new Error(error.message || "Failed to set session after signup");
        }
        setSession(newSession);
        setUser(newSession?.user || null);
      } else {
        // If no session, typically means email confirmation is required
        setSession(null);
        setUser(null);
        return data.message || "Please check your email to confirm your account.";
      }
      return null; // No error message
    } catch (err: any) {
      console.error("Signup error:", err.message)
      return err.message || "An unexpected error occurred during signup."
    } finally {
      setLoading(false)
    }
  }, [])

  // Function to handle user logout via backend API
  const logout = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ''}` // Send token if available
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Logout failed")
      }

      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message || "Failed to sign out from Supabase.")
      }

      setSession(null)
      setUser(null)
      return null // No error message
    } catch (err: any) {
      console.error("Logout error:", err.message)
      return err.message || "An unexpected error occurred during logout."
    } finally {
      setLoading(false)
    }
  }, [session]) // Depend on session to ensure correct token is sent

  const value = {
    user,
    session,
    loading,
    login,
    signup,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
