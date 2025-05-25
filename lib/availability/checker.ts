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
}

export interface AvailabilitySuggestion {
  type: "alternative_dates" | "alternative_rooms" | "split_booking"
  description: string
  startDate?: string
  endDate?: string
  rooms?: Room[]
  details?: any
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
    const { startDate, endDate, guestCount, excludeBookingId } = request

    // 除外する予約をフィルタリング
    const activeBookings = bookings.filter(
      (booking) => booking.id !== excludeBookingId && booking.status !== "cancelled",
    )

    // 期間中の競合予約を取得
    const conflictingBookings = this.getConflictingBookings(startDate, endDate, activeBookings)

    // 利用可能な部屋を取得
    const availableRooms = this.getAvailableRooms(startDate, endDate, guestCount, rooms, conflictingBookings)

    // 稼働率計算
    const occupancyRate = this.calculateOccupancyRate(startDate, endDate, rooms, activeBookings)

    // 代替案生成
    const suggestions = this.generateSuggestions(request, rooms, activeBookings, availableRooms)

    return {
      isAvailable: availableRooms.length > 0,
      availableRooms,
      conflictingBookings,
      suggestions,
      occupancyRate,
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

    return rooms.filter((room) => room.isActive && room.capacity >= guestCount && !occupiedRoomIds.has(room.id))
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
      .filter((room) => room.capacity > request.guestCount * 1.5) // 50%以上の余裕
      .map((room) => ({
        type: "alternative_rooms" as const,
        description: `${room.name} (定員${room.capacity}名、余裕あり)`,
        rooms: [room],
      }))
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
}
