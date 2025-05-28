import type { 
  GuestCount, 
  DateRange, 
  PriceBreakdown, 
  DailyPrice, 
  RoomUsage, 
  AddonItem, 
  GuestRateMatrix,
  RoomRate,
  SeasonPeriod,
  PriceLineItem
} from "./types"

export class IndividualPriceCalculator {
  // デフォルト室料（既存の料金表に基づく）
  private static readonly DEFAULT_ROOM_RATES: Record<string, RoomRate> = {
    large: {
      rateId: "room_large",
      roomType: "large",
      roomName: "大部屋（作法室・被服室）",
      baseRate: 20000,
      effectiveFrom: "2024-01-01",
      isActive: true
    },
    medium_a: {
      rateId: "room_medium_a", 
      roomType: "medium_a",
      roomName: "中部屋（視聴覚室）",
      baseRate: 13000,
      effectiveFrom: "2024-01-01",
      isActive: true
    },
    medium_b: {
      rateId: "room_medium_b",
      roomType: "medium_b", 
      roomName: "中部屋（図書室）",
      baseRate: 8000,
      effectiveFrom: "2024-01-01",
      isActive: true
    },
    small_a: {
      rateId: "room_small_a",
      roomType: "small_a",
      roomName: "個室（1年1組・1年2組）", 
      baseRate: 7000,
      effectiveFrom: "2024-01-01",
      isActive: true
    },
    small_b: {
      rateId: "room_small_b",
      roomType: "small_b",
      roomName: "個室（理科室）",
      baseRate: 6000,
      effectiveFrom: "2024-01-01", 
      isActive: true
    },
    small_c: {
      rateId: "room_small_c",
      roomType: "small_c",
      roomName: "個室（2年組・3年組）",
      baseRate: 5000,
      effectiveFrom: "2024-01-01",
      isActive: true
    }
  }

