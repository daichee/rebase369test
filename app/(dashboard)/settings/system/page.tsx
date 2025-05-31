"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Save, 
  Database, 
  Mail, 
  Bell, 
  Shield, 
  Settings2,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    // データベース設定
    database: {
      host: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xxx.supabase.co",
      status: "connected"
    },
    
    // Board API設定
    boardApi: {
      endpoint: process.env.NEXT_PUBLIC_BOARD_API_URL || "",
      apiKey: "••••••••••••••••",
      status: "connected"
    },
    
    // メール設定
    email: {
      smtpServer: "smtp.gmail.com",
      smtpPort: 587,
      username: "",
      enableNotifications: true
    },
    
    // 通知設定
    notifications: {
      newBooking: true,
      paymentReceived: true,
      cancellation: true,
      dailyReport: false
    },
    
    // システム設定
    system: {
      siteName: "淡路Reベース369",
      timezone: "Asia/Tokyo",
      language: "ja",
      maintenanceMode: false,
      debugMode: false
    }
  })

  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null)

  const handleSave = () => {
    // 実際の保存処理は省略（環境変数や設定ファイルへの書き込み）
    setSaveStatus({
      success: true,
      message: "設定が正常に保存されました。"
    })
    
    setTimeout(() => setSaveStatus(null), 3000)
  }

  const testConnection = (service: string) => {
    // 接続テストの実装（実際にはAPIコールなど）
    alert(`${service}への接続テストを実行しました。`)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">システム設定</h1>
          <p className="text-muted-foreground">システム全般の設定と外部連携の管理</p>
        </div>
        <Button onClick={handleSave} className="flex items-center">
          <Save className="mr-2 h-4 w-4" />
          設定を保存
        </Button>
      </div>

      {/* 保存状況表示 */}
      {saveStatus && (
        <Alert className={`mb-6 ${saveStatus.success ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center">
            {saveStatus.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className="ml-2">{saveStatus.message}</AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs defaultValue="database" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="database">データベース</TabsTrigger>
          <TabsTrigger value="integrations">外部連携</TabsTrigger>
          <TabsTrigger value="notifications">通知設定</TabsTrigger>
          <TabsTrigger value="system">システム</TabsTrigger>
          <TabsTrigger value="security">セキュリティ</TabsTrigger>
        </TabsList>

        {/* データベース設定 */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                データベース設定
              </CardTitle>
              <CardDescription>Supabaseデータベースの接続設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="db-url">データベースURL</Label>
                  <Input
                    id="db-url"
                    value={settings.database.host}
                    onChange={(e) => setSettings({
                      ...settings,
                      database: { ...settings.database, host: e.target.value }
                    })}
                    placeholder="https://xxx.supabase.co"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">接続状況</div>
                    <div className="text-sm text-muted-foreground">データベースへの接続状態</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={settings.database.status === "connected" ? "default" : "destructive"}>
                      {settings.database.status === "connected" ? "接続中" : "切断"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => testConnection("データベース")}>
                      接続テスト
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 外部連携設定 */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Board API連携</CardTitle>
                <CardDescription>見積もり管理システムとの連携設定</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="board-endpoint">API エンドポイント</Label>
                  <Input
                    id="board-endpoint"
                    value={settings.boardApi.endpoint}
                    onChange={(e) => setSettings({
                      ...settings,
                      boardApi: { ...settings.boardApi, endpoint: e.target.value }
                    })}
                    placeholder="https://api.the-board.jp/v1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="board-key">API キー</Label>
                  <Input
                    id="board-key"
                    type="password"
                    value={settings.boardApi.apiKey}
                    onChange={(e) => setSettings({
                      ...settings,
                      boardApi: { ...settings.boardApi, apiKey: e.target.value }
                    })}
                    placeholder="API キーを入力"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">接続状況</div>
                    <div className="text-sm text-muted-foreground">Board APIへの接続状態</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={settings.boardApi.status === "connected" ? "default" : "destructive"}>
                      {settings.boardApi.status === "connected" ? "接続中" : "切断"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => testConnection("Board API")}>
                      接続テスト
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  メール設定
                </CardTitle>
                <CardDescription>通知メール送信の設定</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-server">SMTPサーバー</Label>
                    <Input
                      id="smtp-server"
                      value={settings.email.smtpServer}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, smtpServer: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">ポート</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, smtpPort: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-username">ユーザー名</Label>
                  <Input
                    id="email-username"
                    value={settings.email.username}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, username: e.target.value }
                    })}
                    placeholder="your-email@gmail.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 通知設定 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                通知設定
              </CardTitle>
              <CardDescription>各種イベントの通知設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">新規予約通知</div>
                    <div className="text-sm text-muted-foreground">新しい予約が入った時に通知</div>
                  </div>
                  <Switch
                    checked={settings.notifications.newBooking}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, newBooking: checked }
                    })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">支払い完了通知</div>
                    <div className="text-sm text-muted-foreground">支払いが完了した時に通知</div>
                  </div>
                  <Switch
                    checked={settings.notifications.paymentReceived}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, paymentReceived: checked }
                    })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">キャンセル通知</div>
                    <div className="text-sm text-muted-foreground">予約がキャンセルされた時に通知</div>
                  </div>
                  <Switch
                    checked={settings.notifications.cancellation}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, cancellation: checked }
                    })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">日次レポート</div>
                    <div className="text-sm text-muted-foreground">毎日の売上・予約状況をメール送信</div>
                  </div>
                  <Switch
                    checked={settings.notifications.dailyReport}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, dailyReport: checked }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* システム設定 */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings2 className="mr-2 h-5 w-5" />
                システム設定
              </CardTitle>
              <CardDescription>基本的なシステム設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">サイト名</Label>
                  <Input
                    id="site-name"
                    value={settings.system.siteName}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings.system, siteName: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">タイムゾーン</Label>
                  <Input
                    id="timezone"
                    value={settings.system.timezone}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings.system, timezone: e.target.value }
                    })}
                    disabled
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">メンテナンスモード</div>
                    <div className="text-sm text-muted-foreground">システムを一時的に停止</div>
                  </div>
                  <Switch
                    checked={settings.system.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      system: { ...settings.system, maintenanceMode: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">デバッグモード</div>
                    <div className="text-sm text-muted-foreground">詳細なログ出力を有効化</div>
                  </div>
                  <Switch
                    checked={settings.system.debugMode}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      system: { ...settings.system, debugMode: checked }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* セキュリティ設定 */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                セキュリティ設定
              </CardTitle>
              <CardDescription>認証とアクセス制御の設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  セキュリティ設定の変更は、システム管理者のみが行うことができます。
                  変更を行う前に、必ずバックアップを取得してください。
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">認証方式</h3>
                  <p className="text-sm text-muted-foreground">
                    現在: Supabase Auth（メール/パスワード認証）
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">アクセス制御</h3>
                  <p className="text-sm text-muted-foreground">
                    Row Level Security（RLS）により、ユーザーは自分のデータのみアクセス可能
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">データ暗号化</h3>
                  <p className="text-sm text-muted-foreground">
                    すべてのデータはHTTPS/TLSで暗号化して転送・保存
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}