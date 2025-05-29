"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/auth-helpers-nextjs"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<any>
  lastActivity: number | null
  resetActivityTimer: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState<number | null>(null)
  const supabase = createClient()

  // Session timeout configuration (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
  
  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  // Auto-logout functionality
  useEffect(() => {
    if (!user || !lastActivity) return

    const checkSession = () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity
      
      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        // Use setTimeout to avoid state updates during render phase
        setTimeout(() => {
          signOut()
          alert("セッションの有効期限が切れました。再度ログインしてください。")
        }, 0)
      }
    }

    // Check session every minute
    const interval = setInterval(checkSession, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [user, lastActivity])

  // Track user activity
  useEffect(() => {
    if (!user) return

    const handleActivity = () => {
      resetActivityTimer()
    }

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Initialize activity timer
    resetActivityTimer()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [user, resetActivityTimer])

  // Session refresh functionality
  useEffect(() => {
    if (!user) return

    const refreshSession = async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (error) {
          console.error("Session refresh error:", error)
          // If refresh fails, sign out user - use setTimeout to avoid state updates during render phase
          setTimeout(() => {
            signOut()
          }, 0)
        }
      } catch (error) {
        console.error("Session refresh error:", error)
        // Use setTimeout to avoid state updates during render phase
        setTimeout(() => {
          signOut()
        }, 0)
      }
    }

    // Refresh session every 25 minutes (before 30-minute timeout)
    const refreshInterval = setInterval(refreshSession, 25 * 60 * 1000)
    
    return () => clearInterval(refreshInterval)
  }, [user])

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0], // 名前が提供されない場合はメールアドレスの@より前を使用
        },
      },
    })

    if (error) throw error

    // サインアップ成功時にユーザープロフィールを作成
    if (data.user) {
      try {
        const { error: profileError } = await supabase.from("user_profiles").insert({
          id: data.user.id,
          email: data.user.email!,
          name: name || email.split("@")[0],
          first_login: true,
        })

        if (profileError) {
          console.error("プロフィール作成エラー:", profileError)
        }
      } catch (profileError) {
        console.error("プロフィール作成エラー:", profileError)
      }
    }

    return data
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp, lastActivity, resetActivityTimer }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
