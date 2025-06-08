import type { GuestCount, DateRange, PriceBreakdown, DailyPrice, RoomUsage, AddonItem, RateInfo } from "./types"
import { PriceConfigService, type RateConfig } from "./config-service"
import { generateDateRange } from "@/lib/utils/date-utils"

/**
 * Unified Price Calculator
 * 
 * Enhanced pricing engine with database integration and dynamic configuration.
 * Supports both fixed rate fallback and database-driven pricing configuration.
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

  // Peak season months (3,4,5,7,8,9,12月)
  private static readonly PEAK_MONTHS = [3, 4, 5, 7, 8, 9, 12]

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
   * 動的設定を読み込み（キャッシュ優先、フォールバック対応）
   */
  private static async loadRateConfig(): Promise<RateConfig> {
    // まずキャッシュを確認
    const cached = PriceConfigService.getCachedConfig()
    if (cached) {
      return cached
    }

    try {
      // データベースから読み込み
      return await PriceConfigService.loadConfigFromDB()
    } catch (error) {
      console.warn('Failed to load dynamic config, using static fallback:', error)
      // フォールバック：固定設定を使用
      return this.getStaticConfig()
    }
  }

  /**
   * 静的設定を取得（フォールバック用）
   */
  private static getStaticConfig(): RateConfig {
    return {
      personalRates: this.FIXED_RATE_TABLE,
      roomRates: this.ROOM_RATES,
      addonRates: this.ADDON_RATES,
      peakMonths: this.PEAK_MONTHS,
      configName: 'static_fallback',
      version: 'v1.0.0',
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * 計算結果をデータベースに保存
   */
  static async savePriceDetails(bookingId: string, breakdown: PriceBreakdown, params: {
    rooms: RoomUsage[]
    guests: GuestCount
    dateRange: DateRange
    addons: AddonItem[]
  }): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // まずテーブルの存在確認
      const { error: tableCheckError } = await supabase
        .from('booking_price_details')
        .select('id')
        .limit(1)

      if (tableCheckError) {
        console.info('booking_price_details table not found, skipping price details save')
        return
      }

      const { error } = await supabase
        .from('booking_price_details')
        .insert({
          booking_id: bookingId,
          rooms_used: params.rooms,
          guest_breakdown: params.guests,
          date_range: params.dateRange,
          addons_selected: params.addons,
          season_config: await this.loadRateConfig(),
          room_amount: breakdown.roomAmount,
          guest_amount: breakdown.guestAmount,
          addon_amount: breakdown.addonAmount,
          subtotal: breakdown.subtotal,
          total_amount: breakdown.total,
          daily_breakdown: breakdown.dailyBreakdown,
          calculation_method: 'unified_calculator'
        })

      if (error) {
        console.error('Failed to save price details:', error)
        throw error
      }
    } catch (error) {
      console.error('Error saving price details to database:', error)
      // 非致命的エラーとして処理（計算は続行）
    }
  }

  /**
   * 設定変更時のキャッシュ更新
   */
  static async refreshRateConfig(): Promise<void> {
    PriceConfigService.clearCache()
    await this.loadRateConfig()
  }

  /**
   * 総合料金計算 (Enhanced with database integration) - ASYNC VERSION
   */
  static async calculateTotalPriceAsync(
    rooms: RoomUsage[],
    guests: GuestCount,
    dateRange: DateRange,
    addons: AddonItem[] = [],
  ): Promise<PriceBreakdown> {
    const config = await this.loadRateConfig()
    
    const roomAmount = this.calculateRoomPriceWithConfig(rooms, dateRange.nights, config)
    const guestAmount = await this.calculateGuestPriceWithConfig(guests, dateRange, rooms, config)
    const addonAmount = this.calculateAddonPriceWithConfig(addons, dateRange, config)
    const dailyBreakdown = await this.calculateDailyBreakdownWithConfig(rooms, guests, dateRange, addons, config)

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
   * 総合料金計算 (Backward compatibility - uses static rates)
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
   * 室料計算（設定値対応版）
   */
  private static calculateRoomPriceWithConfig(rooms: RoomUsage[], nights: number, config: RateConfig): number {
    return rooms.reduce((total, room) => {
      const rate = config.roomRates[room.roomType] || 0
      return total + rate * nights
    }, 0)
  }

  /**
   * 個人料金計算（設定値対応版）
   */
  private static async calculateGuestPriceWithConfig(
    guests: GuestCount, 
    dateRange: DateRange, 
    rooms: RoomUsage[], 
    config: RateConfig
  ): Promise<number> {
    const usageType = this.determineUsageType(rooms)
    const rates = config.personalRates[usageType]
    
    let total = 0
    const dates = this.generateDateRange(dateRange)

    for (const date of dates) {
      const dayType = this.getDayType(date)
      const season = this.getSeasonWithConfig(date, config)
      
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
   * オプション料金計算（設定値対応版）
   */
  private static calculateAddonPriceWithConfig(addons: AddonItem[], dateRange: DateRange, config: RateConfig): number {
    let total = 0

    addons.forEach((addon) => {
      const rate = this.getAddonRateWithConfig(addon.category, addon.addonId, config)
      const quantity = addon.quantity || 1
      
      const isDailyAddon = ['breakfast', 'lunch', 'dinner'].includes(addon.addonId)
      const multiplier = isDailyAddon ? dateRange.nights : 1
      
      total += rate * quantity * multiplier
    })

    return Math.round(total)
  }

  /**
   * 日別料金明細計算（設定値対応版）
   */
  private static async calculateDailyBreakdownWithConfig(
    rooms: RoomUsage[],
    guests: GuestCount,
    dateRange: DateRange,
    addons: AddonItem[],
    config: RateConfig
  ): Promise<DailyPrice[]> {
    const dates = this.generateDateRange(dateRange)
    const usageType = this.determineUsageType(rooms)
    const rates = config.personalRates[usageType]

    return dates.map((date) => {
      const dayType = this.getDayType(date)
      const season = this.getSeasonWithConfig(date, config)

      const roomAmount = this.calculateRoomPriceWithConfig(rooms, 1, config)

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

      const addonAmount = this.calculateAddonPriceWithConfig(addons, { ...dateRange, nights: 1 }, config)

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
   * シーズン判定（設定値対応版）
   */
  private static getSeasonWithConfig(date: Date, config: RateConfig): "regular" | "peak" {
    const month = date.getMonth() + 1
    return config.peakMonths.includes(month) ? "peak" : "regular"
  }

  /**
   * オプション料金取得（設定値対応版）
   */
  private static getAddonRateWithConfig(category: string, addonId: string, config: RateConfig): number {
    const categoryRates = config.addonRates[category as keyof typeof config.addonRates]
    if (!categoryRates) return 0
    
    return categoryRates[addonId as keyof typeof categoryRates] || 0
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
    console.log('🧮 [PriceCalculator] calculateAddonPriceSimplified called')
    console.log('🧮 [PriceCalculator] Addons:', addons)
    console.log('🧮 [PriceCalculator] Date range:', dateRange)
    
    let total = 0

    addons.forEach((addon, index) => {
      console.log(`🧮 [PriceCalculator] Processing addon ${index + 1}:`, addon)
      
      // Use the totalPrice already calculated in the addon object if available
      // This includes the correct pricing from the database
      if (addon.totalPrice !== undefined) {
        console.log('🧮 [PriceCalculator] Using pre-calculated totalPrice:', addon.totalPrice)
        
        // For daily addons (meals), multiply by nights
        const isDailyAddon = ['breakfast', 'lunch', 'dinner', 'meal_breakfast', 'meal_lunch', 'meal_dinner'].includes(addon.addonId)
        const multiplier = isDailyAddon ? dateRange.nights : 1
        
        console.log('🧮 [PriceCalculator] Is daily addon:', isDailyAddon, 'Multiplier:', multiplier)
        
        const addonTotal = addon.totalPrice * multiplier
        console.log('🧮 [PriceCalculator] Addon total:', addonTotal, '= totalPrice(', addon.totalPrice, ') * multiplier(', multiplier, ')')
        
        total += addonTotal
      } else {
        // Fallback to old calculation method for backward compatibility
        console.log('🧮 [PriceCalculator] No totalPrice found, using fallback calculation')
        
        const rate = this.getAddonRate(addon.category, addon.addonId)
        const quantity = addon.quantity || 1
        
        console.log('🧮 [PriceCalculator] Rate retrieved:', rate, 'Quantity:', quantity)
        
        // Daily addons multiply by nights, one-time addons don't
        const isDailyAddon = ['breakfast', 'lunch', 'dinner', 'meal_breakfast', 'meal_lunch', 'meal_dinner'].includes(addon.addonId)
        const multiplier = isDailyAddon ? dateRange.nights : 1
        
        console.log('🧮 [PriceCalculator] Is daily addon:', isDailyAddon, 'Multiplier:', multiplier)
        
        const addonTotal = rate * quantity * multiplier
        console.log('🧮 [PriceCalculator] Addon total:', addonTotal, '=', rate, '*', quantity, '*', multiplier)
        
        total += addonTotal
      }
    })

    console.log('🧮 [PriceCalculator] Final addon total:', total)
    return Math.round(total)
  }

  /**
   * Get addon rate from fixed table
   */
  private static getAddonRate(category: string, addonId: string): number {
    console.log('💰 [PriceCalculator] getAddonRate called with:', { category, addonId })
    
    // Map Japanese category names to English internal names
    const categoryMapping: { [key: string]: string } = {
      '食事': 'meal',
      '施設': 'facility', 
      '備品': 'equipment'
    }
    
    // Map UI addon IDs to internal rate IDs
    const idMapping: { [key: string]: string } = {
      meal_breakfast: 'breakfast',
      meal_lunch: 'lunch', 
      meal_dinner: 'dinner',
      meal_bbq: 'bbq',
      facility_meeting: 'projector',
      facility_parking: 'sound_system',
      equipment_futon: 'bedding'
    }
    
    const internalCategory = categoryMapping[category] || category
    const internalId = idMapping[addonId] || addonId
    
    console.log('💰 [PriceCalculator] Mapped category:', category, '→', internalCategory)
    console.log('💰 [PriceCalculator] Mapped addonId:', addonId, '→', internalId)
    
    const categoryRates = this.ADDON_RATES[internalCategory as keyof typeof this.ADDON_RATES]
    console.log('💰 [PriceCalculator] Category rates for', internalCategory, ':', categoryRates)
    
    if (!categoryRates) {
      console.log('💰 [PriceCalculator] No rates found for category:', internalCategory)
      // Fallback: try to get rate from UI options if category mapping fails
      const uiRate = this.getUIOptionRate(addonId)
      console.log('💰 [PriceCalculator] Using UI fallback rate:', uiRate)
      return uiRate
    }
    
    const rate = categoryRates[internalId as keyof typeof categoryRates] || 0
    console.log('💰 [PriceCalculator] Final rate for', internalId, ':', rate)
    
    // Fallback: try to get rate from UI options if internal mapping fails
    if (rate === 0) {
      console.log('💰 [PriceCalculator] Internal mapping failed, trying UI fallback')
      const uiRate = this.getUIOptionRate(addonId)
      console.log('💰 [PriceCalculator] UI fallback rate:', uiRate)
      return uiRate
    }
    
    return rate
  }
  
  /**
   * Fallback: Get rate from UI option definitions
   */
  private static getUIOptionRate(addonId: string): number {
    // These rates match the UI option definitions in RoomAndOptionsStep.tsx
    const uiRates: { [key: string]: number } = {
      meal_breakfast: 800,
      meal_lunch: 1200,
      meal_dinner: 2000,
      facility_meeting: 3000,
      facility_parking: 500,
      equipment_futon: 1000
    }
    
    return uiRates[addonId] || 0
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
    return generateDateRange(dateRange.startDate, dateRange.endDate)
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
