import type { Booking } from "@/store/booking-store"
import type { Room } from "@/store/room-store"

export interface AvailabilityRequest {
  startDate: string
  endDate: string
  guestCount: number
  excludeBookingId?: string
}

export interface AvailabilityResult {
  isAvailable: boolean
  availableRooms: Room[]
  conflictingBookings: Booking[]
  suggestions: AvailabilitySuggestion[]
  occupancyRate: number
  partiallyAvailableRooms: PartialAvailabilityInfo[]
  searchMetrics: SearchMetrics
}

export interface PartialAvailabilityInfo {
  roomId: string
  room: Room
  availableDates: string[]
  conflictDates: string[]
  suggestionScore: number
}

export interface SearchMetrics {
  totalSearchTime: number
  roomsEvaluated: number
  suggestionsGenerated: number
  optimizationScore: number
}

export interface AvailabilitySuggestion {
  type: "alternative_dates" | "alternative_rooms" | "split_booking" | "nearby_dates" | "room_upgrade" | "partial_stay"
  description: string
  startDate?: string
  endDate?: string
  rooms?: Room[]
  details?: any
  score: number
  estimatedSavings?: number
  priority: "high" | "medium" | "low"
}

export interface ConflictInfo {
  roomId: string
  conflictingBookings: Booking[]
  overlapDays: string[]
}

export class AvailabilityChecker {
  /**
   * 空室状況チェック
   */
  static checkAvailability(request: AvailabilityRequest, rooms: Room[], bookings: Booking[]): AvailabilityResult {
    const startTime = Date.now()
    const { startDate, endDate, guestCount, excludeBookingId } = request

    // 除外する予約をフィルタリング
    const activeBookings = bookings.filter(
      (booking) => booking.id !== excludeBookingId && booking.status !== "cancelled",
    )

    // 期間中の競合予約を取得
    const conflictingBookings = this.getConflictingBookings(startDate, endDate, activeBookings)

    // 利用可能な部屋を取得
    const availableRooms = this.getAvailableRooms(startDate, endDate, guestCount, rooms, conflictingBookings)

    // 部分的に利用可能な部屋を取得
    const partiallyAvailableRooms = this.getPartiallyAvailableRooms(startDate, endDate, guestCount, rooms, activeBookings)

    // 稼働率計算
    const occupancyRate = this.calculateOccupancyRate(startDate, endDate, rooms, activeBookings)

    // 代替案生成
    const suggestions = this.generateAdvancedSuggestions(request, rooms, activeBookings, availableRooms, partiallyAvailableRooms)

    // 検索メトリクス計算
    const searchMetrics: SearchMetrics = {
      totalSearchTime: Date.now() - startTime,
      roomsEvaluated: rooms.length,
      suggestionsGenerated: suggestions.length,
      optimizationScore: this.calculateOptimizationScore(availableRooms, suggestions)
    }

    return {
      isAvailable: availableRooms.length > 0,
      availableRooms,
      conflictingBookings,
      suggestions,
      occupancyRate,
      partiallyAvailableRooms,
      searchMetrics,
    }
  }

  /**
   * ダブルブッキング検証
   */
  static validateBooking(
    booking: Partial<Booking>,
    existingBookings: Booking[],
  ): { isValid: boolean; conflicts: ConflictInfo[]; errors: string[] } {
    const errors: string[] = []
    const conflicts: ConflictInfo[] = []

    if (!booking.checkIn || !booking.checkOut || !booking.roomId) {
      errors.push("必須項目が不足しています")
      return { isValid: false, conflicts, errors }
    }

    // 日付検証
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)

    if (checkIn >= checkOut) {
      errors.push("チェックアウト日はチェックイン日より後である必要があります")
    }

    if (checkIn < new Date()) {
      errors.push("過去の日付は予約できません")
    }

    // 重複チェック
    const conflictingBookings = existingBookings.filter(
      (existingBooking) =>
        existingBooking.id !== booking.id &&
        existingBooking.roomId === booking.roomId &&
        existingBooking.status !== "cancelled" &&
        this.isDateOverlap(booking.checkIn!, booking.checkOut!, existingBooking.checkIn, existingBooking.checkOut),
    )

