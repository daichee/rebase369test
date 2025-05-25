"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { BoardProjectSelector } from "@/components/board/board-project-selector"
import { BoardSyncStatus } from "@/components/board/board-sync-status"
import { useBookingStore } from "@/store/booking-store"
import type { BoardProject } from "@/lib/board/types"

export default function BoardProjectPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const { bookings, updateBooking } = useBookingStore()
  const [booking, setBooking] = useState<any>(null)
  const [selectedProject, setSelectedProject] = useState<BoardProject | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const foundBooking = bookings.find((b) => b.id === bookingId)
    if (foundBooking) {
      setBooking(foundBooking)
      // 既に選択されているBoard案件があれば表示
      if (foundBooking.boardEstimateId) {
        // Board案件情報を取得して表示
      }
    }
  }, [bookingId, bookings])

  const handleProjectSelect = (project: BoardProject) => {
    setSelectedProject(project)
  }

  const handleSave = async () => {
    if (!selectedProject || !booking) return

    setIsSaving(true)
    try {
      // 予約にBoard案件IDを保存
      updateBooking(bookingId, {
        boardProjectId: selectedProject.id,
        boardEstimateId: `EST-${selectedProject.project_no}`,
      })

      router.push(`/booking/${bookingId}`)
    } catch (error) {
      console.error("Board案件の保存に失敗:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!booking) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p>予約が見つかりません</p>
          <Button onClick={() => router.push("/booking")} className="mt-4">
            予約一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Board案件選択</h1>
          <p className="text-muted-foreground">
            予約ID: {booking.id} - {booking.guestName || "ゲスト"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BoardProjectSelector
            bookingId={bookingId}
            onProjectSelect={handleProjectSelect}
            selectedProjectId={selectedProject?.id}
          />
        </div>

        <div className="space-y-6">
          {/* 予約サマリー */}
          <Card>
            <CardHeader>
              <CardTitle>予約サマリー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>チェックイン:</span>
                <span>{new Date(booking.checkIn).toLocaleDateString("ja-JP")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>チェックアウト:</span>
                <span>{new Date(booking.checkOut).toLocaleDateString("ja-JP")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>宿泊人数:</span>
                <span>{booking.guestCount}名</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>合計金額:</span>
                <span>¥{booking.totalAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Board同期ステータス */}
          <BoardSyncStatus
            bookingId={bookingId}
            boardProjectId={selectedProject?.id}
            onSyncComplete={(response) => {
              console.log("同期完了:", response)
            }}
          />

          {/* 保存ボタン */}
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleSave} disabled={!selectedProject || isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Board案件を保存
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
