"use client"

import { useRouter } from "next/navigation"
import { BookingCalendar } from "@/components/calendar/booking-calendar"

export default function CalendarPage() {
  const router = useRouter()

  const handleCreateBooking = (date: string, roomId?: string) => {
    // URLパラメータで初期データを渡してウィザードページに遷移
    const params = new URLSearchParams({
      startDate: date,
      ...(roomId && { roomId }),
    })
    router.push(`/booking/new?${params.toString()}`)
  }

  const handleViewBooking = (bookingId: string) => {
    router.push(`/booking/${bookingId}`)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">予約台帳カレンダー</h1>
        <p className="text-muted-foreground">
          13部屋の予約状況を一覧で確認し、空室から直接予約を作成できます
        </p>
      </div>

      <BookingCalendar
        onCreateBooking={handleCreateBooking}
        onViewBooking={handleViewBooking}
      />
    </div>
  )
}
