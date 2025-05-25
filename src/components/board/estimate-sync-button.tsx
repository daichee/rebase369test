"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { BoardSyncInfo } from "@/lib/board/types"

interface EstimateSyncButtonProps {
  bookingId: string
  onSyncComplete?: (syncInfo: BoardSyncInfo) => void
}

export function EstimateSyncButton({ bookingId, onSyncComplete }: EstimateSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [syncInfo, setSyncInfo] = useState<BoardSyncInfo | null>(null)

  // 同期状態を確認
  const checkSyncStatus = async () => {
    try {
      const response = await fetch(`/api/board/sync?bookingId=${bookingId}`)

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setSyncInfo(data.data)
          return data.data
        }
      }
      return null
    } catch (error) {
      console.error("同期状態確認エラー:", error)
      return null
    }
  }

  // 初期ロード時に同期状態を確認
  React.useEffect(() => {
    const loadSyncStatus = async () => {
      const info = await checkSyncStatus()
      if (info) {
        setSyncInfo(info)
      }
    }

    loadSyncStatus()
  }, [bookingId])

  // 見積もり同期を実行
  const handleSync = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/board/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "見積もり同期完了",
          description: "Boardへの見積もり同期が完了しました。",
        })

        setSyncInfo(data.data)

        if (onSyncComplete) {
          onSyncComplete(data.data)
        }
      } else {
        toast({
          title: "見積もり同期エラー",
          description: data.message || "同期中にエラーが発生しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("見積もり同期エラー:", error)
      toast({
        title: "見積もり同期エラー",
        description: "同期中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 見積書PDFを表示
  const handleViewPdf = async () => {
    if (!syncInfo?.estimateId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/board/pdf?estimateId=${syncInfo.estimateId}`)

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.url) {
          // 新しいタブでPDFを開く
          window.open(data.data.url, "_blank")
        } else {
          toast({
            title: "PDF取得エラー",
            description: "見積書PDFの取得に失敗しました。",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "PDF取得エラー",
          description: "見積書PDFの取得に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("PDF取得エラー:", error)
      toast({
        title: "PDF取得エラー",
        description: "見積書PDFの取得に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 同期状態に応じたボタンを表示
  if (!syncInfo || syncInfo.status === "error") {
    return (
      <Button onClick={handleSync} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            同期中...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Boardと同期
          </>
        )}
      </Button>
    )
  }

  if (syncInfo.status === "synced") {
    return (
      <div className="flex space-x-2">
        <Button variant="outline" onClick={handleViewPdf} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          見積書PDF
        </Button>
        <Button variant="secondary" onClick={handleSync} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          再同期
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={handleSync} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          同期中...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          同期再試行
        </>
      )}
    </Button>
  )
}
