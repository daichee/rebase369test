"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth/auth-provider"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
      setError("すべての項目を入力してください")
      return false
    }

    if (formData.password.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("有効なメールアドレスを入力してください")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      await signUp(formData.email, formData.password)
      setSuccess(true)

      // 3秒後にログインページにリダイレクト
      setTimeout(() => {
        router.push("/login?message=signup_success")
      }, 3000)
    } catch (error: any) {
      console.error("サインアップエラー:", error)

      // Supabaseのエラーメッセージを日本語化
      if (error.message?.includes("User already registered")) {
        setError("このメールアドレスは既に登録されています")
      } else if (error.message?.includes("Invalid email")) {
        setError("有効なメールアドレスを入力してください")
      } else if (error.message?.includes("Password should be at least")) {
        setError("パスワードは6文字以上で入力してください")
      } else {
        setError("アカウント作成に失敗しました。もう一度お試しください。")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">アカウント作成完了</CardTitle>
            <CardDescription>確認メールを送信しました。メールをご確認の上、ログインしてください。</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">{formData.email} に確認メールを送信しました。</p>
            <p className="text-sm text-muted-foreground">3秒後に自動的にログインページに移動します...</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login">今すぐログインページへ</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link href="/login" className="absolute left-4 top-4 md:left-8 md:top-8">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          ログインに戻る
        </Button>
      </Link>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">アカウント作成</CardTitle>
            <CardDescription className="text-center">ReBASE 369 予約システムのアカウントを作成</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="name">氏名</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="山田太郎"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="6文字以上"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="パスワードを再入力"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <div className="text-xs text-muted-foreground">
                <p>アカウントを作成することで、以下に同意したものとみなします：</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>利用規約</li>
                  <li>プライバシーポリシー</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    アカウント作成中...
                  </>
                ) : (
                  "アカウントを作成"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                既にアカウントをお持ちですか？{" "}
                <Link href="/login" className="text-primary hover:underline">
                  ログイン
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
