"use client"

import { CardFooter } from "@/components/ui/card"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth/auth-provider"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const message = searchParams.get("message")
    if (message === "signup_success") {
      setSuccessMessage("アカウントが作成されました。ログインしてください。")
    } else if (message === "password_updated") {
      setSuccessMessage("パスワードが更新されました。新しいパスワードでログインしてください。")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await signIn(email, password)
      router.push("/dashboard")
    } catch (error: any) {
      console.error("ログインエラー:", error)

      if (error.message?.includes("Invalid login credentials")) {
        setError("メールアドレスまたはパスワードが正しくありません")
      } else if (error.message?.includes("Email not confirmed")) {
        setError("メールアドレスの確認が完了していません。確認メールをご確認ください。")
      } else {
        setError("ログインに失敗しました。もう一度お試しください。")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          ホームへ戻る
        </Button>
      </Link>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">ReBASE 369</CardTitle>
            <CardDescription className="text-center">予約管理システムにログイン</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              {successMessage && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">パスワード</Label>
                  <Link href="/reset-password" className="text-xs text-primary hover:underline">
                    パスワードを忘れた方
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ログイン中...
                  </>
                ) : (
                  "ログイン"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                アカウントをお持ちでない方は{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  新規登録
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>デモ用アカウント</p>
          <p>Email: d.kondo2618@gmail.com</p>
          <p>Password: 3LqzBfE5JC6YkyD</p>
        </div>
      </div>
    </div>
  )
}
