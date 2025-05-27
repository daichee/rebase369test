"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Calendar as CalendarIcon, Users, Home, Filter, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useRooms } from "@/lib/hooks/use-rooms"
import { useAvailability } from "@/lib/hooks/use-availability"
import type { GuestCount } from "@/lib/pricing/types"

interface RoomSearchProps {
  onRoomSelect?: (roomIds: string[]) => void
  onSearchResults?: (results: SearchResults) => void
  initialData?: Partial<SearchCriteria>
}

interface SearchCriteria {
  // 期間検索
  startDate: Date | undefined
  endDate: Date | undefined
  
  // 人数検索
  totalGuests: number
  guestBreakdown: GuestCount
  
  // 部屋タイプ検索
  roomType: "all" | "large" | "medium" | "small"
  floorFilter: "all" | "2F" | "3F"
  
  // オプション条件
  minCapacity: number
  maxPrice: number
  
  // 高度な検索オプション
  preferredRooms: string[]
  excludeRooms: string[]
}

interface SearchResults {
  availableRooms: Array<{
    roomId: string
    name: string
    capacity: number
    floor: string
    roomType: string
    pricePerNight: number
    availability: "available" | "partially_available" | "unavailable"
    conflictDays: string[]
    alternativeDates?: string[]
  }>
  suggestions: Array<{
    type: "alternative_dates" | "alternative_rooms" | "room_combination"
    description: string
    details: any
  }>
  occupancyRate: number
  totalMatches: number
}

const ROOM_TYPES = [
  { value: "all", label: "すべて" },
  { value: "large", label: "大部屋（20名以上）" },
  { value: "medium", label: "中部屋（10-20名）" },
  { value: "small", label: "個室（10名以下）" },
]

const FLOOR_OPTIONS = [
  { value: "all", label: "全フロア" },
  { value: "2F", label: "2F（5室）" },
  { value: "3F", label: "3F（8室）" },
]