    if (conflictingBookings.length > 0) {
      const overlapDays = this.getOverlapDays(
        booking.checkIn!,
        booking.checkOut!,
        conflictingBookings[0].checkIn,
        conflictingBookings[0].checkOut,
      )

      conflicts.push({
        roomId: booking.roomId,
        conflictingBookings,
        overlapDays,
      })

      errors.push(`部屋 ${booking.roomId} で予約の重複があります`)
    }

    return {
      isValid: errors.length === 0,
      conflicts,
      errors,
    }
  }

  /**
   * 競合予約取得
   */
  private static getConflictingBookings(startDate: string, endDate: string, bookings: Booking[]): Booking[] {
    return bookings.filter((booking) => this.isDateOverlap(startDate, endDate, booking.checkIn, booking.checkOut))
  }

  /**
   * 利用可能部屋取得
   */
  private static getAvailableRooms(
    startDate: string,
    endDate: string,
    guestCount: number,
    rooms: Room[],
    conflictingBookings: Booking[],
  ): Room[] {
    const occupiedRoomIds = new Set(conflictingBookings.map((booking) => booking.roomId))

    return rooms.filter((room) => room.isActive && room.capacity >= guestCount && !occupiedRoomIds.has(room.roomId))
  }

  /**
   * 稼働率計算
   */
  private static calculateOccupancyRate(
    startDate: string,
    endDate: string,
    rooms: Room[],
    bookings: Booking[],
  ): number {
    const totalRooms = rooms.filter((room) => room.isActive).length
    const nights = this.calculateNights(startDate, endDate)
    const totalRoomNights = totalRooms * nights

    if (totalRoomNights === 0) return 0

    const occupiedRoomNights = bookings.reduce((total, booking) => {
      if (this.isDateOverlap(startDate, endDate, booking.checkIn, booking.checkOut)) {
        const overlapNights = this.getOverlapNights(startDate, endDate, booking.checkIn, booking.checkOut)
        return total + overlapNights
      }
      return total
    }, 0)

    return Math.round((occupiedRoomNights / totalRoomNights) * 100)
  }

  /**
   * 代替案生成
   */
  private static generateSuggestions(
    request: AvailabilityRequest,
    rooms: Room[],
    bookings: Booking[],
    availableRooms: Room[],
  ): AvailabilitySuggestion[] {
    const suggestions: AvailabilitySuggestion[] = []

    // 利用可能な部屋がない場合の代替案
    if (availableRooms.length === 0) {
      // 前後の日程での空室提案
      const alternateDates = this.findAlternateDates(request, rooms, bookings)
      suggestions.push(...alternateDates)

      // 部屋を分割する提案
      const splitSuggestion = this.findSplitRoomSuggestion(request, rooms, bookings)
      if (splitSuggestion) {
        suggestions.push(splitSuggestion)
      }
    }

    // 定員に余裕がある部屋の提案
    const capacitySuggestions = this.findCapacitySuggestions(request, availableRooms)
    suggestions.push(...capacitySuggestions)

    return suggestions.slice(0, 5) // 最大5件
  }

  /**
   * 代替日程検索
   */
  private static findAlternateDates(
    request: AvailabilityRequest,
    rooms: Room[],
    bookings: Booking[],
  ): AvailabilitySuggestion[] {
    const suggestions: AvailabilitySuggestion[] = []
    const nights = this.calculateNights(request.startDate, request.endDate)

    // 前後7日間で検索
    for (let offset = 1; offset <= 7; offset++) {
      // 前の日程
      const earlierStart = this.addDays(request.startDate, -offset)
      const earlierEnd = this.addDays(request.endDate, -offset)

      const earlierAvailability = this.checkAvailability(
        { ...request, startDate: earlierStart, endDate: earlierEnd },
        rooms,
        bookings,
      )

      if (earlierAvailability.isAvailable) {
        suggestions.push({
          type: "alternative_dates",
          description: `${offset}日前倒し: ${earlierStart} ～ ${earlierEnd}`,
          startDate: earlierStart,
          endDate: earlierEnd,
        })
      }

      // 後の日程
      const laterStart = this.addDays(request.startDate, offset)
      const laterEnd = this.addDays(request.endDate, offset)

      const laterAvailability = this.checkAvailability(
        { ...request, startDate: laterStart, endDate: laterEnd },
        rooms,
        bookings,
      )

      if (laterAvailability.isAvailable) {
        suggestions.push({
          type: "alternative_dates",
          description: `${offset}日後倒し: ${laterStart} ～ ${laterEnd}`,
          startDate: laterStart,
          endDate: laterEnd,
        })
      }
    }

    return suggestions
  }

  /**
   * 部屋分割提案
   */
  private static findSplitRoomSuggestion(
    request: AvailabilityRequest,
    rooms: Room[],
    bookings: Booking[],
  ): AvailabilitySuggestion | null {
    const availableRooms = this.getAvailableRooms(
      request.startDate,
      request.endDate,
      1, // 最小定員で検索
      rooms,
      this.getConflictingBookings(request.startDate, request.endDate, bookings),
    )

    // 複数の小部屋で定員を満たせるかチェック
    const totalCapacity = availableRooms.reduce((sum, room) => sum + room.capacity, 0)

    if (totalCapacity >= request.guestCount && availableRooms.length >= 2) {
      return {
        type: "split_booking",
        description: `${availableRooms.length}部屋に分割して宿泊`,
        rooms: availableRooms,
        details: {
          totalCapacity,
          roomCount: availableRooms.length,
        },
      }
    }

    return null
  }

  /**
   * 定員余裕提案
   */
  private static findCapacitySuggestions(
    request: AvailabilityRequest,
    availableRooms: Room[],
  ): AvailabilitySuggestion[] {
    return availableRooms
      .filter((room) => room.capacity > request.guestCount * 1.2) // 20%以上の余裕
      .map((room) => {
        const efficiency = request.guestCount / room.capacity
        const score = efficiency > 0.8 ? 7 : efficiency > 0.6 ? 5 : 3
        
        return {
          type: "alternative_rooms" as const,
          description: `${room.name} (定員${room.capacity}名、余裕あり)`,
          rooms: [room],
          score,
          priority: efficiency > 0.8 ? "high" : efficiency > 0.6 ? "medium" : "low" as const,
          details: {
            efficiency,
            extraCapacity: room.capacity - request.guestCount
          }
        }
      })
  }

  /**
   * 日付重複チェック
   */
  private static isDateOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(start1)
    const e1 = new Date(end1)
    const s2 = new Date(start2)
    const e2 = new Date(end2)

    return s1 < e2 && s2 < e1
  }

  /**
   * 重複日数計算
   */
  private static getOverlapNights(start1: string, end1: string, start2: string, end2: string): number {
    const s1 = new Date(start1)
    const e1 = new Date(end1)
    const s2 = new Date(start2)
    const e2 = new Date(end2)

    const overlapStart = new Date(Math.max(s1.getTime(), s2.getTime()))
    const overlapEnd = new Date(Math.min(e1.getTime(), e2.getTime()))

    if (overlapStart >= overlapEnd) return 0

    return Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * 重複日取得
   */
  private static getOverlapDays(start1: string, end1: string, start2: string, end2: string): string[] {
    const days: string[] = []
    const s1 = new Date(start1)
    const e1 = new Date(end1)
    const s2 = new Date(start2)
    const e2 = new Date(end2)

    const overlapStart = new Date(Math.max(s1.getTime(), s2.getTime()))
    const overlapEnd = new Date(Math.min(e1.getTime(), e2.getTime()))

    for (let d = new Date(overlapStart); d < overlapEnd; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().split("T")[0])
    }

    return days
  }

  /**
   * 宿泊日数計算
   */
  private static calculateNights(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * 日付加算
   */
  private static addDays(dateString: string, days: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() + days)
    return date.toISOString().split("T")[0]
  }

  /**
   * 部分的利用可能部屋の取得
   */
  private static getPartiallyAvailableRooms(
    startDate: string,
    endDate: string,
    guestCount: number,
    rooms: Room[],
    bookings: Booking[],
  ): PartialAvailabilityInfo[] {
    const result: PartialAvailabilityInfo[] = []
    const requestedDates = this.getDateRange(startDate, endDate)

    for (const room of rooms) {
      if (!room.isActive || room.capacity < guestCount) continue

      const roomBookings = bookings.filter(b => b.roomId === room.roomId)
      const occupiedDates = new Set<string>()
      
      roomBookings.forEach(booking => {
        const bookingDates = this.getDateRange(booking.checkIn, booking.checkOut)
        bookingDates.forEach(date => occupiedDates.add(date))
      })

      const availableDates = requestedDates.filter(date => !occupiedDates.has(date))
      const conflictDates = requestedDates.filter(date => occupiedDates.has(date))

      if (availableDates.length > 0 && conflictDates.length > 0) {
        const suggestionScore = (availableDates.length / requestedDates.length) * 10
        
        result.push({
          roomId: room.roomId,
          room,
          availableDates,
          conflictDates,
          suggestionScore
        })
      }
    }

    return result.sort((a, b) => b.suggestionScore - a.suggestionScore)
  }

  /**
   * 日付範囲の生成
   */
  private static getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current < end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  /**
   * 高度な代替案生成
   */
  private static generateAdvancedSuggestions(
    request: AvailabilityRequest,
    rooms: Room[],
    bookings: Booking[],
    availableRooms: Room[],
    partiallyAvailableRooms: PartialAvailabilityInfo[],
  ): AvailabilitySuggestion[] {
    const suggestions: AvailabilitySuggestion[] = []

    // 利用可能な部屋がない場合の代替案
    if (availableRooms.length === 0) {
      // 前後の日程での空室提案
      const alternateDates = this.findIntelligentAlternateDates(request, rooms, bookings)
      suggestions.push(...alternateDates)

      // 部屋を分割する提案
      const splitSuggestion = this.findOptimalRoomCombination(request, rooms, bookings)
      if (splitSuggestion) {
        suggestions.push(splitSuggestion)
      }

      // 部分宿泊提案
      const partialStaySuggestions = this.findPartialStaySuggestions(request, partiallyAvailableRooms)
      suggestions.push(...partialStaySuggestions)
    }

    // 定員に余裕がある部屋の提案
    const capacitySuggestions = this.findCapacitySuggestions(request, availableRooms)
    suggestions.push(...capacitySuggestions)

    // アップグレード提案
    const upgradeSuggestions = this.findUpgradeSuggestions(request, availableRooms)
    suggestions.push(...upgradeSuggestions)

    // スコア順でソートして上位提案を返す
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 8) // 最大8件
  }

  /**
   * インテリジェント代替日程検索
   */
  private static findIntelligentAlternateDates(
    request: AvailabilityRequest,
    rooms: Room[],
    bookings: Booking[],
  ): AvailabilitySuggestion[] {
    const suggestions: AvailabilitySuggestion[] = []
    const originalStartDate = new Date(request.startDate)

    // 前後14日間で検索（平日/週末を考慮）
    for (let offset = 1; offset <= 14; offset++) {
      // 前の日程
      const earlierStart = this.addDays(request.startDate, -offset)
      const earlierEnd = this.addDays(request.endDate, -offset)
      const earlierStartDate = new Date(earlierStart)

      const earlierAvailability = this.checkAvailability(
        { ...request, startDate: earlierStart, endDate: earlierEnd },
        rooms,
        bookings,
      )

      if (earlierAvailability.isAvailable) {
        const weekdayScore = this.calculateWeekdayScore(earlierStartDate)
        const proximityScore = Math.max(0, 10 - offset) // より近い日程を優先
        const score = weekdayScore + proximityScore

        suggestions.push({
          type: "alternative_dates",
          description: `${offset}日前倒し (${this.formatDateRange(earlierStart, earlierEnd)})`,
          startDate: earlierStart,
          endDate: earlierEnd,
          score,
          priority: offset <= 3 ? "high" : offset <= 7 ? "medium" : "low",
          details: { offset: -offset, weekdayAdvantage: weekdayScore > 5 }
        })
      }

      // 後の日程
      const laterStart = this.addDays(request.startDate, offset)
      const laterEnd = this.addDays(request.endDate, offset)
      const laterStartDate = new Date(laterStart)

      const laterAvailability = this.checkAvailability(
        { ...request, startDate: laterStart, endDate: laterEnd },
        rooms,
        bookings,
      )

      if (laterAvailability.isAvailable) {
        const weekdayScore = this.calculateWeekdayScore(laterStartDate)
        const proximityScore = Math.max(0, 10 - offset)
        const score = weekdayScore + proximityScore

        suggestions.push({
          type: "alternative_dates",
          description: `${offset}日後倒し (${this.formatDateRange(laterStart, laterEnd)})`,
          startDate: laterStart,
          endDate: laterEnd,
          score,
          priority: offset <= 3 ? "high" : offset <= 7 ? "medium" : "low",
          details: { offset, weekdayAdvantage: weekdayScore > 5 }
        })
      }
    }

    return suggestions
  }

  /**
   * 最適な部屋組み合わせ提案
   */
  private static findOptimalRoomCombination(
    request: AvailabilityRequest,
    rooms: Room[],
    bookings: Booking[],
  ): AvailabilitySuggestion | null {
    const availableRooms = this.getAvailableRooms(
      request.startDate,
      request.endDate,
      1, // 最小定員で検索
      rooms,
      this.getConflictingBookings(request.startDate, request.endDate, bookings),
    )

    if (availableRooms.length < 2) return null

    // 最適な組み合わせを動的プログラミングで計算
    const optimalCombination = this.findOptimalRoomCombinationDP(availableRooms, request.guestCount)
    
    if (optimalCombination && optimalCombination.length > 0) {
      const totalCapacity = optimalCombination.reduce((sum, room) => sum + room.capacity, 0)
      const efficiency = request.guestCount / totalCapacity
      const costScore = optimalCombination.length <= 2 ? 8 : optimalCombination.length <= 3 ? 6 : 4
      const score = efficiency * 10 + costScore

      return {
        type: "split_booking",
        description: `${optimalCombination.length}部屋の最適組み合わせ (効率: ${Math.round(efficiency * 100)}%)`,
        rooms: optimalCombination,
        score,
        priority: efficiency > 0.8 ? "high" : efficiency > 0.6 ? "medium" : "low",
        details: {
          totalCapacity,
          roomCount: optimalCombination.length,
          efficiency,
          wastedCapacity: totalCapacity - request.guestCount
        },
      }
    }

    return null
  }

  /**
   * 部分宿泊提案の生成
   */
  private static findPartialStaySuggestions(
    request: AvailabilityRequest,
    partiallyAvailableRooms: PartialAvailabilityInfo[]
  ): AvailabilitySuggestion[] {
    const suggestions: AvailabilitySuggestion[] = []

    for (const info of partiallyAvailableRooms.slice(0, 3)) {
      if (info.availableDates.length >= 2) {
        const consecutiveRanges = this.findConsecutiveDateRanges(info.availableDates)
        
        for (const range of consecutiveRanges) {
          if (range.length >= 2) {
            const score = (range.length / this.calculateNights(request.startDate, request.endDate)) * 8
            
            suggestions.push({
              type: "partial_stay",
              description: `${info.room.name}で${range.length}日間の部分宿泊`,
              startDate: range[0],
              endDate: this.addDays(range[range.length - 1], 1),
              rooms: [info.room],
              score,
              priority: range.length >= 3 ? "medium" : "low",
              details: {
                availableDays: range.length,
                totalRequestedDays: this.calculateNights(request.startDate, request.endDate),
                missedDays: info.conflictDates.length
              }
            })
          }
        }
      }
    }

    return suggestions
  }

  /**
   * アップグレード提案の生成
   */
  private static findUpgradeSuggestions(
    request: AvailabilityRequest,
    availableRooms: Room[]
  ): AvailabilitySuggestion[] {
    const suggestions: AvailabilitySuggestion[] = []
    
    // 定員に大幅な余裕がある高級部屋を提案
    const upgradeRooms = availableRooms.filter(room => 
      room.capacity >= request.guestCount * 1.5 && room.capacity >= 20
    )

    for (const room of upgradeRooms.slice(0, 2)) {
      const capacityRatio = room.capacity / request.guestCount
      const score = Math.min(8, capacityRatio * 2)
      
      suggestions.push({
        type: "room_upgrade",
        description: `${room.name}にアップグレード (定員${room.capacity}名の広々空間)`,
        rooms: [room],
        score,
        priority: capacityRatio >= 2 ? "medium" : "low",
        details: {
          extraCapacity: room.capacity - request.guestCount,
          capacityRatio,
          roomType: room.capacity >= 30 ? "premium" : "standard"
        }
      })
    }

    return suggestions
  }

  /**
   * 最適化スコア計算
   */
  private static calculateOptimizationScore(availableRooms: Room[], suggestions: AvailabilitySuggestion[]): number {
    const baseScore = availableRooms.length > 0 ? 10 : 0
    const suggestionScore = Math.min(5, suggestions.length)
    const qualityScore = suggestions.reduce((sum, s) => sum + s.score, 0) / Math.max(1, suggestions.length)
    
    return Math.round(baseScore + suggestionScore + qualityScore)
  }

  /**
   * 平日スコア計算
   */
  private static calculateWeekdayScore(date: Date): number {
    const dayOfWeek = date.getDay()
    // 月-木: 8点, 金: 6点, 土日: 4点
    if (dayOfWeek >= 1 && dayOfWeek <= 4) return 8
    if (dayOfWeek === 5) return 6
    return 4
  }

  /**
   * 日付範囲のフォーマット
   */
  private static formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
  }

  /**
   * 連続する日付範囲の検出
   */
  private static findConsecutiveDateRanges(dates: string[]): string[][] {
    if (dates.length === 0) return []
    
    const sortedDates = dates.sort()
    const ranges: string[][] = []
    let currentRange: string[] = [sortedDates[0]]

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1])
      const currDate = new Date(sortedDates[i])
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentRange.push(sortedDates[i])
      } else {
        if (currentRange.length > 0) ranges.push(currentRange)
        currentRange = [sortedDates[i]]
      }
    }

    if (currentRange.length > 0) ranges.push(currentRange)
    return ranges.filter(range => range.length >= 2)
  }

  /**
   * 動的プログラミングによる最適部屋組み合わせ
   */
  private static findOptimalRoomCombinationDP(rooms: Room[], targetCapacity: number): Room[] | null {
    const n = rooms.length
    const dp: boolean[][] = Array(n + 1).fill(null).map(() => Array(targetCapacity + 1).fill(false))
    const parent: number[][] = Array(n + 1).fill(null).map(() => Array(targetCapacity + 1).fill(-1))
    
    // 基本ケース
    for (let i = 0; i <= n; i++) {
      dp[i][0] = true
    }
    
    // DPテーブル構築
    for (let i = 1; i <= n; i++) {
      for (let capacity = 1; capacity <= targetCapacity; capacity++) {
        // 部屋を使わない場合
        dp[i][capacity] = dp[i - 1][capacity]
        
        // 部屋を使う場合
        if (rooms[i - 1].capacity <= capacity) {
          const remaining = capacity - rooms[i - 1].capacity
          if (dp[i - 1][remaining]) {
            dp[i][capacity] = true
            parent[i][capacity] = i - 1
          }
        }
      }
    }
    
    // 解の復元
    for (let capacity = targetCapacity; capacity <= targetCapacity + 10 && capacity <= targetCapacity * 1.5; capacity++) {
      if (dp[n][capacity]) {
        const result: Room[] = []
        let i = n, c = capacity
        
        while (i > 0 && c > 0) {
          if (parent[i][c] !== -1) {
            result.push(rooms[parent[i][c]])
            c -= rooms[parent[i][c]].capacity
            i--
          } else {
            i--
          }
        }
        
        return result
      }
    }
    
    return null
  }
}
