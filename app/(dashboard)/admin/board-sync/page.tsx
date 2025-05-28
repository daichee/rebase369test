"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  RefreshCw, 
  Sync, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Download,
  Upload,
  Settings
} from "lucide-react"
import { useBookingStore } from "@/store/booking-store"

interface SyncStatus {
  id: string
  bookingId: string
  boardEstimateId: string | null
  status: "pending" | "syncing" | "completed" | "error"
  lastSyncAt: string | null
  errorMessage: string | null
  customerName: string
  totalAmount: number
}

export default function BoardSyncPage() {
  const { bookings } = useBookingStore()
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([])
  const [isConnected, setIsConnected] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)
  const [activeSyncs, setActiveSyncs] = useState(0)

  // 初期化: 予約データからSync状況を生成
  useEffect(() => {
    const statuses: SyncStatus[] = bookings.map((booking) => ({
      id: `sync_${booking.id}`,
      bookingId: booking.id,
      boardEstimateId: booking.boardEstimateId || null,
      status: booking.boardEstimateId ? "completed" : "pending",
      lastSyncAt: booking.boardEstimateId ? booking.updatedAt : null,
      errorMessage: null,
      customerName: booking.customerName || `顧客${booking.customerId}`,
      totalAmount: booking.totalAmount
    }))
    setSyncStatuses(statuses)
    setLastSyncTime(new Date().toISOString())
  }, [bookings])

  const syncStats = {
    total: syncStatuses.length,
    completed: syncStatuses.filter(s => s.status === "completed").length,
    pending: syncStatuses.filter(s => s.status === "pending").length,
    error: syncStatuses.filter(s => s.status === "error").length,
    syncing: syncStatuses.filter(s => s.status === "syncing").length
  }

  const handleSyncAll = async () => {
    const pendingSync = syncStatuses.filter(s => s.status === "pending")
    if (pendingSync.length === 0) {
      alert("同期が必要な予約がありません。")
      return
    }

    setActiveSyncs(pendingSync.length)
    setSyncProgress(0)

    // 順次同期処理（デモ用のシミュレーション）
    for (let i = 0; i < pendingSync.length; i++) {
      const syncItem = pendingSync[i]
      
      // ステータスを「同期中」に更新
      setSyncStatuses(prev => prev.map(s => 
        s.id === syncItem.id 
          ? { ...s, status: "syncing" as const }
          : s
      ))

      // 同期処理をシミュレート（実際にはAPI呼び出し）
      await new Promise(resolve => setTimeout(resolve, 1000))

      // ランダムで成功/失敗を決定（デモ用）
      const success = Math.random() > 0.2

      // ステータスを更新
      setSyncStatuses(prev => prev.map(s => 
        s.id === syncItem.id 
          ? { 
              ...s, 
              status: success ? "completed" as const : "error" as const,
              boardEstimateId: success ? `EST_${Date.now()}_${i}` : null,
              lastSyncAt: new Date().toISOString(),
              errorMessage: success ? null : "Board APIとの通信でエラーが発生しました"
            }
          : s
      ))

      setSyncProgress(((i + 1) / pendingSync.length) * 100)
    }

    setLastSyncTime(new Date().toISOString())
    setActiveSyncs(0)
  }

  const handleSyncSingle = async (syncId: string) => {
    setSyncStatuses(prev => prev.map(s => 
      s.id === syncId 
        ? { ...s, status: "syncing" as const }
        : s
    ))

    // 同期処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1500))

    const success = Math.random() > 0.3

    setSyncStatuses(prev => prev.map(s => 
      s.id === syncId 
        ? { 
            ...s, 
            status: success ? "completed" as const : "error" as const,
            boardEstimateId: success ? `EST_${Date.now()}` : s.boardEstimateId,
            lastSyncAt: new Date().toISOString(),
            errorMessage: success ? null : "Board APIとの通信でエラーが発生しました"
          }
        : s
    ))
  }

  const handleRetryError = (syncId: string) => {
    handleSyncSingle(syncId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "syncing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      error: "destructive", 
      syncing: "secondary",
      pending: "outline"
    } as const

    const labels = {
      completed: "同期完了",
      error: "エラー",
      syncing: "同期中",
      pending: "未同期"
    }

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Board連携管理</h1>
          <p className="text-muted-foreground">見積もりシステムとの同期状況と管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open("https://the-board.jp", "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Board管理画面
          </Button>
          <Button onClick={handleSyncAll} disabled={activeSyncs > 0}>
            <Sync className="mr-2 h-4 w-4" />
            一括同期実行
          </Button>
        </div>
      </div>

      {/* 接続状況 */}
      <Alert className={`mb-6 ${isConnected ? 'border-green-500' : 'border-red-500'}`}>
        <div className="flex items-center">
          {isConnected ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription className="ml-2">
            {isConnected 
              ? "Board APIに正常に接続されています" 
              : "Board APIとの接続に問題があります。設定を確認してください。"
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総予約数</CardTitle>
            <Sync className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats.total}</div>
            <p className="text-xs text-muted-foreground">Board連携対象の予約</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">同期完了</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats.completed}</div>
            <p className="text-xs text-muted-foreground">見積もり作成済み</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未同期</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats.pending}</div>
            <p className="text-xs text-muted-foreground">同期待ちの予約</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">エラー</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats.error}</div>
            <p className="text-xs text-muted-foreground">同期エラーの予約</p>
          </CardContent>
        </Card>
      </div>

      {/* 同期進行状況 */}
      {activeSyncs > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">同期進行状況</span>
              <span className="text-sm text-muted-foreground">{Math.round(syncProgress)}%</span>
            </div>
            <Progress value={syncProgress} className="w-full" />
            <p className="text-xs text-muted-foreground mt-2">
              {activeSyncs}件の予約を同期中...
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="sync-list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sync-list">同期リスト</TabsTrigger>
          <TabsTrigger value="sync-log">同期ログ</TabsTrigger>
          <TabsTrigger value="settings">同期設定</TabsTrigger>
        </TabsList>

        {/* 同期リスト */}
        <TabsContent value="sync-list">
          <Card>
            <CardHeader>
              <CardTitle>予約同期状況</CardTitle>
              <CardDescription>
                各予約のBoard見積もりとの同期状況
                {lastSyncTime && (
                  <span className="ml-2 text-xs">
                    最終更新: {new Date(lastSyncTime).toLocaleString("ja-JP")}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>予約ID</TableHead>
                    <TableHead>顧客名</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>同期状況</TableHead>
                    <TableHead>Board見積もりID</TableHead>
                    <TableHead>最終同期</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncStatuses.map((sync) => (
                    <TableRow key={sync.id}>
                      <TableCell className="font-medium">
                        {sync.bookingId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{sync.customerName}</TableCell>
                      <TableCell>¥{sync.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(sync.status)}
                          {getStatusBadge(sync.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sync.boardEstimateId ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-mono">{sync.boardEstimateId}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`https://the-board.jp/estimates/${sync.boardEstimateId}`, "_blank")}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sync.lastSyncAt ? (
                          <span className="text-sm">
                            {new Date(sync.lastSyncAt).toLocaleString("ja-JP")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sync.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncSingle(sync.id)}
                          >
                            <Upload className="mr-1 h-3 w-3" />
                            同期
                          </Button>
                        )}
                        {sync.status === "error" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetryError(sync.id)}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            再試行
                          </Button>
                        )}
                        {sync.status === "completed" && sync.boardEstimateId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://the-board.jp/estimates/${sync.boardEstimateId}`, "_blank")}
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            開く
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 同期ログ */}
        <TabsContent value="sync-log">
          <Card>
            <CardHeader>
              <CardTitle>同期ログ</CardTitle>
              <CardDescription>同期処理の詳細ログ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {syncStatuses
                  .filter(s => s.lastSyncAt)
                  .sort((a, b) => new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime())
                  .slice(0, 20)
                  .map((sync) => (
                    <div key={sync.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(sync.status)}
                          <span className="font-medium">予約 {sync.bookingId.slice(0, 8)}...</span>
                          <span className="text-sm text-muted-foreground">{sync.customerName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {sync.lastSyncAt && new Date(sync.lastSyncAt).toLocaleString("ja-JP")}
                        </span>
                      </div>
                      {sync.errorMessage && (
                        <p className="text-sm text-red-600 mt-1">{sync.errorMessage}</p>
                      )}
                      {sync.boardEstimateId && sync.status === "completed" && (
                        <p className="text-sm text-green-600 mt-1">
                          見積もり {sync.boardEstimateId} を作成しました
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 同期設定 */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                同期設定
              </CardTitle>
              <CardDescription>Board連携の詳細設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Board API設定は「システム設定」ページで行ってください。
                  <Button variant="link" className="p-0 h-auto ml-1">
                    設定ページへ
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">自動同期</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    新しい予約が作成された時に自動的にBoard見積もりを作成
                  </p>
                  <Badge variant="secondary">今後実装予定</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">同期項目の設定</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Boardに送信する項目をカスタマイズ
                  </p>
                  <Badge variant="secondary">今後実装予定</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">エラー通知</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    同期エラー時にメール通知を送信
                  </p>
                  <Badge variant="secondary">今後実装予定</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}