import type { GuestCount, DateRange, PriceBreakdown, DailyPrice, RoomUsage, AddonItem, RateInfo } from "./types"

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

  // 基本料金（大部屋・中部屋利用時）
  private static readonly BASE_RATES_SHARED = {
    adult: 4800,
    student: 4000,
    child: 3200,
    infant: 2500,
    baby: 0,
  } as const

  // 基本料金（個室利用時）
  private static readonly BASE_RATES_PRIVATE = {
    adult: 8500,
    adult_leader: 6800, // 合宿付添
    student: 5900,
    child: 5000,
    infant: 4200,
    baby: 0,
  } as const

  // 曜日係数
  private static readonly DAY_MULTIPLIERS = {
    weekday: 1.0,
    weekend: 1.22, // 22%割増
  } as const

  // シーズン係数
  private static readonly SEASON_MULTIPLIERS = {
    regular: 1.0,
    peak: 1.15, // 15%割増
  } as const

  // 繁忙期月（3,4,5,7,8,9,12月）
  private static readonly PEAK_MONTHS = [3, 4, 5, 7, 8, 9, 12]

  /**
   * 総合料金計算
   */
  static calculateTotalPrice(
    rooms: RoomUsage[],
    guests: GuestCount,
    dateRange: DateRange,
    addons: AddonItem[] = [],
  ): PriceBreakdown {
    const roomAmount = this.calculateRoomPrice(rooms, dateRange.nights)
    const guestAmount = this.calculateGuestPrice(guests, dateRange, rooms)
    const addonAmount = this.calculateAddonPrice(addons, dateRange, guests)
    const dailyBreakdown = this.calculateDailyBreakdown(rooms, guests, dateRange, addons)

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
   * 個人料金計算（年齢区分×曜日×シーズン）
   */
  static calculateGuestPrice(guests: GuestCount, dateRange: DateRange, rooms: RoomUsage[]): number {
    const usageType = this.determineUsageType(rooms)
    const baseRates = usageType === "private" ? this.BASE_RATES_PRIVATE : this.BASE_RATES_SHARED

    let total = 0
    const dates = this.generateDateRange(dateRange)

    for (const date of dates) {
      const dayType = this.getDayType(date)
      const season = this.getSeason(date)

      const dayMultiplier = this.DAY_MULTIPLIERS[dayType]
      const seasonMultiplier = this.SEASON_MULTIPLIERS[season]

      Object.entries(guests).forEach(([ageGroup, count]) => {
        if (count > 0 && ageGroup in baseRates) {
          const baseRate = baseRates[ageGroup as keyof typeof baseRates] || 0
          const dailyRate = baseRate * dayMultiplier * seasonMultiplier
          total += dailyRate * count
        }
      })
    }

    return Math.round(total)
  }

  /**
   * オプション料金計算
   */
  static calculateAddonPrice(addons: AddonItem[], dateRange: DateRange, guests: GuestCount): number {
    let total = 0

    addons.forEach((addon) => {
      switch (addon.category) {
        case "meal":
          total += this.calculateMealPrice(addon, dateRange, guests)
          break
        case "facility":
          total += this.calculateFacilityPrice(addon, dateRange, guests)
          break
        case "equipment":
          total += this.calculateEquipmentPrice(addon, dateRange)
          break
      }
    })

    return Math.round(total)
  }

  /**
   * 食事料金計算（年齢区分別）
   */
  private static calculateMealPrice(addon: AddonItem, dateRange: DateRange, guests: GuestCount): number {
    if (!addon.ageBreakdown) return 0

    const mealRates = {
      breakfast: { adult: 700, student: 700, child: 700, infant: 700 },
      dinner: { adult: 1500, student: 1000, child: 800, infant: 800 },
      bbq: { adult: 3000, student: 2200, child: 1500, infant: 1500 },
    }

    const rates =
      addon.addonId === "breakfast"
        ? mealRates.breakfast
        : addon.addonId === "dinner"
          ? mealRates.dinner
          : addon.addonId === "bbq"
            ? mealRates.bbq
            : { adult: 0, student: 0, child: 0, infant: 0 }

    let total = 0
    Object.entries(addon.ageBreakdown).forEach(([ageGroup, quantity]) => {
      if (quantity > 0 && ageGroup in rates) {
        const rate = rates[ageGroup as keyof typeof rates]
        total += rate * quantity
      }
    })

    return total
  }

  /**
   * 施設利用料金計算（個人料金＋室料＋エアコン代）
   */
  private static calculateFacilityPrice(addon: AddonItem, dateRange: DateRange, guests: GuestCount): number {
    if (!addon.facilityUsage) return 0

    const { hours, guestType } = addon.facilityUsage
    const totalGuests = Object.values(guests).reduce((sum, count) => sum + count, 0)

    // 個人料金
    let personalFee = 0
    if (hours < 5) {
      personalFee = 200
    } else if (hours <= 10) {
      personalFee = 400
    } else {
      personalFee = 600
    }

    // 室料（平日/休日、宿泊者/宿泊者以外）
    const dates = this.generateDateRange(dateRange)
    let roomFee = 0

    dates.forEach((date) => {
      const dayType = this.getDayType(date)
      const isWeekend = dayType === "weekend"

      if (addon.addonId === "meeting_room") {
        roomFee += isWeekend ? (guestType === "guest" ? 1500 : 2000) : guestType === "guest" ? 1000 : 1500
      } else if (addon.addonId === "gymnasium") {
        roomFee += isWeekend ? (guestType === "guest" ? 2500 : 4500) : guestType === "guest" ? 2000 : 3500
      }
    })

    // エアコン代
    const airconFee = addon.addonId === "meeting_room" ? 500 * hours : 1500 * hours

    return personalFee * totalGuests + roomFee * hours + airconFee
  }

  /**
   * 備品料金計算（固定料金）
   */
  private static calculateEquipmentPrice(addon: AddonItem, dateRange: DateRange): number {
    return addon.unitPrice * addon.quantity * dateRange.nights
  }

  /**
   * 日別料金明細計算
   */
  static calculateDailyBreakdown(
    rooms: RoomUsage[],
    guests: GuestCount,
    dateRange: DateRange,
    addons: AddonItem[],
  ): DailyPrice[] {
    const dates = this.generateDateRange(dateRange)
    const usageType = this.determineUsageType(rooms)
    const baseRates = usageType === "private" ? this.BASE_RATES_PRIVATE : this.BASE_RATES_SHARED

    return dates.map((date) => {
      const dayType = this.getDayType(date)
      const season = this.getSeason(date)

      // 室料（日割り）
      const roomAmount = this.calculateRoomPrice(rooms, 1)

      // 個人料金（その日の分）
      const dayMultiplier = this.DAY_MULTIPLIERS[dayType]
      const seasonMultiplier = this.SEASON_MULTIPLIERS[season]

      let guestAmount = 0
      Object.entries(guests).forEach(([ageGroup, count]) => {
        if (count > 0 && ageGroup in baseRates) {
          const baseRate = baseRates[ageGroup as keyof typeof baseRates] || 0
          const dailyRate = baseRate * dayMultiplier * seasonMultiplier
          guestAmount += dailyRate * count
        }
      })

      // オプション料金（日割り）
      const addonAmount = this.calculateAddonPrice(addons, { ...dateRange, nights: 1 }, guests)

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
   * 料金詳細情報取得（デバッグ用）
   */
  static getPriceDetails(guests: GuestCount, dateRange: DateRange, rooms: RoomUsage[]): { [date: string]: RateInfo[] } {
    const usageType = this.determineUsageType(rooms)
    const baseRates = usageType === "private" ? this.BASE_RATES_PRIVATE : this.BASE_RATES_SHARED
    const dates = this.generateDateRange(dateRange)
    const details: { [date: string]: RateInfo[] } = {}

    dates.forEach((date) => {
      const dayType = this.getDayType(date)
      const season = this.getSeason(date)
      const dayMultiplier = this.DAY_MULTIPLIERS[dayType]
      const seasonMultiplier = this.SEASON_MULTIPLIERS[season]
      const dateStr = date.toISOString().split("T")[0]

      details[dateStr] = Object.entries(guests)
        .map(([ageGroup, count]) => {
          const basePrice = baseRates[ageGroup as keyof typeof baseRates] || 0
          const finalPrice = basePrice * dayMultiplier * seasonMultiplier

          return {
            ageGroup: ageGroup as keyof GuestCount,
            basePrice,
            dayMultiplier,
            seasonMultiplier,
            finalPrice: Math.round(finalPrice),
          }
        })
        .filter((info) => info.basePrice > 0)
    })

    return details
  }
}
