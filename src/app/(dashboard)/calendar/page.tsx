"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, ChevronLeft, ChevronRight, Grid3X3, List } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays } from "date-fns"
import { ja } from "date-fns/locale"

// Mock data for demonstration
const MOCK_BOOKINGS = [
  {
    id: "1",
    roomId: "2f-saho",
    startDate: new Date(2024, 0, 15),
    endDate: new Date(2024, 0, 17),
    guestName: "山田太郎",
    status: "confirmed" as const,
  },
  {
    id: "2",
    roomId: "3f-hifuku",
    startDate: new Date(2024, 0, 20),
    endDate: new Date(2024, 0, 22),
    guestName: "鈴木一郎",
    status: "confirmed" as const,
  },
]

const ROOMS = [
  { roomId: "2f-saho", name: "2F作法室" },
  { roomId: "3f-hifuku", name: "3F被服室" },
  { roomId: "3f-shichoukaku", name: "3F視聴覚室" },
  { roomId: "3f-tosho", name: "3F図書室" },
  { roomId: "2f-1nen1kumi", name: "2F 1年1組" },
]

function CalendarView({ viewMode, currentDate }: { viewMode: string; currentDate: Date }) {
  if (viewMode === "month") {
    return <MonthView currentDate={currentDate} />
  } else if (viewMode === "week") {
    return <WeekView currentDate={currentDate} />
  } else {
    return <DayView currentDate={currentDate} />
  }
}

function MonthView({ currentDate }: { currentDate: Date }) {
  const startDate = startOfMonth(currentDate)
  const endDate = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const firstDayOfWeek = startDate.getDay()
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const calendarDays = [...Array(paddingDays).fill(null), ...days]

  const getBookingsForDate = (date: Date) => {
    const bookings: Array<{ roomName: string; guestName: string; status: string }> = []

    ROOMS.forEach((room) => {
      MOCK_BOOKINGS.filter((b) => b.roomId === room.roomId).forEach((booking) => {
        if (date >= booking.startDate && date < booking.endDate) {
          bookings.push({
            roomName: room.name,
            guestName: booking.guestName,
            status: booking.status,
          })
        }
      })
    })

    return bookings
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1">
        {["月", "火", "水", "木", "金", "土", "日"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-24" />
          }

          const bookings = getBookingsForDate(day)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = isSameMonth(day, currentDate)

          return (
            <Card
              key={day.toISOString()}
              className={`h-24 ${isToday ? "border-primary" : ""} ${!isCurrentMonth ? "opacity-50" : ""}`}
            >
              <CardContent className="p-2 h-full">
                <div className="flex flex-col h-full">
                  <div className={`text-sm ${isToday ? "font-bold text-primary" : ""}`}>{format(day, "d")}</div>
                  <div className="flex-1 overflow-hidden">
                    {bookings.slice(0, 2).map((booking, idx) => (
                      <div key={idx} className="text-xs p-1 mb-1 rounded bg-primary/10 text-primary truncate">
                        {booking.guestName}
                      </div>
                    ))}
                    {bookings.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{bookings.length - 2}件</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ currentDate }: { currentDate: Date }) {
  const startOfWeek = new Date(currentDate)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-8 gap-1">
        <div className="p-2 text-sm font-medium">部屋</div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-2 text-center">
            <div className="text-sm font-medium">{format(day, "M/d")}</div>
            <div className="text-xs text-muted-foreground">{format(day, "E", { locale: ja })}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {ROOMS.map((room) => (
          <div key={room.roomId} className="grid grid-cols-8 gap-1">
            <div className="p-2 text-sm font-medium bg-muted rounded">{room.name}</div>
            {weekDays.map((day) => {
              const booking = MOCK_BOOKINGS.find(
                (b) => b.roomId === room.roomId && day >= b.startDate && day < b.endDate,
              )

              return (
                <div key={day.toISOString()} className="h-12 border rounded">
                  {booking && (
                    <div className="h-full p-1 bg-primary/10 rounded flex items-center">
                      <div className="text-xs truncate">
                        <div className="font-medium">{booking.guestName}</div>
                        <Badge variant="outline" className="text-xs">
                          {booking.status === "confirmed" ? "確定" : "下書き"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function DayView({ currentDate }: { currentDate: Date }) {
  const dayBookings = ROOMS.map((room) => ({
    ...room,
    bookings: MOCK_BOOKINGS.filter(
      (booking) => booking.roomId === room.roomId && currentDate >= booking.startDate && currentDate < booking.endDate,
    ),
  })).filter((room) => room.bookings.length > 0)

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">{format(currentDate, "yyyy年MM月dd日 (E)", { locale: ja })}</h3>
      </div>

      {dayBookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">この日の予約はありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dayBookings.map((room) => (
            <Card key={room.roomId}>
              <CardHeader>
                <CardTitle className="text-base">{room.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {room.bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{booking.guestName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(booking.startDate, "M/d")} ～ {format(booking.endDate, "M/d")}
                        </p>
                      </div>
                      <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                        {booking.status === "confirmed" ? "確定" : "下書き"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [currentDate, setCurrentDate] = useState(new Date())

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long" })
  }

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">予約カレンダー</h1>
          <p className="text-muted-foreground">部屋の稼働状況と予約を確認</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            今日
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="w-36 text-center font-medium">{formatMonthYear(currentDate)}</div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week" | "day")}>
            <TabsList>
              <TabsTrigger value="month">
                <CalendarDays className="h-4 w-4 mr-1" />月
              </TabsTrigger>
              <TabsTrigger value="week">
                <Grid3X3 className="h-4 w-4 mr-1" />週
              </TabsTrigger>
              <TabsTrigger value="day">
                <List className="h-4 w-4 mr-1" />日
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>部屋稼働状況</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarView viewMode={viewMode} currentDate={currentDate} />
        </CardContent>
      </Card>
    </div>
  )
}
