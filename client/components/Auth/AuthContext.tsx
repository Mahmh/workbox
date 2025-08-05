"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { createClient, type Session, type User } from "@supabase/supabase-js"
import { SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, BACKEND_API_URL } from "../constants"

interface AuthContextType {
  user: User | null
  session: Session | null
  supabaseLoading: boolean
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<string | null>
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Initialize Supabase client for session management only
const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [supabaseLoading, setSupabaseLoading] = useState(false)

  // Effect to listen for Supabase auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user || null)
      setSupabaseLoading(false)
    })

    // Initial check for session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user || null)
      setSupabaseLoading(false)
    })

    return () => {
      authListener?.unsubscribe()
    }
  }, [])

  // Function to handle user login via backend API
  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Login failed")
      }

      const data = await response.json()

      if ('error' in data) {
        throw new Error(data.error || "An unexpected error occurred during login.")
      }

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
    }
  }, [])

  // Function to handle user signup via backend API
  const signup = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Signup failed")
      }

      const data = await response.json()

      if ('error' in data) {
        throw new Error(data.error || "An unexpected error occurred during login.")
      }

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
        return "Please check your email to confirm your account"
      }
    } catch (err: any) {
      console.error("Signup error:", err.message)
      return err.message || "An unexpected error occurred during signup"
    }
  }, [])

  // Function to handle user logout
  const logout = useCallback(async (): Promise<string | null> => {
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
    }
  }, [session])

  const getAccessToken = useCallback(() => {
    return session?.access_token || null
  }, [session])

  const value = {
    user,
    session,
    login,
    supabaseLoading,
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
