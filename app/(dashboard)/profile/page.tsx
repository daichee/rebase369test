"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Mail, Calendar, Shield, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ProfilePage() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (error) throw error

        setUserProfile(profile)
        setProfileData({
          name: profile.name || "",
          email: profile.email || user.email || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } catch (error) {
        console.error("プロフィール取得エラー:", error)
        setError("プロフィール情報の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(null)
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // プロフィール情報を更新
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          name: profileData.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      setSuccess("プロフィール情報が更新されました")
    } catch (error: any) {
      console.error("プロフィール更新エラー:", error)
      setError("プロフィール情報の更新に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!user) return

    if (!profileData.currentPassword || !profileData.newPassword || !profileData.confirmPassword) {
      setError("すべてのパスワード項目を入力してください")
      return
    }

    if (profileData.newPassword.length < 6) {
      setError("新しいパスワードは6文字以上で入力してください")
      return
    }

    if (profileData.newPassword !== profileData.confirmPassword) {
      setError("新しいパスワードが一致しません")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // 現在のパスワードで認証確認
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: profileData.currentPassword,
      })

      if (signInError) {
        setError("現在のパスワードが正しくありません")
        return
      }

      // パスワードを更新
      const { error: updateError } = await supabase.auth.updateUser({
        password: profileData.newPassword
      })

      if (updateError) throw updateError

      setSuccess("パスワードが更新されました")
      setProfileData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (error: any) {
      console.error("パスワード更新エラー:", error)
      setError("パスワードの更新に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">プロフィール情報を読み込み中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">プロフィール管理</h1>
        <p className="text-muted-foreground">アカウント情報とセキュリティ設定を管理できます</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* プロフィール情報 */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <CardTitle>基本情報</CardTitle>
          </div>
          <CardDescription>ユーザーの基本情報を確認・編集できます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">氏名</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="氏名を入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                value={profileData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                メールアドレスの変更はサポートまでお問い合わせください
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">アカウント情報</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>メール: {user?.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>登録日: {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString("ja-JP") : "不明"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>アカウント種別: 管理者</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpdateProfile} 
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                更新中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                プロフィールを更新
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* パスワード変更 */}
      <Card>
        <CardHeader>
          <CardTitle>パスワード変更</CardTitle>
          <CardDescription>セキュリティのため定期的にパスワードを変更することを推奨します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">現在のパスワード</Label>
              <Input
                id="currentPassword"
                type="password"
                value={profileData.currentPassword}
                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                placeholder="現在のパスワード"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="password"
                value={profileData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder="新しいパスワード（6文字以上）"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード確認</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={profileData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="パスワードを再入力"
                minLength={6}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>パスワードの要件:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>6文字以上</li>
              <li>安全性のため、英数字と記号を組み合わせることを推奨</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpdatePassword} 
            disabled={saving}
            variant="outline"
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                更新中...
              </>
            ) : (
              "パスワードを変更"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}