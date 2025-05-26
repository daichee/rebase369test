"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ChevronLeft, ChevronRight, Plus, Eye } from "lucide-react"
import { useRooms } from "@/lib/hooks/use-rooms"
import { useAvailability } from "@/lib/hooks/use-availability"
import { useRealtimeBookings } from "@/lib/hooks/use-realtime-bookings"

interface BookingCalendarProps {
  onCreateBooking?: (date: string, roomId?: string) => void
  onViewBooking?: (bookingId: string) => void
}

export function BookingCalendar({ onCreateBooking, onViewBooking }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [floorFilter, setFloorFilter] = useState<"all" | "2F" | "3F">("all")
  const [occupancyStats, setOccupancyStats] = useState<any>(null)

  const { rooms, loading: roomsLoading } = useRooms()
  const { getOccupancyStats } = useAvailability()
  const { isConnected } = useRealtimeBookings()

  // 月の最初と最後の日を取得
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  useEffect(() => {
    loadOccupancyStats()
  }, [currentDate])

  const loadOccupancyStats = async () => {
    try {
      const stats = await getOccupancyStats({
        startDate: monthStart.toISOString().split("T")[0],
        endDate: monthEnd.toISOString().split("T")[0],
        nights: Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)),
      })
      setOccupancyStats(stats)
    } catch (error) {
      console.error("稼働率の取得に失敗:", error)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const getFilteredRooms = () => {
    if (floorFilter === "all") return rooms
    return rooms.filter((room) => room.floor === floorFilter)
  }

  const generateCalendarDates = () => {
    const dates: Date[] = []
    const start = new Date(monthStart)
    const end = new Date(monthEnd)

    // 月の最初の週の日曜日から開始
    start.setDate(start.getDate() - start.getDay())

    // 月の最後の週の土曜日まで
    end.setDate(end.getDate() + (6 - end.getDay()))

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }

    return dates
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
    })
  }

  const getDayOfWeek = (dayIndex: number) => {
    const days = ["日", "月", "火", "水", "木", "金", "土"]
    return days[dayIndex]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const getBookingForDateAndRoom = (date: Date, roomId: string) => {
    // 実装: その日その部屋の予約を取得
    // useRealtimeBookingsから予約データを取得してマッチング
    return null // プレースホルダー
  }

  const filteredRooms = getFilteredRooms()
  const calendarDates = generateCalendarDates()

  if (roomsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">カレンダーを読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                予約台帳カレンダー
              </CardTitle>
              <CardDescription>
                13部屋の予約状況を一覧で確認できます
                {!isConnected && (
                  <Badge variant="destructive" className="ml-2">
                    オフライン
                  </Badge>
                )}
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <Select value={floorFilter} onValueChange={(value: "all" | "2F" | "3F") => setFloorFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全フロア</SelectItem>
                  <SelectItem value="2F">2F (5室)</SelectItem>
                  <SelectItem value="3F">3F (8室)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={() => onCreateBooking?.(new Date().toISOString().split("T")[0])}>
                <Plus className="h-4 w-4 mr-2" />
                新規予約
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 稼働率サマリー */}
      {occupancyStats && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{occupancyStats.occupiedRooms}</div>
                <div className="text-sm text-muted-foreground">予約部屋数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {occupancyStats.occupancyRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">部屋稼働率</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{occupancyStats.occupiedCapacity}</div>
                <div className="text-sm text-muted-foreground">予約者数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {occupancyStats.guestOccupancyRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">収容率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* カレンダーグリッド */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{formatDate(currentDate)}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* ヘッダー行: 曜日 */}
              <div className="grid grid-cols-[200px_repeat(7,_120px)] border-b">
                <div className="p-3 bg-muted font-medium">部屋</div>
                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                  <div key={dayIndex} className="p-3 bg-muted text-center font-medium">
                    {getDayOfWeek(dayIndex)}
                  </div>
                ))}
              </div>

              {/* 週ごとの日付ヘッダー */}
              {Array.from({ length: calendarDates.length / 7 }, (_, weekIndex) => {
                const weekDates = calendarDates.slice(weekIndex * 7, (weekIndex + 1) * 7)
                
                return (
                  <div key={weekIndex}>
                    {/* 日付行 */}
                    <div className="grid grid-cols-[200px_repeat(7,_120px)] border-b bg-muted/50">
                      <div className="p-2"></div>
                      {weekDates.map((date, dateIndex) => (
                        <div 
                          key={dateIndex} 
                          className={`p-2 text-center text-sm ${
                            isToday(date) ? "bg-primary text-primary-foreground" :
                            !isCurrentMonth(date) ? "text-muted-foreground" : ""
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      ))}
                    </div>

                    {/* 各部屋の予約状況行 */}
                    {filteredRooms.map((room) => (
                      <div key={room.roomId} className="grid grid-cols-[200px_repeat(7,_120px)] border-b hover:bg-muted/30">
                        <div className="p-3 border-r">
                          <div className="font-medium">{room.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {room.roomId} • {room.capacity}名
                          </div>
                        </div>

                        {weekDates.map((date, dateIndex) => {
                          const booking = getBookingForDateAndRoom(date, room.roomId)
                          const dateString = date.toISOString().split("T")[0]

                          return (
                            <div 
                              key={dateIndex}
                              className={`p-1 border-r min-h-[60px] cursor-pointer hover:bg-muted/50 ${
                                !isCurrentMonth(date) ? "bg-muted/20" : ""
                              }`}
                              onClick={() => onCreateBooking?.(dateString, room.roomId)}
                            >
                              {booking ? (
                                <div 
                                  className="bg-blue-100 border border-blue-300 rounded p-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onViewBooking?.(booking.id)
                                  }}
                                >
                                  <div className="font-medium truncate">{booking.guestName}</div>
                                  <div className="text-muted-foreground">{booking.guestCount}名</div>
                                </div>
                              ) : (
                                <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <Plus className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 凡例 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>予約済み</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>空室</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span>今日</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">クリックで新規予約作成</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}