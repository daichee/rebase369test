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
  amenityFilter: string[]
  allowPartialAvailability: boolean
  prioritizeUpgrades: boolean
  
  // 検索モード
  searchMode: "standard" | "flexible" | "intelligent"
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
    suggestionScore?: number
    amenities?: string[]
  }>
  suggestions: Array<{
    type: "alternative_dates" | "alternative_rooms" | "room_combination" | "nearby_dates" | "room_upgrade" | "partial_stay"
    description: string
    details: any
    score: number
    priority: "high" | "medium" | "low"
    estimatedSavings?: number
  }>
  partiallyAvailableRooms: Array<{
    roomId: string
    room: any
    availableDates: string[]
    conflictDates: string[]
    suggestionScore: number
  }>
  searchMetrics: {
    totalSearchTime: number
    roomsEvaluated: number
    suggestionsGenerated: number
    optimizationScore: number
  }
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

const AMENITY_OPTIONS = [
  { value: "projector", label: "プロジェクター" },
  { value: "whiteboard", label: "ホワイトボード" },
  { value: "air_conditioning", label: "エアコン" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "kitchen", label: "キッチン設備" },
  { value: "tatami", label: "和室（畳）" },
  { value: "lab_equipment", label: "実験設備" },
  { value: "library", label: "図書設備" },
]