  // デフォルト個人料金マトリクス（実際の料金表に基づく）
  private static readonly DEFAULT_GUEST_RATES: GuestRateMatrix[] = [
    // 大部屋・中部屋（共同利用）
    { matrixId: "shared_adult_weekday_off", ageGroup: "adult", usageType: "shared", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 4800, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_adult_weekday_on", ageGroup: "adult", usageType: "shared", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 5800, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_adult_weekend_off", ageGroup: "adult", usageType: "shared", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 5800, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_adult_weekend_on", ageGroup: "adult", usageType: "shared", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 7000, effectiveFrom: "2024-01-01", isActive: true },
    
    { matrixId: "shared_student_weekday_off", ageGroup: "student", usageType: "shared", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 4000, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_student_weekday_on", ageGroup: "student", usageType: "shared", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 4800, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_student_weekend_off", ageGroup: "student", usageType: "shared", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 4800, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_student_weekend_on", ageGroup: "student", usageType: "shared", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 5800, effectiveFrom: "2024-01-01", isActive: true },

    { matrixId: "shared_child_weekday_off", ageGroup: "child", usageType: "shared", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 3200, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_child_weekday_on", ageGroup: "child", usageType: "shared", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 3800, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_child_weekend_off", ageGroup: "child", usageType: "shared", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 3800, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_child_weekend_on", ageGroup: "child", usageType: "shared", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 4600, effectiveFrom: "2024-01-01", isActive: true },

    { matrixId: "shared_infant_weekday_off", ageGroup: "infant", usageType: "shared", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 2500, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_infant_weekday_on", ageGroup: "infant", usageType: "shared", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 3000, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_infant_weekend_off", ageGroup: "infant", usageType: "shared", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 3000, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_infant_weekend_on", ageGroup: "infant", usageType: "shared", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 3600, effectiveFrom: "2024-01-01", isActive: true },

    // 個室利用
    { matrixId: "private_adult_weekday_off", ageGroup: "adult", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 8500, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_adult_weekday_on", ageGroup: "adult", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 10200, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_adult_weekend_off", ageGroup: "adult", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 10200, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_adult_weekend_on", ageGroup: "adult", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 12200, effectiveFrom: "2024-01-01", isActive: true },

    // 個室利用（付添）
    { matrixId: "private_adult_leader_weekday_off", ageGroup: "adult", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: true, price: 6800, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_adult_leader_weekday_on", ageGroup: "adult", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: true, price: 8200, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_adult_leader_weekend_off", ageGroup: "adult", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: true, price: 8200, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_adult_leader_weekend_on", ageGroup: "adult", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: true, price: 9800, effectiveFrom: "2024-01-01", isActive: true },

    { matrixId: "private_student_weekday_off", ageGroup: "student", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 5900, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_student_weekday_on", ageGroup: "student", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 7100, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_student_weekend_off", ageGroup: "student", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 7100, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_student_weekend_on", ageGroup: "student", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 8500, effectiveFrom: "2024-01-01", isActive: true },

    { matrixId: "private_child_weekday_off", ageGroup: "child", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 5000, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_child_weekday_on", ageGroup: "child", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 6000, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_child_weekend_off", ageGroup: "child", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 6000, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_child_weekend_on", ageGroup: "child", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 7200, effectiveFrom: "2024-01-01", isActive: true },

    { matrixId: "private_infant_weekday_off", ageGroup: "infant", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 4200, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_infant_weekday_on", ageGroup: "infant", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 5000, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_infant_weekend_off", ageGroup: "infant", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 5000, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_infant_weekend_on", ageGroup: "infant", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 6000, effectiveFrom: "2024-01-01", isActive: true },

    // 乳児は常に0円
    { matrixId: "shared_baby_weekday_off", ageGroup: "baby", usageType: "shared", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_baby_weekday_on", ageGroup: "baby", usageType: "shared", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_baby_weekend_off", ageGroup: "baby", usageType: "shared", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "shared_baby_weekend_on", ageGroup: "baby", usageType: "shared", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_baby_weekday_off", ageGroup: "baby", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_baby_weekday_on", ageGroup: "baby", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_baby_weekend_off", ageGroup: "baby", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
    { matrixId: "private_baby_weekend_on", ageGroup: "baby", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  ]

  // デフォルト季節期間設定
  private static readonly DEFAULT_SEASON_PERIODS: SeasonPeriod[] = [
    {
      periodId: "spring_season",
      name: "春シーズン",
      type: "on_season",
      startDate: "03-01",
      endDate: "03-31",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      periodId: "early_summer_season",
      name: "初夏シーズン",
      type: "on_season", 
      startDate: "04-01",
      endDate: "04-30",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      periodId: "gw_season",
      name: "GWシーズン",
      type: "on_season",
      startDate: "05-01", 
      endDate: "05-10",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      periodId: "summer_season", 
      name: "夏シーズン",
      type: "on_season",
      startDate: "07-01",
      endDate: "08-31",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      periodId: "autumn_season",
      name: "秋シーズン", 
      type: "on_season",
      startDate: "09-01",
      endDate: "09-30",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      periodId: "winter_season",
      name: "冬シーズン",
      type: "on_season",
      startDate: "12-01", 
      endDate: "12-31",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    }
  ]

  /**
   * 総合料金計算（新しい個別値方式）
   */
  static calculateTotalPrice(
    rooms: RoomUsage[],
    guests: GuestCount,
    dateRange: DateRange,
    addons: AddonItem[] = [],
    customRates?: GuestRateMatrix[],
    customRoomRates?: RoomRate[],
    customSeasons?: SeasonPeriod[]
  ): PriceBreakdown {
    const guestRates = customRates || this.DEFAULT_GUEST_RATES
    const roomRates = customRoomRates || Object.values(this.DEFAULT_ROOM_RATES)
    const seasonPeriods = customSeasons || this.DEFAULT_SEASON_PERIODS

    const roomAmount = this.calculateRoomPrice(rooms, dateRange.nights, roomRates)
    const { guestAmount, guestLineItems } = this.calculateGuestPrice(guests, dateRange, rooms, guestRates, seasonPeriods)
    const addonAmount = this.calculateAddonPrice(addons, dateRange, guests)
    const dailyBreakdown = this.calculateDailyBreakdown(rooms, guests, dateRange, addons, guestRates, roomRates, seasonPeriods)

    const subtotal = roomAmount + guestAmount + addonAmount
    const total = Math.round(subtotal)

    // 見積書項目を作成
    const roomLineItems = this.createRoomLineItems(rooms, dateRange.nights, roomRates)
    const addonLineItems = this.createAddonLineItems(addons, dateRange, guests)
    const lineItems = [...roomLineItems, ...guestLineItems, ...addonLineItems]

    return {
      roomAmount,
      guestAmount,
      addonAmount,
      subtotal,
      total,
      dailyBreakdown,
      lineItems
    }
  }

  /**
   * 室料計算
   */
  static calculateRoomPrice(rooms: RoomUsage[], nights: number, roomRates: RoomRate[]): number {
    return rooms.reduce((total, room) => {
      const rateInfo = roomRates.find(r => r.roomType === room.roomType && r.isActive)
      const rate = rateInfo?.baseRate || 0
      return total + rate * nights
    }, 0)
  }

  /**
   * 個人料金計算（絶対値方式）
   */
  static calculateGuestPrice(
    guests: GuestCount, 
    dateRange: DateRange, 
    rooms: RoomUsage[],
    guestRates: GuestRateMatrix[],
    seasonPeriods: SeasonPeriod[]
  ): { guestAmount: number; guestLineItems: PriceLineItem[] } {
    const usageType = this.determineUsageType(rooms)
    const dates = this.generateDateRange(dateRange)
    const lineItems: PriceLineItem[] = []

    let total = 0

    for (const date of dates) {
      const dayType = this.getDayType(date)
      const seasonType = this.getSeasonType(date, seasonPeriods)

      Object.entries(guests).forEach(([ageGroup, count]) => {
        if (count > 0 && ageGroup !== "adult_leader") {
          const isLeader = ageGroup === "adult" && guests.adult_leader && guests.adult_leader > 0
          const actualCount = isLeader ? (guests.adult_leader || 0) : count
          
          if (actualCount > 0) {
            const rate = this.findGuestRate(
              ageGroup as any,
              usageType,
              dayType,
              seasonType,
              isLeader,
              guestRates
            )
            
            if (rate) {
              const dailyAmount = rate.price * actualCount
              total += dailyAmount

              // 見積書項目を作成
              const description = this.createGuestDescription(ageGroup as any, dayType, seasonType, isLeader)
              lineItems.push({
                itemId: `guest_${date.toISOString().split("T")[0]}_${ageGroup}`,
                category: "guest",
                description,
                unitPrice: rate.price,
                quantity: actualCount,
                unit: "人泊",
                subtotal: dailyAmount,
                date: date.toISOString().split("T")[0],
                ageGroup
              })
            }
          }
        }
      })
    }

    return { 
      guestAmount: Math.round(total),
      guestLineItems: lineItems
    }
  }

  /**
   * オプション料金計算（既存ロジックを維持）
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
   * 料金マトリクスから該当料金を検索
   */
  private static findGuestRate(
    ageGroup: "adult" | "student" | "child" | "infant" | "baby",
    usageType: "shared" | "private",
    dayType: "weekday" | "weekend",
    seasonType: "off_season" | "on_season",
    isLeader: boolean,
    guestRates: GuestRateMatrix[]
  ): GuestRateMatrix | null {
    return guestRates.find(rate => 
      rate.ageGroup === ageGroup &&
      rate.usageType === usageType &&
      rate.dayType === dayType &&
      rate.seasonType === seasonType &&
      rate.isLeader === isLeader &&
      rate.isActive
    ) || null
  }

  /**
   * 季節タイプ判定（新しい期間ベース）
   */
  private static getSeasonType(date: Date, seasonPeriods: SeasonPeriod[]): "off_season" | "on_season" {
    const monthDay = String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(date.getDate()).padStart(2, '0')

    for (const period of seasonPeriods) {
      if (period.isActive && period.type === "on_season") {
        if (monthDay >= period.startDate && monthDay <= period.endDate) {
          return "on_season"
        }
      }
    }

    return "off_season"
  }

  /**
   * 曜日タイプ判定（既存ロジック + 祝日対応）
   */
  private static getDayType(date: Date): "weekday" | "weekend" {
    const day = date.getDay()
    // 土曜日(6)、日曜日(0)を休日扱い
    // TODO: 祝日カレンダーAPIとの連携を将来実装
    return day === 0 || day === 6 ? "weekend" : "weekday"
  }

  /**
   * 利用タイプ判定
   */
  private static determineUsageType(rooms: RoomUsage[]): "shared" | "private" {
    return rooms.some((room) => room.usageType === "private") ? "private" : "shared"
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
   * 個人料金説明文作成
   */
  private static createGuestDescription(
    ageGroup: "adult" | "student" | "child" | "infant" | "baby",
    dayType: "weekday" | "weekend", 
    seasonType: "off_season" | "on_season",
    isLeader: boolean
  ): string {
    const ageLabels = {
      adult: "大人",
      student: "学生", 
      child: "小学生",
      infant: "幼児",
      baby: "乳児"
    }

    const dayLabel = dayType === "weekday" ? "平日" : "週末・祝日"
    const seasonLabel = seasonType === "off_season" ? "オフシーズン" : "オンシーズン"
    const leaderSuffix = isLeader ? "（付添）" : ""

    return `${ageLabels[ageGroup]}${leaderSuffix} ${dayLabel}・${seasonLabel}`
  }

  /**
   * 室料見積書項目作成
   */
  private static createRoomLineItems(rooms: RoomUsage[], nights: number, roomRates: RoomRate[]): PriceLineItem[] {
    return rooms.map(room => {
      const rateInfo = roomRates.find(r => r.roomType === room.roomType && r.isActive)
      const rate = rateInfo?.baseRate || 0
      
      return {
        itemId: `room_${room.roomId}`,
        category: "room",
        description: rateInfo?.roomName || `部屋料金 (${room.roomType})`,
        unitPrice: rate,
        quantity: nights,
        unit: "泊",
        subtotal: rate * nights,
        roomType: room.roomType
      }
    })
  }

  /**
   * オプション見積書項目作成
   */
  private static createAddonLineItems(addons: AddonItem[], dateRange: DateRange, guests: GuestCount): PriceLineItem[] {
    // TODO: オプション料金の見積書項目を実装
    return []
  }

  /**
   * 日別料金明細計算
   */
  static calculateDailyBreakdown(
    rooms: RoomUsage[],
    guests: GuestCount,
    dateRange: DateRange,
    addons: AddonItem[],
    guestRates: GuestRateMatrix[],
    roomRates: RoomRate[],
    seasonPeriods: SeasonPeriod[]
  ): DailyPrice[] {
    const dates = this.generateDateRange(dateRange)
    const usageType = this.determineUsageType(rooms)

    return dates.map((date) => {
      const dayType = this.getDayType(date)
      const season = this.getSeasonType(date, seasonPeriods)

      // 室料（日割り）
      const roomAmount = this.calculateRoomPrice(rooms, 1, roomRates)

      // 個人料金（その日の分）
      let guestAmount = 0
      Object.entries(guests).forEach(([ageGroup, count]) => {
        if (count > 0 && ageGroup !== "adult_leader") {
          const isLeader = ageGroup === "adult" && guests.adult_leader && guests.adult_leader > 0
          const actualCount = isLeader ? (guests.adult_leader || 0) : count
          
          if (actualCount > 0) {
            const rate = this.findGuestRate(
              ageGroup as any,
              usageType,
              dayType,
              season,
              isLeader,
              guestRates
            )
            
            if (rate) {
              guestAmount += rate.price * actualCount
            }
          }
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

  // 既存の食事料金計算（変更なし）
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

  // 既存の施設利用料金計算（変更なし）
  private static calculateFacilityPrice(addon: AddonItem, dateRange: DateRange, guests: GuestCount): number {
    if (!addon.facilityUsage) return 0

    const { hours, guestType } = addon.facilityUsage
    const totalGuests = Object.values(guests).reduce((sum, count) => sum + count, 0)

    let personalFee = 0
    if (hours < 5) {
      personalFee = 200
    } else if (hours <= 10) {
      personalFee = 400
    } else {
      personalFee = 600
    }

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

    const airconFee = addon.addonId === "meeting_room" ? 500 * hours : 1500 * hours

    return personalFee * totalGuests + roomFee * hours + airconFee
  }

  // 既存の備品料金計算（変更なし）
  private static calculateEquipmentPrice(addon: AddonItem, dateRange: DateRange): number {
    return addon.unitPrice * addon.quantity * dateRange.nights
  }
}