"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { createClient, type Session, type User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<string | null>
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || "https://xtqazsapkzynvpsinran.supabase.co"
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWF6c2Fwa3p5bnZwc2lucmFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjYwMTEwNywiZXhwIjoyMDY4MTc3MTA3fQ.RI3OvzvuFW2HuIYfkG2_CfGTFwCJjWh0oxAR27ZW3ug"
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000"
// Initialize Supabase client for session management only
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
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user || null)
      setLoading(false)
    })

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
  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    setLoading(true)
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Login failed")
      }

      const data = await response.json()

      // Set session using tokens from backend
      if (data.session) {
        const { error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })

        if (error) {
          throw new Error(error.message || "Failed to set session after login")
        }
      }

      return null // Success
    } catch (err: any) {
      console.error("Login error:", err.message)
      return err.message || "An unexpected error occurred during login."
    } finally {
      setLoading(false)
    }
  }, [])

  // Function to handle user signup via backend API
  const signup = useCallback(async (email: string, password: string): Promise<string | null> => {
    setLoading(true)
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Signup failed")
      }

      const data = await response.json()

      if (data.session) {
        // Auto-login after signup
        const { error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })

        if (error) {
          throw new Error(error.message || "Failed to set session after signup")
        }
        return null // Success
      } else {
        // Email confirmation required
        return data.message || "Please check your email to confirm your account."
      }
    } catch (err: any) {
      console.error("Signup error:", err.message)
      return err.message || "An unexpected error occurred during signup."
    } finally {
      setLoading(false)
    }
  }, [])

  // Function to handle user logout
  const logout = useCallback(async (): Promise<string | null> => {
    setLoading(true)
    try {
      // Call backend logout endpoint
      if (session?.access_token) {
        await fetch(`${BACKEND_API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        })
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message || "Failed to sign out")
      }

      return null // Success
    } catch (err: any) {
      console.error("Logout error:", err.message)
      return err.message || "An unexpected error occurred during logout."
    } finally {
      setLoading(false)
    }
  }, [session])

  const getAccessToken = useCallback(() => {
    return session?.access_token || null
  }, [session])

  const value = {
    user,
    session,
    loading,
    login,
    signup,
    logout,
    getAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
