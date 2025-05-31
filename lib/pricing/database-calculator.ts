import { databaseService } from "@/lib/database/service"
import type { GuestCount, DateRange, PriceBreakdown, DailyPrice, RoomUsage, AddonItem } from "./types"

export class DatabasePriceCalculator {
  /**
   * 総合料金計算（データベース版）
   */
  static async calculateTotalPrice(
    rooms: RoomUsage[],
    guests: GuestCount,
    dateRange: DateRange,
    addons: AddonItem[] = [],
  ): Promise<PriceBreakdown> {
    const roomAmount = await this.calculateRoomPrice(rooms, dateRange.nights)
    const guestAmount = await this.calculateGuestPriceSimplified(guests, dateRange, rooms)
    const addonAmount = await this.calculateAddonPriceSimplified(addons, dateRange)
    const dailyBreakdown = await this.calculateDailyBreakdownSimplified(rooms, guests, dateRange, addons)

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
   * 室料計算（データベースから動的取得）
   */
  static async calculateRoomPrice(rooms: RoomUsage[], nights: number): Promise<number> {
    const allRooms = await databaseService.getAllRooms()
    const roomRatesMap = new Map(allRooms.map(room => [room.room_type, room.room_rate]))

    return rooms.reduce((total, room) => {
      const rate = roomRatesMap.get(room.roomType) || 0
      return total + rate * nights
    }, 0)
  }

  /**
   * 個人料金計算（データベースのratesテーブルから動的計算）
   */
  static async calculateGuestPrice(guests: GuestCount, dateRange: DateRange, rooms: RoomUsage[]): Promise<number> {
    const usageType = this.determineUsageType(rooms)
    const dates = this.generateDateRange(dateRange)

    let total = 0

    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0]
      const dayType = this.getDayType(date)
      const season = await databaseService.getSeasonForDate(dateStr)
      
      if (!season) continue

      // データベースから料金を取得
      const rates = await databaseService.getRates({
        seasonId: season.season_id,
        dayType,
        roomUsage: usageType,
      })

      const ratesMap = new Map(rates.map(rate => [rate.age_group, rate.base_price]))
      const seasonMultiplier = season.pax_rate_multiplier

      Object.entries(guests).forEach(([ageGroup, count]) => {
        if (count > 0) {
          const baseRate = ratesMap.get(ageGroup) || 0
          const dailyRate = baseRate * seasonMultiplier
          total += dailyRate * count
        }
      })
    }

