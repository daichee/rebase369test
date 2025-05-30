"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { ErrorBoundary } from "@/components/common/error-boundary"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">認証確認中...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}