"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Loader2, ShieldX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    if (!loading) {
      setHasCheckedAuth(true)
      
      if (!user) {
        router.push("/login")
        return
      }
    }
  }, [user, loading, router])

  // 認証確認中の表示
  if (loading || !hasCheckedAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
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

  // ユーザーが未認証の場合
  if (!user) {
    return null
  }

  // 管理者権限がない場合のエラー表示
  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600 flex items-center justify-center">
              <ShieldX className="mr-2 h-6 w-6" />
              アクセス権限がありません
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              管理画面にアクセスするには管理者権限が必要です。
            </p>
            <Button 
              onClick={() => router.push("/dashboard")} 
              className="w-full"
            >
              ダッシュボードに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}