export function RoomSearch({ onRoomSelect, onSearchResults, initialData }: RoomSearchProps) {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    startDate: undefined,
    endDate: undefined,
    totalGuests: 1,
    guestBreakdown: { adult: 1, student: 0, child: 0, infant: 0, baby: 0 },
    roomType: "all",
    floorFilter: "all",
    minCapacity: 1,
    maxPrice: 25000,
    preferredRooms: [],
    excludeRooms: [],
    ...initialData,
  })

  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [realTimeMode, setRealTimeMode] = useState(true)

  const { rooms, loading: roomsLoading } = useRooms()
  const { checkAvailability, getOccupancyStats, suggestAlternativeRooms } = useAvailability()

  // リアルタイム検索（条件変更時に自動実行）
  useEffect(() => {
    if (realTimeMode && criteria.startDate && criteria.endDate && criteria.totalGuests > 0) {
      const timer = setTimeout(() => {
        performSearch()
      }, 500) // 500ms のデバウンス

      return () => clearTimeout(timer)
    }
  }, [criteria, realTimeMode])

  const performSearch = async () => {
    if (!criteria.startDate || !criteria.endDate) {
      return
    }

    setIsSearching(true)
    try {
      const dateRange = {
        startDate: format(criteria.startDate, "yyyy-MM-dd"),
        endDate: format(criteria.endDate, "yyyy-MM-dd"),
        nights: Math.ceil((criteria.endDate.getTime() - criteria.startDate.getTime()) / (1000 * 60 * 60 * 24)),
      }

      // フィルター済み部屋リストを取得
      const filteredRooms = getFilteredRooms()
      const roomIds = filteredRooms.map(room => room.roomId)

      // 空室チェック実行
      const availability = await checkAvailability(roomIds, dateRange)
      
      // 稼働率取得
      const occupancyStats = await getOccupancyStats(dateRange)

      // 検索結果を構築
      const results: SearchResults = {
        availableRooms: filteredRooms.map(room => {
          const availabilityInfo = availability.find(a => a.roomId === room.roomId)
          return {
            roomId: room.roomId,
            name: room.name,
            capacity: room.capacity,
            floor: room.floor,
            roomType: getRoomTypeFromCapacity(room.capacity),
            pricePerNight: room.pricePerNight,
            availability: availabilityInfo?.isAvailable ? "available" : "unavailable",
            conflictDays: availabilityInfo?.conflictingBookings || [],
            alternativeDates: [],
          }
        }),
        suggestions: await generateSearchSuggestions(criteria, dateRange),
        occupancyRate: occupancyStats.occupancyRate,
        totalMatches: availability.filter(a => a.isAvailable).length,
      }

      setSearchResults(results)
      onSearchResults?.(results)
    } catch (error) {
      console.error("検索エラー:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const getFilteredRooms = () => {
    return rooms.filter(room => {
      // フロアフィルター
      if (criteria.floorFilter !== "all" && room.floor !== criteria.floorFilter) {
        return false
      }

      // 部屋タイプフィルター
      const roomType = getRoomTypeFromCapacity(room.capacity)
      if (criteria.roomType !== "all" && roomType !== criteria.roomType) {
        return false
      }

      // 定員フィルター
      if (room.capacity < criteria.minCapacity || room.capacity < criteria.totalGuests) {
        return false
      }

      // 料金フィルター
      if (room.pricePerNight > criteria.maxPrice) {
        return false
      }

      // 除外部屋
      if (criteria.excludeRooms.includes(room.roomId)) {
        return false
      }

      return room.isActive
    })
  }

  const getRoomTypeFromCapacity = (capacity: number): string => {
    if (capacity >= 20) return "large"
    if (capacity >= 10) return "medium"
    return "small"
  }

  const generateSearchSuggestions = async (criteria: SearchCriteria, dateRange: any) => {
    const suggestions = []

    // 人数に対する部屋組み合わせ提案
    if (searchResults?.totalMatches === 0) {
      const alternativeRooms = await suggestAlternativeRooms(criteria.totalGuests, dateRange)
      if (alternativeRooms.length > 0) {
        suggestions.push({
          type: "room_combination" as const,
          description: `${alternativeRooms.length}部屋の組み合わせでご利用可能です`,
          details: { roomIds: alternativeRooms },
        })
      }

      // 代替日程提案
      suggestions.push({
        type: "alternative_dates" as const,
        description: "近隣日程での空室をご提案できます",
        details: { originalDate: dateRange },
      })
    }

    return suggestions
  }

  const updateCriteria = (updates: Partial<SearchCriteria>) => {
    setCriteria(prev => ({ ...prev, ...updates }))
  }

  const resetSearch = () => {
    setCriteria({
      startDate: undefined,
      endDate: undefined,
      totalGuests: 1,
      guestBreakdown: { adult: 1, student: 0, child: 0, infant: 0, baby: 0 },
      roomType: "all",
      floorFilter: "all",
      minCapacity: 1,
      maxPrice: 25000,
      preferredRooms: [],
      excludeRooms: [],
    })
    setSearchResults(null)
  }

  const totalGuestsFromBreakdown = useMemo(() => {
    return Object.values(criteria.guestBreakdown).reduce((sum, count) => sum + count, 0)
  }, [criteria.guestBreakdown])

  // リアルタイム人数更新
  useEffect(() => {
    updateCriteria({ totalGuests: totalGuestsFromBreakdown })
  }, [totalGuestsFromBreakdown])

  return (
    <div className="space-y-6">
      {/* 検索条件入力エリア */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            空室検索
          </CardTitle>
          <CardDescription>
            宿泊期間と人数を指定して利用可能な部屋を検索します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 期間選択 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>チェックイン日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !criteria.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {criteria.startDate ? format(criteria.startDate, "PPP", { locale: ja }) : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={criteria.startDate}
                    onSelect={(date) => updateCriteria({ startDate: date })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>チェックアウト日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !criteria.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {criteria.endDate ? format(criteria.endDate, "PPP", { locale: ja }) : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={criteria.endDate}
                    onSelect={(date) => updateCriteria({ endDate: date })}
                    disabled={(date) => date <= (criteria.startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 年齢区分別人数入力 */}
          <div className="space-y-3">
            <Label>宿泊者数（年齢区分別）</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">大人</Label>
                <Input
                  type="number"
                  min="0"
                  value={criteria.guestBreakdown.adult}
                  onChange={(e) => updateCriteria({
                    guestBreakdown: { ...criteria.guestBreakdown, adult: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">中高大学生</Label>
                <Input
                  type="number"
                  min="0"
                  value={criteria.guestBreakdown.student}
                  onChange={(e) => updateCriteria({
                    guestBreakdown: { ...criteria.guestBreakdown, student: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">小学生</Label>
                <Input
                  type="number"
                  min="0"
                  value={criteria.guestBreakdown.child}
                  onChange={(e) => updateCriteria({
                    guestBreakdown: { ...criteria.guestBreakdown, child: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">未就学児</Label>
                <Input
                  type="number"
                  min="0"
                  value={criteria.guestBreakdown.infant}
                  onChange={(e) => updateCriteria({
                    guestBreakdown: { ...criteria.guestBreakdown, infant: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">乳幼児</Label>
                <Input
                  type="number"
                  min="0"
                  value={criteria.guestBreakdown.baby}
                  onChange={(e) => updateCriteria({
                    guestBreakdown: { ...criteria.guestBreakdown, baby: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              合計: {totalGuestsFromBreakdown}名
            </div>
          </div>

          {/* フィルター */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>部屋タイプ</Label>
              <Select
                value={criteria.roomType}
                onValueChange={(value: any) => updateCriteria({ roomType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>フロア</Label>
              <Select
                value={criteria.floorFilter}
                onValueChange={(value: any) => updateCriteria({ floorFilter: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLOOR_OPTIONS.map(floor => (
                    <SelectItem key={floor.value} value={floor.value}>
                      {floor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>最小定員</Label>
              <Input
                type="number"
                min="1"
                value={criteria.minCapacity}
                onChange={(e) => updateCriteria({ minCapacity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label>最大料金（円/泊）</Label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={criteria.maxPrice}
                onChange={(e) => updateCriteria({ maxPrice: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* 検索制御 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={performSearch}
                disabled={isSearching || !criteria.startDate || !criteria.endDate}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "検索中..." : "検索"}
              </Button>

              <Button variant="outline" onClick={resetSearch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                リセット
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="realtime" className="text-sm">リアルタイム検索</Label>
              <input
                id="realtime"
                type="checkbox"
                checked={realTimeMode}
                onChange={(e) => setRealTimeMode(e.target.checked)}
                className="rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 検索結果 */}
      {searchResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>検索結果</span>
              <Badge variant="secondary">
                {searchResults.totalMatches}室が利用可能
              </Badge>
            </CardTitle>
            <CardDescription>
              稼働率: {searchResults.occupancyRate.toFixed(1)}% • 
              期間: {criteria.startDate && criteria.endDate && format(criteria.startDate, "M/d")} - {criteria.endDate && format(criteria.endDate, "M/d")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchResults.availableRooms.length === 0 ? (
              <Alert>
                <AlertDescription>
                  指定条件に一致する空室が見つかりませんでした。検索条件を調整してください。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {searchResults.availableRooms.map(room => (
                  <div
                    key={room.roomId}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-colors",
                      room.availability === "available" 
                        ? "border-green-200 hover:bg-green-50" 
                        : "border-gray-200 opacity-60"
                    )}
                    onClick={() => room.availability === "available" && onRoomSelect?.([room.roomId])}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {room.floor} • {room.capacity}名収容 • {room.roomType === "large" ? "大部屋" : room.roomType === "medium" ? "中部屋" : "個室"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">¥{room.pricePerNight.toLocaleString()}/泊</div>
                        <Badge 
                          variant={room.availability === "available" ? "success" : "destructive"}
                          className="mt-1"
                        >
                          {room.availability === "available" ? "空室" : "満室"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 提案 */}
            {searchResults.suggestions.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">おすすめの代替案</h4>
                {searchResults.suggestions.map((suggestion, index) => (
                  <Alert key={index}>
                    <AlertDescription>
                      <strong>{suggestion.description}</strong>
                      {suggestion.type === "room_combination" && suggestion.details.roomIds && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            onClick={() => onRoomSelect?.(suggestion.details.roomIds)}
                          >
                            この組み合わせを選択
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}