    return Math.round(total)
  }

  /**
   * オプション料金計算（データベースのadd_onsテーブルから動的計算）
   */
  static async calculateAddonPrice(addons: AddonItem[], dateRange: DateRange, guests: GuestCount): Promise<number> {
    let total = 0

    for (const addon of addons) {
      const addonData = await databaseService.getAddOn(addon.addonId)
      if (!addonData) continue

      switch (addonData.category) {
        case "meal":
          total += this.calculateMealPriceFromDb(addon, addonData, guests)
          break
        case "facility":
          total += this.calculateFacilityPriceFromDb(addon, addonData, dateRange, guests)
          break
        case "equipment":
          total += this.calculateEquipmentPriceFromDb(addon, addonData, dateRange)
          break
      }
    }

    return Math.round(total)
  }

  /**
   * 食事料金計算（データベース版）
   */
  private static calculateMealPriceFromDb(addon: AddonItem, addonData: any, guests: GuestCount): number {
    if (!addon.ageBreakdown) return 0

    let total = 0
    Object.entries(addon.ageBreakdown).forEach(([ageGroup, quantity]) => {
      if (quantity > 0) {
        let rate = 0
        switch (ageGroup) {
          case "adult":
            rate = addonData.adult_fee
            break
          case "student":
            rate = addonData.student_fee
            break
          case "child":
            rate = addonData.child_fee
            break
          case "infant":
            rate = addonData.infant_fee
            break
        }
        total += rate * quantity
      }
    })

    return total
  }

  /**
   * 施設利用料金計算（データベース版）
   */
  private static calculateFacilityPriceFromDb(addon: AddonItem, addonData: any, dateRange: DateRange, guests: GuestCount): number {
    if (!addon.facilityUsage) return 0

    const { hours, guestType } = addon.facilityUsage
    const totalGuests = Object.values(guests).reduce((sum, count) => sum + count, 0)

    // 個人料金（データベースから）
    let personalFee = 0
    if (hours < 5) {
      personalFee = addonData.personal_fee_5h
    } else if (hours <= 10) {
      personalFee = addonData.personal_fee_10h
    } else {
      personalFee = addonData.personal_fee_over
    }

    // 室料（データベースから）
    const dates = this.generateDateRange(dateRange)
    let roomFee = 0

    dates.forEach((date) => {
      const dayType = this.getDayType(date)
      const isWeekend = dayType === "weekend"

      if (guestType === "guest") {
        roomFee += isWeekend ? addonData.room_fee_weekend_guest : addonData.room_fee_weekday_guest
      } else {
        roomFee += isWeekend ? addonData.room_fee_weekend_other : addonData.room_fee_weekday_other
      }
    })

    // エアコン代（データベースから）
    const airconFee = addonData.aircon_fee_per_hour * hours

    return personalFee * totalGuests + roomFee * hours + airconFee
  }

  /**
   * 備品料金計算（データベース版）
   */
  private static calculateEquipmentPriceFromDb(addon: AddonItem, addonData: any, dateRange: DateRange): number {
    // 備品は年齢に関係なく一律料金（adult_feeを使用）
    return addonData.adult_fee * addon.quantity * dateRange.nights
  }

  /**
   * 日別料金明細計算（データベース版）
   */
  static async calculateDailyBreakdown(
    rooms: RoomUsage[],
    guests: GuestCount,
    dateRange: DateRange,
    addons: AddonItem[],
  ): Promise<DailyPrice[]> {
    const dates = this.generateDateRange(dateRange)
    const usageType = this.determineUsageType(rooms)

    const breakdown: DailyPrice[] = []

    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0]
      const dayType = this.getDayType(date)
      const season = await databaseService.getSeasonForDate(dateStr)

      // 室料（日割り）
      const roomAmount = await this.calculateRoomPrice(rooms, 1)

      // 個人料金（その日の分）
      let guestAmount = 0
      if (season) {
        const rates = await databaseService.getRates({
          seasonId: season.season_id,
          dayType,
          roomUsage: usageType,
        })

        const ratesMap = new Map(rates.map(rate => [rate.age_group, rate.base_price]))
        const seasonMultiplier = season.pax_rate_multiplier

        Object.entries(guests).forEach(([ageGroup, count]) => {
          if (count > 0) {
            const baseRate = ratesMap.get(ageGroup) || 0
            const dailyRate = baseRate * seasonMultiplier
            guestAmount += dailyRate * count
          }
        })
      }

      // オプション料金（日割り）
      const addonAmount = await this.calculateAddonPrice(addons, { ...dateRange, nights: 1 }, guests)

      const total = roomAmount + guestAmount + addonAmount

      breakdown.push({
        date: dateStr,
        dayType,
        season: season?.season_type || "regular",
        roomAmount: Math.round(roomAmount),
        guestAmount: Math.round(guestAmount),
        addonAmount: Math.round(addonAmount),
        total: Math.round(total),
      })
    }

    return breakdown
  }

  /**
   * 利用タイプ判定（大部屋中部屋 or 個室）
   */
  private static determineUsageType(rooms: RoomUsage[]): "shared" | "private" {
    return rooms.some((room) => room.usageType === "private") ? "private" : "shared"
  }

  /**
   * 曜日タイプ判定
   */
  private static getDayType(date: Date): "weekday" | "weekend" {
    const day = date.getDay()
    return day === 0 || day === 5 || day === 6 ? "weekend" : "weekday"
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
   * 料金設定更新機能（管理者用）
   */
  static async updateSeasonRates(seasonId: string, multiplier: number): Promise<boolean> {
    try {
      const season = await databaseService.getSeasonForDate(new Date().toISOString().split('T')[0])
      if (season) {
        // シーズン係数を更新（実際の実装では適切なUpdate操作を行う）
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to update season rates:", error)
      return false
    }
  }

  /**
   * 料金マトリクス取得（管理画面用）
   */
  static async getPriceMatrix(): Promise<{
    seasons: any[]
    rates: any[]
    addOns: any[]
  }> {
    const [seasons, rates, addOns] = await Promise.all([
      databaseService.getActiveSeasons(),
      databaseService.getRates(),
      databaseService.getAllAddOns(),
    ])

    return { seasons, rates, addOns }
  }

  // Simplified methods - delegate to PriceCalculator for Phase 3 optimization
  static async calculateGuestPriceSimplified(guests: GuestCount, dateRange: DateRange, rooms: RoomUsage[]): Promise<number> {
    // Import PriceCalculator to use the simplified logic
    const { PriceCalculator } = await import('./calculator')
    return PriceCalculator.calculateGuestPriceSimplified(guests, dateRange, rooms)
  }

  static async calculateAddonPriceSimplified(addons: AddonItem[], dateRange: DateRange): Promise<number> {
    const { PriceCalculator } = await import('./calculator')
    return PriceCalculator.calculateAddonPriceSimplified(addons, dateRange)
  }

  static async calculateDailyBreakdownSimplified(rooms: RoomUsage[], guests: GuestCount, dateRange: DateRange, addons: AddonItem[]): Promise<DailyPrice[]> {
    const { PriceCalculator } = await import('./calculator')
    return PriceCalculator.calculateDailyBreakdownSimplified(rooms, guests, dateRange, addons)
  }
}