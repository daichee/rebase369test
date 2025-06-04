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
import { useBookingStore } from "@/store/booking-store"

interface BookingCalendarProps {
  onCreateBooking?: (date: string, roomId?: string) => void
  onViewBooking?: (bookingId: string) => void
}

export function BookingCalendar({ onCreateBooking, onViewBooking }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [floorFilter, setFloorFilter] = useState<"all" | "2F" | "3F">("all")
  const [occupancyStats, setOccupancyStats] = useState<any>(null)
  const [fallbackProjects, setFallbackProjects] = useState<any[]>([])
  const [isLoadingFallback, setIsLoadingFallback] = useState(false)

  const { rooms, loading: roomsLoading } = useRooms()
  const { getOccupancyStats } = useAvailability()
  const { isConnected } = useRealtimeBookings()
  const { projects, setProjects } = useBookingStore()

  // 月の最初と最後の日を取得
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  useEffect(() => {
    loadOccupancyStats()
  }, [currentDate])

  // リアルタイム接続が失敗した場合のフォールバック
  useEffect(() => {
    console.log(`Calendar: Connection status - isConnected: ${isConnected}, projects.length: ${projects.length}, isLoadingFallback: ${isLoadingFallback}`)
    
    // Give realtime connection some time to establish before falling back
    const timeoutId = setTimeout(() => {
      if (projects.length === 0 && !isLoadingFallback) {
        console.log('Calendar: No projects found after timeout, attempting API fallback...')
        fetchProjectsFromAPI()
      }
    }, 2000) // 2 second delay
    
    // Clear timeout if we get projects
    if (projects.length > 0) {
      clearTimeout(timeoutId)
    }
    
    return () => clearTimeout(timeoutId)
  }, [isConnected, projects.length, isLoadingFallback])

  const fetchProjectsFromAPI = async () => {
    try {
      setIsLoadingFallback(true)
      console.log('Calendar: Fetching projects from API fallback...')
      
      const response = await fetch('/api/booking')
      if (!response.ok) {
        throw new Error('予約データの取得に失敗しました')
      }
      
      const result = await response.json()
      const apiProjects = result.data || []
      
      console.log(`Calendar: API returned ${apiProjects.length} projects:`, apiProjects)
      
      // APIから取得したデータをストアに保存
      setProjects(apiProjects)
      setFallbackProjects(apiProjects)
      
      console.log('Calendar: Projects saved to store')
    } catch (error) {
      console.error('Calendar: 予約データの取得に失敗:', error)
    } finally {
      setIsLoadingFallback(false)
    }
  }

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
    if (!projects || projects.length === 0) {
      console.log("Calendar: No projects data available")
      return null
    }
    
    console.log(`Calendar: Checking ${projects.length} projects for date ${date.toISOString().split("T")[0]} and room ${roomId}`)
    
    const targetDateString = date.toISOString().split("T")[0]
    
    // その日その部屋に該当するプロジェクトを検索
    const matchingProject = projects.find(project => {
      if (!project.start_date || !project.end_date) return false
      
      const startDate = new Date(project.start_date).toISOString().split("T")[0]
      const endDate = new Date(project.end_date).toISOString().split("T")[0]
      
      // 日付範囲をチェック
      const isInDateRange = targetDateString >= startDate && targetDateString <= endDate
      
      // 部屋割り当てをチェック
      const hasRoomAssignment = project.project_rooms?.some(pr => pr.rooms?.roomId === roomId)
      
      return isInDateRange && hasRoomAssignment
    })
    
    if (!matchingProject) return null
    
    // カレンダー表示用のフォーマットに変換
    return {
      id: matchingProject.id,
      guestName: matchingProject.guest_name || "ゲスト",
      guestCount: matchingProject.pax_total || 0,
      organization: matchingProject.guest_org || "",
      status: matchingProject.status || "draft"
    }
  }

  const filteredRooms = getFilteredRooms()
  const calendarDates = generateCalendarDates()

  if (roomsLoading || isLoadingFallback) {
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
                {rooms.length}部屋の予約状況を一覧で確認できます
                {!isConnected && (
                  <Badge variant="secondary" className="ml-2">
                    {fallbackProjects.length > 0 ? "フォールバック" : "オフライン"}
                  </Badge>
                )}
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Select value={floorFilter} onValueChange={(value: "all" | "2F" | "3F") => setFloorFilter(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全フロア</SelectItem>
                  <SelectItem value="2F">2F (5室)</SelectItem>
                  <SelectItem value="3F">3F (8室)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">前月</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                    <span className="hidden sm:inline mr-1">次月</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Button onClick={() => onCreateBooking?.(new Date().toISOString().split("T")[0])} className="flex-shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">新規予約</span>
                  <span className="sm:hidden">予約</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 稼働率サマリー */}
      {occupancyStats && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
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
              <div className="grid grid-cols-[120px_repeat(7,_minmax(80px,1fr))] md:grid-cols-[200px_repeat(7,_120px)] border-b">
                <div className="p-2 md:p-3 bg-muted font-medium text-xs md:text-sm">部屋</div>
                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                  <div key={dayIndex} className="p-2 md:p-3 bg-muted text-center font-medium text-xs md:text-sm">
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
                    <div className="grid grid-cols-[120px_repeat(7,_minmax(80px,1fr))] md:grid-cols-[200px_repeat(7,_120px)] border-b bg-muted/50">
                      <div className="p-1 md:p-2"></div>
                      {weekDates.map((date, dateIndex) => (
                        <div 
                          key={dateIndex} 
                          className={`p-1 md:p-2 text-center text-xs md:text-sm ${
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
                      <div key={room.roomId} className="grid grid-cols-[120px_repeat(7,_minmax(80px,1fr))] md:grid-cols-[200px_repeat(7,_120px)] border-b hover:bg-muted/30">
                        <div className="p-2 md:p-3 border-r">
                          <div className="font-medium text-xs md:text-sm truncate">{room.name}</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="hidden md:inline">{room.roomId} • </span>{room.capacity}名
                          </div>
                        </div>

                        {weekDates.map((date, dateIndex) => {
                          const booking = getBookingForDateAndRoom(date, room.roomId)
                          const dateString = date.toISOString().split("T")[0]

                          return (
                            <div 
                              key={dateIndex}
                              className={`p-1 border-r min-h-[50px] md:min-h-[60px] cursor-pointer hover:bg-muted/50 ${
                                !isCurrentMonth(date) ? "bg-muted/20" : ""
                              }`}
                              onClick={() => onCreateBooking?.(dateString, room.roomId)}
                            >
                              {booking ? (
                                <div 
                                  className={`border rounded p-1 text-xs cursor-pointer hover:opacity-80 ${
                                    booking.status === "confirmed" ? "bg-blue-100 border-blue-300" :
                                    booking.status === "draft" ? "bg-yellow-100 border-yellow-300" :
                                    booking.status === "cancelled" ? "bg-red-100 border-red-300" :
                                    "bg-gray-100 border-gray-300"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onViewBooking?.(booking.id)
                                  }}
                                  title={`${booking.guestName} (${booking.organization}) - ${booking.guestCount}名`}
                                >
                                  <div className="font-medium truncate">{booking.guestName}</div>
                                  <div className="text-muted-foreground truncate text-xs">{booking.organization}</div>
                                  <div className="text-muted-foreground text-xs">{booking.guestCount}名</div>
                                </div>
                              ) : (
                                <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <Plus className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
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
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>確定済み</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>下書き</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>キャンセル</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span>今日</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">空室をクリックで新規予約作成</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}