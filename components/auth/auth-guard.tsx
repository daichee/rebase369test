"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // 認証不要ページのリスト
  const publicPages = ["/", "/login", "/signup", "/reset-password"]
  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    if (!loading && requireAuth && !user && !isPublicPage) {
      router.push("/login")
    }
  }, [user, loading, requireAuth, router, isPublicPage])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">認証確認中</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requireAuth && !user && !isPublicPage) {
    return null
  }

  return <>{children}</>
}