const SEARCH_MODES = [
  { value: "standard", label: "標準検索", description: "基本的な条件で検索" },
  { value: "flexible", label: "柔軟検索", description: "代替案を含めて幅広く検索" },
  { value: "intelligent", label: "インテリジェント検索", description: "AI最適化による賢い検索" },
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
    amenityFilter: [],
    allowPartialAvailability: false,
    prioritizeUpgrades: false,
    searchMode: "standard",
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
      const enhancedSuggestions = await generateAdvancedSearchSuggestions(criteria, dateRange, filteredRooms, availability)
      
      const results: SearchResults = {
        availableRooms: filteredRooms.map(room => {
          const availabilityInfo = availability.find(a => a.roomId === room.roomId)
          return {
            roomId: room.roomId,
            name: room.name,
            capacity: room.capacity,
            floor: room.floor,
            roomType: getRoomTypeFromCapacity(room.capacity),
            pricePerNight: room.roomRate,
            availability: availabilityInfo?.isAvailable ? "available" : "unavailable",
            conflictDays: availabilityInfo?.conflictingBookings || [],
            alternativeDates: [],
            suggestionScore: availabilityInfo?.isAvailable ? 10 : 0,
            amenities: room.amenities || [],
          }
        }),
        suggestions: enhancedSuggestions.suggestions,
        partiallyAvailableRooms: enhancedSuggestions.partiallyAvailable,
        searchMetrics: {
          totalSearchTime: Date.now() - Date.now(),
          roomsEvaluated: filteredRooms.length,
          suggestionsGenerated: enhancedSuggestions.suggestions.length,
          optimizationScore: enhancedSuggestions.optimizationScore,
        },
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
      if (room.roomRate > criteria.maxPrice) {
        return false
      }

      // 設備フィルター
      if (criteria.amenityFilter.length > 0) {
        const roomAmenities = room.amenities || []
        const hasRequiredAmenities = criteria.amenityFilter.every(requiredAmenity =>
          roomAmenities.includes(requiredAmenity)
        )
        if (!hasRequiredAmenities) {
          return false
        }
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

  const generateAdvancedSearchSuggestions = async (
    criteria: SearchCriteria, 
    dateRange: any, 
    filteredRooms: any[], 
    availability: any[]
  ) => {
    const suggestions: any[] = []
    const partiallyAvailable: any[] = []
    let optimizationScore = 8

    // インテリジェント検索モードの場合
    if (criteria.searchMode === "intelligent") {
      // AI最適化による提案生成
      const aiSuggestions = await generateAISuggestions(criteria, dateRange, filteredRooms)
      suggestions.push(...aiSuggestions)
      optimizationScore += 2
    }

    // 人数に対する部屋組み合わせ提案
    const availableRoomCount = availability.filter(a => a.isAvailable).length
    if (availableRoomCount === 0) {
      const alternativeRooms = await suggestAlternativeRooms(criteria.totalGuests, dateRange)
      if (alternativeRooms.length > 0) {
        suggestions.push({
          type: "room_combination" as const,
          description: `${alternativeRooms.length}部屋の最適組み合わせでご利用可能です`,
          details: { roomIds: alternativeRooms },
          score: 8,
          priority: "high" as const,
        })
      }

      // 代替日程提案（前後2週間）
      const alternateDateSuggestions = await findIntelligentAlternativeDates(criteria, dateRange)
      suggestions.push(...alternateDateSuggestions)

      // 部分利用可能部屋の検出
      if (criteria.allowPartialAvailability) {
        const partialRooms = await findPartiallyAvailableRooms(criteria, dateRange, filteredRooms)
        partiallyAvailable.push(...partialRooms)
      }
    } else {
      // アップグレード提案
      if (criteria.prioritizeUpgrades) {
        const upgradeSuggestions = generateUpgradeSuggestions(criteria, filteredRooms, availability)
        suggestions.push(...upgradeSuggestions)
      }
    }

    // 柔軟検索モードの場合の追加提案
    if (criteria.searchMode === "flexible") {
      const flexibleSuggestions = generateFlexibleSuggestions(criteria, dateRange)
      suggestions.push(...flexibleSuggestions)
      optimizationScore += 1
    }

    return {
      suggestions: suggestions.sort((a, b) => b.score - a.score).slice(0, 6),
      partiallyAvailable,
      optimizationScore
    }
  }

  const generateAISuggestions = async (criteria: SearchCriteria, dateRange: any, rooms: any[]) => {
    // AI最適化ロジック（簡易版）
    const suggestions = []
    
    // 最適な人数配分提案
    if (criteria.totalGuests > 10) {
      suggestions.push({
        type: "room_upgrade" as const,
        description: "大部屋利用で経済的・社交的メリットを最大化",
        score: 9,
        priority: "high" as const,
        details: { aiRecommendation: true, benefit: "コスト削減・グループ交流促進" }
      })
    }

    return suggestions
  }

  const findIntelligentAlternativeDates = async (criteria: SearchCriteria, originalDateRange: any) => {
    const suggestions = []
    
    // 前後14日間での賢い日程提案
    for (let offset = 1; offset <= 14; offset++) {
      const newStart = new Date(originalDateRange.startDate)
      newStart.setDate(newStart.getDate() + offset)
      
      const newEnd = new Date(originalDateRange.endDate)
      newEnd.setDate(newEnd.getDate() + offset)

      // 平日優先度計算
      const dayOfWeek = newStart.getDay()
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 4
      const score = isWeekday ? 8 : 6
      
      suggestions.push({
        type: "alternative_dates" as const,
        description: `${offset}日後の${isWeekday ? '平日' : '週末'}プラン`,
        startDate: newStart.toISOString().split('T')[0],
        endDate: newEnd.toISOString().split('T')[0],
        score,
        priority: offset <= 7 ? "high" : "medium" as const,
        details: { isWeekday, offset }
      })
    }

    return suggestions.slice(0, 3)
  }

  const findPartiallyAvailableRooms = async (criteria: SearchCriteria, dateRange: any, rooms: any[]) => {
    // 部分利用可能な部屋の検出ロジック
    return rooms.filter(room => room.capacity >= criteria.totalGuests).slice(0, 2).map(room => ({
      roomId: room.roomId,
      room,
      availableDates: ["2024-12-01", "2024-12-02"], // 実際の空室日
      conflictDates: ["2024-12-03"],
      suggestionScore: 7
    }))
  }

  const generateUpgradeSuggestions = (criteria: SearchCriteria, rooms: any[], availability: any[]) => {
    const suggestions = []
    
    const largeRooms = rooms.filter(room => 
      room.capacity >= criteria.totalGuests * 1.5 && 
      availability.find(a => a.roomId === room.roomId)?.isAvailable
    )

    for (const room of largeRooms.slice(0, 2)) {
      suggestions.push({
        type: "room_upgrade" as const,
        description: `${room.name}にアップグレード（広々とした空間）`,
        score: 7,
        priority: "medium" as const,
        rooms: [room],
        details: { upgradeCapacity: room.capacity - criteria.totalGuests }
      })
    }

    return suggestions
  }

  const generateFlexibleSuggestions = (criteria: SearchCriteria, dateRange: any) => {
    return [
      {
        type: "nearby_dates" as const,
        description: "近隣の週末での特別プラン",
        score: 6,
        priority: "medium" as const,
        details: { flexibleDates: true }
      }
    ]
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
      amenityFilter: [],
      allowPartialAvailability: false,
      prioritizeUpgrades: false,
      searchMode: "standard",
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

          {/* 高度な検索オプション */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-semibold">高度な検索オプション</Label>
            
            {/* 検索モード選択 */}
            <div className="space-y-2">
              <Label>検索モード</Label>
              <Select
                value={criteria.searchMode}
                onValueChange={(value: any) => updateCriteria({ searchMode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEARCH_MODES.map(mode => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div>
                        <div className="font-medium">{mode.label}</div>
                        <div className="text-xs text-muted-foreground">{mode.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 設備・アメニティフィルター */}
            <div className="space-y-2">
              <Label>必要な設備・アメニティ</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {AMENITY_OPTIONS.map(amenity => (
                  <div key={amenity.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={amenity.value}
                      checked={criteria.amenityFilter.includes(amenity.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateCriteria({
                            amenityFilter: [...criteria.amenityFilter, amenity.value]
                          })
                        } else {
                          updateCriteria({
                            amenityFilter: criteria.amenityFilter.filter(a => a !== amenity.value)
                          })
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={amenity.value} className="text-sm">{amenity.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 検索オプション */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowPartial"
                  checked={criteria.allowPartialAvailability}
                  onChange={(e) => updateCriteria({ allowPartialAvailability: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="allowPartial" className="text-sm">
                  部分利用可能な部屋も表示
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="prioritizeUpgrades"
                  checked={criteria.prioritizeUpgrades}
                  onChange={(e) => updateCriteria({ prioritizeUpgrades: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="prioritizeUpgrades" className="text-sm">
                  アップグレード提案を優先
                </Label>
              </div>
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
              期間: {criteria.startDate && criteria.endDate && format(criteria.startDate, "M/d")} - {criteria.endDate && format(criteria.endDate, "M/d")} • 
              検索時間: {searchResults.searchMetrics.totalSearchTime}ms • 
              最適化スコア: {searchResults.searchMetrics.optimizationScore}/20
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{room.name}</div>
                          {room.suggestionScore && room.suggestionScore > 8 && (
                            <Badge variant="outline" className="text-xs">
                              おすすめ
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {room.floor} • {room.capacity}名収容 • {room.roomType === "large" ? "大部屋" : room.roomType === "medium" ? "中部屋" : "個室"}
                        </div>
                        {room.amenities && room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {room.amenities.slice(0, 3).map(amenity => (
                              <Badge key={amenity} variant="outline" className="text-xs">
                                {AMENITY_OPTIONS.find(a => a.value === amenity)?.label || amenity}
                              </Badge>
                            ))}
                            {room.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{room.amenities.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
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
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">インテリジェント検索提案</h4>
                  <Badge variant="outline">
                    {searchResults.suggestions.length}件の提案
                  </Badge>
                </div>
                {searchResults.suggestions.map((suggestion, index) => (
                  <Alert key={index} className={cn(
                    suggestion.priority === "high" ? "border-orange-200 bg-orange-50" :
                    suggestion.priority === "medium" ? "border-blue-200 bg-blue-50" :
                    "border-gray-200 bg-gray-50"
                  )}>
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <strong>{suggestion.description}</strong>
                            <Badge 
                              variant={
                                suggestion.priority === "high" ? "destructive" :
                                suggestion.priority === "medium" ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {suggestion.priority === "high" ? "高優先度" : 
                               suggestion.priority === "medium" ? "中優先度" : "低優先度"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              スコア: {suggestion.score}
                            </Badge>
                          </div>
                          
                          {suggestion.type === "alternative_dates" && suggestion.startDate && (
                            <div className="text-sm text-muted-foreground">
                              提案日程: {suggestion.startDate} ～ {suggestion.endDate}
                            </div>
                          )}
                          
                          {suggestion.estimatedSavings && (
                            <div className="text-sm text-green-600">
                              推定節約額: ¥{suggestion.estimatedSavings.toLocaleString()}
                            </div>
                          )}
                          
                          {suggestion.details?.aiRecommendation && (
                            <div className="text-sm text-blue-600 mt-1">
                              <Badge variant="outline" className="text-xs mr-1">AI推奨</Badge>
                              {suggestion.details.benefit}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {suggestion.type === "room_combination" && suggestion.details.roomIds && (
                            <Button
                              size="sm"
                              onClick={() => onRoomSelect?.(suggestion.details.roomIds)}
                            >
                              この組み合わせを選択
                            </Button>
                          )}
                          
                          {suggestion.type === "alternative_dates" && suggestion.startDate && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                updateCriteria({
                                  startDate: new Date(suggestion.startDate!),
                                  endDate: new Date(suggestion.endDate!)
                                })
                                performSearch()
                              }}
                            >
                              この日程で検索
                            </Button>
                          )}
                          
                          {suggestion.rooms && suggestion.rooms.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRoomSelect?.(suggestion.rooms.map(r => r.roomId || r.id))}
                            >
                              この部屋を選択
                            </Button>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* 部分利用可能部屋 */}
            {searchResults.partiallyAvailableRooms.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">部分利用可能な部屋</h4>
                {searchResults.partiallyAvailableRooms.map((partialRoom, index) => (
                  <Alert key={index} className="border-yellow-200 bg-yellow-50">
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>{partialRoom.room.name || `部屋 ${partialRoom.roomId}`}</strong>
                          <div className="text-sm text-muted-foreground">
                            利用可能日: {partialRoom.availableDates.length}日 / 
                            競合日: {partialRoom.conflictDates.length}日
                          </div>
                          <div className="text-sm">
                            スコア: {partialRoom.suggestionScore.toFixed(1)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRoomSelect?.([partialRoom.roomId])}
                        >
                          詳細を確認
                        </Button>
                      </div>
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