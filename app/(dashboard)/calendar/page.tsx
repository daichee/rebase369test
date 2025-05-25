"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useBookingStore } from "@/store/booking-store"
import { useRoomStore } from "@/store/room-store"
import Link from "next/link"

export default function CalendarPage() {
  const { bookings, customers } = useBookingStore()
  const { rooms } = useRoomStore()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"month" | "week">("month")
  const [selectedRoom, setSelectedRoom] = useState<string>("all")

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // 前月の日付を追加
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // 当月の日付を追加
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }

    // 次月の日付を追加（6週間分になるまで）
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }

    return days
  }

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return bookings.filter((booking) => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const targetDate = new Date(dateStr)

      // 部屋フィルター
      if (selectedRoom !== "all" && booking.roomId !== selectedRoom) {
        return false
      }

      return targetDate >= checkIn && targetDate < checkOut
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    return customer?.name || "不明"
  }

  const getRoomName = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    return room?.name || "不明"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"]

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">カレンダー</h1>
          <p className="text-muted-foreground">予約状況をカレンダーで確認</p>
        </div>
        <Button asChild>
          <Link href="/booking/new">
            <Plus className="mr-2 h-4 w-4" />
            新規予約
          </Link>
        </Button>
      </div>

      {/* コントロール */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold min-w-[200px] text-center">
                  {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                今日
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての部屋</SelectItem>
                  {rooms
                    .filter((room) => room.isActive)
                    .map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={viewMode} onValueChange={(value: "month" | "week") => setViewMode(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">月表示</SelectItem>
                  <SelectItem value="week">週表示</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* カレンダー */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day) => (
              <div key={day} className="p-4 text-center font-medium bg-gray-50 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayBookings = getBookingsForDate(day.date)
              const isToday = day.date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                    !day.isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
                  } ${isToday ? "bg-blue-50" : ""}`}
                >
                  <div className={`text-sm font-medium mb-2 ${isToday ? "text-blue-600" : ""}`}>
                    {day.date.getDate()}
                  </div>

                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <Link key={booking.id} href={`/booking/${booking.id}`} className="block">
                        <div
                          className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${getStatusColor(booking.status)}`}
                        >
                          <div className="font-medium">{getCustomerName(booking.customerId)}</div>
                          <div className="opacity-75">{getRoomName(booking.roomId)}</div>
                        </div>
                      </Link>
                    ))}

                    {dayBookings.length > 3 && (
                      <div className="text-xs text-gray-500 p-1">+{dayBookings.length - 3}件</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 凡例 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>凡例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm">確定</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-sm">保留中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-sm">キャンセル</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm">完了</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
