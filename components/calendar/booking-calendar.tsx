"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [floorFilter, setFloorFilter] = useState<"all" | "2F" | "3F">("all")
  const [occupancyStats, setOccupancyStats] = useState<any>(null)
  const [floorOccupancyStats, setFloorOccupancyStats] = useState<{ [floor: string]: any }>({})

  const { rooms, loading: roomsLoading } = useRooms()
  const { getOccupancyStats } = useAvailability()
  const { isConnected } = useRealtimeBookings()

  // 表示期間の計算
  const getViewDateRange = () => {
    const today = new Date(currentDate)
    
    switch (viewMode) {
      case "day":
        return {
          start: new Date(today),
          end: new Date(today)
        }
      case "week":
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay()) // 日曜日から開始
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return { start: weekStart, end: weekEnd }
      case "month":
      default:
        return {
          start: new Date(today.getFullYear(), today.getMonth(), 1),
          end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
        }
    }
  }

  const { start: viewStart, end: viewEnd } = getViewDateRange()

  useEffect(() => {
    loadOccupancyStats()
    loadFloorOccupancyStats()
  }, [currentDate, viewMode])

  const loadOccupancyStats = async () => {
    try {
      const stats = await getOccupancyStats({
        startDate: viewStart.toISOString().split("T")[0],
        endDate: viewEnd.toISOString().split("T")[0],
        nights: Math.ceil((viewEnd.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24)),
      })
      setOccupancyStats(stats)
    } catch (error) {
      console.error("稼働率の取得に失敗:", error)
    }
  }

  const loadFloorOccupancyStats = async () => {
    try {
      const floors = ["2F", "3F"]
      const floorStats: { [floor: string]: any } = {}
      
      for (const floor of floors) {
        const floorRooms = rooms.filter(r => r.floor === floor)
        if (floorRooms.length > 0) {
          // フロア別の稼働率を計算（簡略版）
          const totalCapacity = floorRooms.reduce((sum, room) => sum + room.capacity, 0)
          const roomCount = floorRooms.length
          
          floorStats[floor] = {
            totalRooms: roomCount,
            totalCapacity,
            occupancyRate: Math.random() * 80, // プレースホルダー - 実際はDBから計算
            guestOccupancyRate: Math.random() * 70, // プレースホルダー - 実際はDBから計算
          }
        }
      }
      
      setFloorOccupancyStats(floorStats)
    } catch (error) {
      console.error("フロア別稼働率の取得に失敗:", error)
    }
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    
    switch (viewMode) {
      case "day":
        if (direction === "prev") {
          newDate.setDate(newDate.getDate() - 1)
        } else {
          newDate.setDate(newDate.getDate() + 1)
        }
        break
      case "week":
        if (direction === "prev") {
          newDate.setDate(newDate.getDate() - 7)
        } else {
          newDate.setDate(newDate.getDate() + 7)
        }
        break
      case "month":
      default:
        if (direction === "prev") {
          newDate.setMonth(newDate.getMonth() - 1)
        } else {
          newDate.setMonth(newDate.getMonth() + 1)
        }
        break
    }
    
    setCurrentDate(newDate)
  }

  const getFilteredRooms = () => {
    if (floorFilter === "all") return rooms
    return rooms.filter((room) => room.floor === floorFilter)
  }

  const generateCalendarDates = () => {
    const dates: Date[] = []
    
    switch (viewMode) {
      case "day":
        dates.push(new Date(currentDate))
        break
      case "week":
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart)
          date.setDate(weekStart.getDate() + i)
          dates.push(date)
        }
        break
      case "month":
      default:
        const start = new Date(viewStart)
        const end = new Date(viewEnd)
        
        // 月の最初の週の日曜日から開始
        start.setDate(start.getDate() - start.getDay())
        
        // 月の最後の週の土曜日まで
        end.setDate(end.getDate() + (6 - end.getDay()))
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d))
        }
        break
    }
    
    return dates
  }

  const formatDate = (date: Date) => {
    switch (viewMode) {
      case "day":
        return date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })
      case "week":
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${weekStart.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}`
      case "month":
      default:
        return date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
        })
    }
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
    
    // モックデータ - 実際はuseRealtimeBookingsから取得
    const mockBookings = [
      {
        id: "1",
        roomId: "R201",
        startDate: "2025-05-27",
        endDate: "2025-05-29",
        guestName: "田中様",
        guestCount: 3,
        status: "confirmed" as const
      },
      {
        id: "2", 
        roomId: "R205",
        startDate: "2025-05-28",
        endDate: "2025-05-30",
        guestName: "佐藤様",
        guestCount: 15,
        status: "confirmed" as const
      },
      {
        id: "3",
        roomId: "R301",
        startDate: "2025-05-26",
        endDate: "2025-05-28",
        guestName: "高橋様",
        guestCount: 4,
        status: "pending" as const
      }
    ]
    
    const dateString = date.toISOString().split("T")[0]
    const booking = mockBookings.find(b => 
      b.roomId === roomId && 
      b.startDate <= dateString && 
      b.endDate > dateString
    )
    
    return booking || null
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
              {/* 表示モード切替 */}
              <Tabs value={viewMode} onValueChange={(value: "month" | "week" | "day") => setViewMode(value)}>
                <TabsList>
                  <TabsTrigger value="month">月次</TabsTrigger>
                  <TabsTrigger value="week">週次</TabsTrigger>
                  <TabsTrigger value="day">日次</TabsTrigger>
                </TabsList>
              </Tabs>

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
                <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
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
            <div className="space-y-4">
              {/* 全体稼働率 */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{occupancyStats.occupiedRooms}</div>
                  <div className="text-sm text-muted-foreground">予約部屋数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {occupancyStats.occupancyRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">全体稼働率</div>
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

              {/* フロア別稼働率 */}
              {Object.keys(floorOccupancyStats).length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">フロア別稼働率</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(floorOccupancyStats).map(([floor, stats]) => (
                      <div key={floor} className="text-center space-y-2">
                        <div className="text-lg font-bold">{floor}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="font-medium text-blue-600">
                              {stats.occupancyRate.toFixed(1)}%
                            </div>
                            <div className="text-muted-foreground">部屋稼働率</div>
                          </div>
                          <div>
                            <div className="font-medium text-green-600">
                              {stats.guestOccupancyRate.toFixed(1)}%
                            </div>
                            <div className="text-muted-foreground">収容率</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                                  className={`border rounded p-1 text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                                    booking.status === "confirmed" 
                                      ? "bg-blue-100 border-blue-300 text-blue-800" 
                                      : booking.status === "pending"
                                      ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                                      : "bg-gray-100 border-gray-300 text-gray-800"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onViewBooking?.(booking.id)
                                  }}
                                  title={`${booking.guestName} - ${booking.guestCount}名 (${booking.status})`}
                                >
                                  <div className="font-medium truncate">{booking.guestName}</div>
                                  <div className="flex items-center justify-between">
                                    <span>{booking.guestCount}名</span>
                                    <Badge 
                                      variant={booking.status === "confirmed" ? "default" : "secondary"}
                                      className="text-xs px-1 py-0"
                                    >
                                      {booking.status === "confirmed" ? "確定" : 
                                       booking.status === "pending" ? "仮予約" : "キャンセル"}
                                    </Badge>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group">
                                  <div className="flex flex-col items-center text-muted-foreground">
                                    <Plus className="h-4 w-4" />
                                    <span className="text-xs mt-1 group-hover:block hidden">空室</span>
                                  </div>
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
          <div className="space-y-3">
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                <span>確定予約</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>仮予約</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                <span>キャンセル</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded flex items-center justify-center">
                  <Plus className="h-2 w-2 text-green-600" />
                </div>
                <span>空室</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary rounded"></div>
                <span>今日</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground border-t pt-3">
              <span>💡 空室をクリックして新規予約を作成、予約ブロックをクリックして詳細を確認できます</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}