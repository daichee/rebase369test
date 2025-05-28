"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Clock, RefreshCw, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

type SyncStatus = "success" | "error" | "waiting" | "syncing" | "idle"

interface SyncLog {
  timestamp: string
  status: SyncStatus
  message: string
  details?: string
}

export function BoardSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      status: "success",
      message: "Board案件データ同期完了",
      details: "15件の案件を同期しました"
    },
    {
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      status: "error",
      message: "API接続エラー",
      details: "Board APIサーバーに接続できませんでした"
    }
  ])

  useEffect(() => {
    // Set initial last sync time
    if (syncLogs.length > 0) {
      const lastSuccessfulSync = syncLogs.find(log => log.status === "success")
      if (lastSuccessfulSync) {
        setLastSync(lastSuccessfulSync.timestamp)
        setSyncStatus("success")
      }
    }
  }, [syncLogs])

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncStatus("syncing")

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate random success/failure
      const isSuccess = Math.random() > 0.3 // 70% success rate

      const newLog: SyncLog = {
        timestamp: new Date().toISOString(),
        status: isSuccess ? "success" : "error",
        message: isSuccess ? "Board案件データ同期完了" : "同期エラーが発生しました",
        details: isSuccess ? `${Math.floor(Math.random() * 20) + 5}件の案件を同期しました` : "Board APIサーバーとの通信に失敗しました"
      }

      setSyncLogs(prev => [newLog, ...prev.slice(0, 9)]) // Keep last 10 logs
      setSyncStatus(newLog.status)
      
      if (isSuccess) {
        setLastSync(newLog.timestamp)
      }
    } catch (error) {
      const errorLog: SyncLog = {
        timestamp: new Date().toISOString(),
        status: "error",
        message: "予期しないエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー"
      }
      
      setSyncLogs(prev => [errorLog, ...prev.slice(0, 9)])
      setSyncStatus("error")
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "waiting":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "syncing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: SyncStatus) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500 hover:bg-green-600">同期完了</Badge>
      case "error":
        return <Badge variant="destructive">エラー</Badge>
      case "waiting":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">待機中</Badge>
      case "syncing":
        return <Badge className="bg-blue-500 hover:bg-blue-600">同期中</Badge>
      default:
        return <Badge variant="outline">未同期</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return "数秒前"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`
    
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Board同期ステータス
            </CardTitle>
            <CardDescription>
              Board APIとの同期状況
              {lastSync && (
                <span className="block text-xs mt-1">
                  最終同期: {formatTimestamp(lastSync)}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(syncStatus)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Alert */}
        {syncStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Board APIとの同期でエラーが発生しています。管理者にお問い合わせください。
            </AlertDescription>
          </Alert>
        )}

        {syncStatus === "success" && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Board APIとの同期が正常に完了しています。
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                同期中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                手動同期実行
              </>
            )}
          </Button>
        </div>

        {/* Sync History */}
        <div>
          <h4 className="font-medium text-sm mb-2">同期履歴</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {syncLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded text-sm">
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{log.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}