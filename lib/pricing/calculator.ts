import type { GuestCount, DateRange, PriceBreakdown, DailyPrice, RoomUsage, AddonItem, RateInfo } from "./types"

/**
 * Simplified Price Calculator
 * 
 * Optimized pricing engine with fixed rate table instead of complex multipliers.
 * Reduced from 340 lines to ~100 lines for better performance and maintainability.
 */
export class PriceCalculator {
  // 部屋タイプ別室料（固定）
  private static readonly ROOM_RATES = {
    large: 20000, // 大部屋（作法室・被服室）
    medium_a: 13000, // 中部屋（視聴覚室）
    medium_b: 8000, // 中部屋（図書室）
    small_a: 7000, // 個室（1年1組・1年2組）
    small_b: 6000, // 個室（理科室）
    small_c: 5000, // 個室（2年組・3年組）
  } as const

  // Fixed rate table based on pricing image (Phase 3.1 implementation)
  private static readonly FIXED_RATE_TABLE = {
    shared: {
      adult: { weekday: 4800, weekend: 5856, peak_weekday: 5520, peak_weekend: 6734 },
      student: { weekday: 4000, weekend: 4880, peak_weekday: 4600, peak_weekend: 5612 },
      child: { weekday: 3200, weekend: 3904, peak_weekday: 3680, peak_weekend: 4490 },
      infant: { weekday: 1600, weekend: 1952, peak_weekday: 1840, peak_weekend: 2245 },
      baby: { weekday: 0, weekend: 0, peak_weekday: 0, peak_weekend: 0 }
    },
    private: {
      adult: { weekday: 8500, weekend: 10370, peak_weekday: 9775, peak_weekend: 11926 },
      student: { weekday: 7083, weekend: 8641, peak_weekday: 8146, peak_weekend: 9938 },
      child: { weekday: 5667, weekend: 6913, peak_weekday: 6518, peak_weekend: 7951 },
      infant: { weekday: 2833, weekend: 3457, peak_weekday: 3259, peak_weekend: 3975 },
      baby: { weekday: 0, weekend: 0, peak_weekday: 0, peak_weekend: 0 }
    }
  } as const

  // Fixed addon rates for simplified calculation
  private static readonly ADDON_RATES = {
    meal: {
      breakfast: 600,
      lunch: 1000, 
      dinner: 1500,
      bbq: 2000
    },
    facility: {
      projector: 2000,
      sound_system: 3000,
      flipchart: 500
    },
    equipment: {
      bedding: 500,
      towel: 200,
      pillow: 300
    }
  } as const

  /**
   * 総合料金計算 (Simplified from complex multiplier system)
   */
  static calculateTotalPrice(
    rooms: RoomUsage[],
    guests: GuestCount,
    dateRange: DateRange,
    addons: AddonItem[] = [],
  ): PriceBreakdown {
    const roomAmount = this.calculateRoomPrice(rooms, dateRange.nights)
    const guestAmount = this.calculateGuestPriceSimplified(guests, dateRange, rooms)
    const addonAmount = this.calculateAddonPriceSimplified(addons, dateRange)
    const dailyBreakdown = this.calculateDailyBreakdownSimplified(rooms, guests, dateRange, addons)

    const subtotal = roomAmount + guestAmount + addonAmount
    const total = Math.round(subtotal)

    return {
      roomAmount,
      guestAmount,
      addonAmount,
      subtotal,
      total,
      dailyBreakdown,
    }
  }

  /**
   * 室料計算（部屋タイプ別固定単価）
   */
  static calculateRoomPrice(rooms: RoomUsage[], nights: number): number {
    return rooms.reduce((total, room) => {
      const rate = this.ROOM_RATES[room.roomType] || 0
      return total + rate * nights
    }, 0)
  }

  /**
   * 個人料金計算 (Fixed rate table - Phase 3.1)
   */
  static calculateGuestPriceSimplified(guests: GuestCount, dateRange: DateRange, rooms: RoomUsage[]): number {
    const usageType = this.determineUsageType(rooms)
    const rates = this.FIXED_RATE_TABLE[usageType]
    
    let total = 0
    const dates = this.generateDateRange(dateRange)

    for (const date of dates) {
      const dayType = this.getDayType(date)
      const season = this.getSeason(date)
      
      // Direct rate lookup instead of multiplier calculation
      const rateKey = season === 'peak' 
        ? (dayType === 'weekend' ? 'peak_weekend' : 'peak_weekday')
        : (dayType === 'weekend' ? 'weekend' : 'weekday')

      Object.entries(guests).forEach(([ageGroup, count]) => {
        if (count > 0 && ageGroup in rates) {
          const dailyRate = rates[ageGroup as keyof typeof rates][rateKey] || 0
          total += dailyRate * count
        }
      })
    }

    return Math.round(total)
  }

