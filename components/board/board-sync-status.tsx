"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, AlertCircle, Clock, ExternalLink } from "lucide-react"
import { boardApiClient } from "@/lib/board/client"
import type { BoardSyncResponse } from "@/lib/board/types"

interface BoardSyncStatusProps {
  bookingId: string
  boardProjectId?: number
  estimateId?: number
  onSyncComplete?: (response: BoardSyncResponse) => void
}

interface SyncStatus {
  status: "idle" | "syncing" | "success" | "error"
  lastSyncAt?: string
  message?: string
  estimateId?: number
}

export function BoardSyncStatus({ bookingId, boardProjectId, estimateId, onSyncComplete }: BoardSyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: "idle" })
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  // Board API接続テスト
  const testConnection = async () => {
    try {
      const result = await boardApiClient.testConnection()
      setIsConnected(result.success)
      if (!result.success) {
        setSyncStatus({
          status: "error",
          message: result.message,
        })
      }
    } catch (error) {
      setIsConnected(false)
      setSyncStatus({
        status: "error",
        message: "Board APIへの接続に失敗しました",
      })
    }
  }

  // 見積もり同期実行
  const handleSync = async () => {
    if (!boardProjectId) {
      setSyncStatus({
        status: "error",
        message: "Board案件が選択されていません",
      })
      return
    }

    setSyncStatus({ status: "syncing" })

    try {
      // 実際の予約データを取得してBoard形式に変換
      // ここでは簡略化したサンプルデータを使用
      const syncRequest = {
        project_id: boardProjectId,
        estimate_id: estimateId,
        sync_type: estimateId ? "update" : ("create" as const),
        items: [
          {
            item_code: "ROOM_001",
            item_name: "スタンダードルーム 室料",
            category: "宿泊料金",
            quantity: 2,
            unit: "泊",
            unit_price: 15000,
            amount: 30000,
            description: "2024-02-15 ～ 2024-02-17 (2泊)",
          },
          {
            item_code: "GUEST_ADULT",
            item_name: "大人 宿泊料",
            category: "個人料金",
            quantity: 4,
            unit: "人泊",
            unit_price: 4800,
            amount: 19200,
            description: "2名 × 2泊",
          },
        ],
      }

      const response = await boardApiClient.syncEstimate(syncRequest)

      if (response.success) {
        setSyncStatus({
          status: "success",
          lastSyncAt: new Date().toISOString(),
          message: "見積もりの同期が完了しました",
          estimateId: response.estimate_id,
        })
        onSyncComplete?.(response)
      } else {
        setSyncStatus({
          status: "error",
          message: response.message || "同期に失敗しました",
        })
      }
    } catch (error) {
      setSyncStatus({
        status: "error",
        message: error instanceof Error ? error.message : "同期処理でエラーが発生しました",
      })
    }
  }

  // Board編集ページを開く
  const openBoardEdit = () => {
    if (boardProjectId) {
      const url = boardApiClient.getEditUrl(boardProjectId, "estimate")
      window.open(url, "_blank")
    }
  }

  // 初期化時に接続テスト
  useEffect(() => {
    testConnection()
  }, [])

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = () => {
    switch (syncStatus.status) {
      case "syncing":
        return <Badge variant="secondary">同期中</Badge>
      case "success":
        return <Badge variant="default">同期済み</Badge>
      case "error":
        return <Badge variant="destructive">エラー</Badge>
      default:
        return <Badge variant="outline">未同期</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Board連携ステータス
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 接続状況 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">API接続状況:</span>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected === null ? "確認中" : isConnected ? "接続済み" : "接続エラー"}
          </Badge>
        </div>

        {/* 同期状況 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">同期ステータス:</span>
          {getStatusBadge()}
        </div>

        {/* Board案件情報 */}
        {boardProjectId && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Board案件ID:</span>
            <span className="text-sm">{boardProjectId}</span>
          </div>
        )}

        {/* 見積もりID */}
        {syncStatus.estimateId && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">見積もりID:</span>
            <span className="text-sm">{syncStatus.estimateId}</span>
          </div>
        )}

        {/* 最終同期日時 */}
        {syncStatus.lastSyncAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">最終同期:</span>
            <span className="text-sm">{new Date(syncStatus.lastSyncAt).toLocaleString("ja-JP")}</span>
          </div>
        )}

        {/* メッセージ */}
        {syncStatus.message && (
          <div
            className={`p-3 rounded-md text-sm ${
              syncStatus.status === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : syncStatus.status === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {syncStatus.message}
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            disabled={!isConnected || !boardProjectId || syncStatus.status === "syncing"}
            className="flex-1"
          >
            {syncStatus.status === "syncing" ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                同期中...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                見積もり同期
              </>
            )}
          </Button>

          {boardProjectId && (
            <Button variant="outline" onClick={openBoardEdit}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Board編集
            </Button>
          )}
        </div>

        {/* 接続テスト */}
        <Button variant="outline" onClick={testConnection} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          接続テスト
        </Button>
      </CardContent>
    </Card>
  )
}