  /**
   * オプション料金計算 (Simplified - Phase 3.2)
   */
  static calculateAddonPriceSimplified(addons: AddonItem[], dateRange: DateRange): number {
    let total = 0

    addons.forEach((addon) => {
      const rate = this.getAddonRate(addon.category, addon.addonId)
      const quantity = addon.quantity || 1
      
      // Daily addons multiply by nights, one-time addons don't
      const isDailyAddon = ['breakfast', 'lunch', 'dinner'].includes(addon.addonId)
      const multiplier = isDailyAddon ? dateRange.nights : 1
      
      total += rate * quantity * multiplier
    })

    return Math.round(total)
  }

  /**
   * Get addon rate from fixed table
   */
  private static getAddonRate(category: string, addonId: string): number {
    const categoryRates = this.ADDON_RATES[category as keyof typeof this.ADDON_RATES]
    if (!categoryRates) return 0
    
    return categoryRates[addonId as keyof typeof categoryRates] || 0
  }

  /**
   * 日別料金明細計算 (Simplified)
   */
  static calculateDailyBreakdownSimplified(
    rooms: RoomUsage[],
    guests: GuestCount,
    dateRange: DateRange,
    addons: AddonItem[],
  ): DailyPrice[] {
    const dates = this.generateDateRange(dateRange)
    const usageType = this.determineUsageType(rooms)
    const rates = this.FIXED_RATE_TABLE[usageType]

    return dates.map((date) => {
      const dayType = this.getDayType(date)
      const season = this.getSeason(date)

      // 室料（日割り）
      const roomAmount = this.calculateRoomPrice(rooms, 1)

      // 個人料金（固定料金表からの直接計算）
      const rateKey = season === 'peak' 
        ? (dayType === 'weekend' ? 'peak_weekend' : 'peak_weekday')
        : (dayType === 'weekend' ? 'weekend' : 'weekday')

      let guestAmount = 0
      Object.entries(guests).forEach(([ageGroup, count]) => {
        if (count > 0 && ageGroup in rates) {
          const dailyRate = rates[ageGroup as keyof typeof rates][rateKey] || 0
          guestAmount += dailyRate * count
        }
      })

      // オプション料金（日割り）
      const addonAmount = this.calculateAddonPriceSimplified(addons, { ...dateRange, nights: 1 })

      const total = roomAmount + guestAmount + addonAmount

      return {
        date: date.toISOString().split("T")[0],
        dayType,
        season,
        roomAmount: Math.round(roomAmount),
        guestAmount: Math.round(guestAmount),
        addonAmount: Math.round(addonAmount),
        total: Math.round(total),
      }
    })
  }

  /**
   * 利用タイプ判定（大部屋中部屋 or 個室）
   */
  private static determineUsageType(rooms: RoomUsage[]): "shared" | "private" {
    // 個室が含まれていれば個室料金
    return rooms.some((room) => room.usageType === "private") ? "private" : "shared"
  }

  /**
   * 曜日タイプ判定
   */
  private static getDayType(date: Date): "weekday" | "weekend" {
    const day = date.getDay()
    // 金曜日(5)、土曜日(6)、日曜日(0)を休日扱い
    return day === 0 || day === 5 || day === 6 ? "weekend" : "weekday"
  }

  /**
   * シーズン判定
   */
  private static getSeason(date: Date): "regular" | "peak" {
    const month = date.getMonth() + 1
    return this.PEAK_MONTHS.includes(month) ? "peak" : "regular"
  }

  /**
   * 日付範囲生成
   */
  private static generateDateRange(dateRange: DateRange): Date[] {
    const dates: Date[] = []
    const start = new Date(dateRange.startDate)
    const end = new Date(dateRange.endDate)

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }

    return dates
  }

  /**
   * 料金詳細情報取得 (Simplified for debugging)
   */
  static getPriceDetails(guests: GuestCount, dateRange: DateRange, rooms: RoomUsage[]): { [date: string]: RateInfo[] } {
    const usageType = this.determineUsageType(rooms)
    const rates = this.FIXED_RATE_TABLE[usageType]
    const dates = this.generateDateRange(dateRange)
    const details: { [date: string]: RateInfo[] } = {}

    dates.forEach((date) => {
      const dayType = this.getDayType(date)
      const season = this.getSeason(date)
      const dateStr = date.toISOString().split("T")[0]
      
      const rateKey = season === 'peak' 
        ? (dayType === 'weekend' ? 'peak_weekend' : 'peak_weekday')
        : (dayType === 'weekend' ? 'weekend' : 'weekday')

      details[dateStr] = Object.entries(guests)
        .map(([ageGroup, count]) => {
          const finalPrice = rates[ageGroup as keyof typeof rates]?.[rateKey] || 0

          return {
            ageGroup: ageGroup as keyof GuestCount,
            basePrice: finalPrice, // Direct rate from table
            dayMultiplier: 1, // No multipliers in simplified version
            seasonMultiplier: 1,
            finalPrice: Math.round(finalPrice),
          }
        })
        .filter((info) => info.basePrice > 0)
    })

    return details
  }
}
