// 料金計算関連の型定義
export interface GuestCount {
  adult: number // 大人
  adult_leader?: number // 大人合宿付添（個室時のみ）
  student: number // 中高大学生
  child: number // 小学生
  infant: number // 未就学児(3歳～)
  baby: number // 乳幼児(0～2歳) - 常に0円
}

export interface DateRange {
  startDate: string
  endDate: string
  nights: number
}

export interface PriceBreakdown {
  roomAmount: number // 室料合計
  guestAmount: number // 個人料金合計
  addonAmount: number // オプション料金合計
  subtotal: number // 小計
  total: number // 総額（税込み）
  dailyBreakdown: DailyPrice[] // 日別明細
  lineItems: PriceLineItem[] // 見積書項目
}

export interface DailyPrice {
  date: string
  dayType: "weekday" | "weekend"
  season: "off_season" | "on_season"
  roomAmount: number
  guestAmount: number
  addonAmount: number
  total: number
}

export interface RoomUsage {
  roomId: string
  roomType: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c"
  usageType: "shared" | "private" // 大部屋中部屋/個室
  roomRate: number // 室料単価
  assignedGuests: number
  capacity: number
}

export interface AddonItem {
  addonId: string
  category: "meal" | "facility" | "equipment"
  name: string
  quantity: number
  ageBreakdown?: {
    // 食事系の年齢区分別数量
    adult: number
    student: number
    child: number
    infant: number
  }
  facilityUsage?: {
    // 施設系の利用時間
    hours: number
    guestType: "guest" | "other"
  }
  unitPrice: number
  totalPrice: number
}

// 新しい季節期間設定
export interface SeasonPeriod {
  periodId: string
  name: string // "春シーズン(GW含む)"
  type: "off_season" | "on_season"
  startDate: string // "03-01"
  endDate: string // "05-10"
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 個人料金マトリクス（絶対値設定）
export interface GuestRateMatrix {
  matrixId: string
  ageGroup: "adult" | "student" | "child" | "infant" | "baby"
  roomType: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c"
  dayType: "weekday" | "weekend"
  seasonType: "off_season" | "on_season"
  isLeader: boolean // 付添割引フラグ
  price: number // 絶対値（係数計算なし）
  effectiveFrom: string
  effectiveTo?: string
  isActive: boolean
}

// 部屋料金設定
export interface RoomRate {
  rateId: string
  roomType: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c"
  roomName: string
  baseRate: number // 固定値
  effectiveFrom: string
  effectiveTo?: string
  isActive: boolean
}

// 見積書項目
export interface PriceLineItem {
  itemId: string
  category: "room" | "guest" | "addon"
  description: string // "大人 平日・オフシーズン"
  unitPrice: number
  quantity: number
  unit: string // "人泊", "泊", "個"
  subtotal: number
  date?: string // 日別明細の場合
  ageGroup?: string
  roomType?: string
}

export interface RateInfo {
  ageGroup: keyof GuestCount
  basePrice: number
  dayType: "weekday" | "weekend"
  seasonType: "off_season" | "on_season"
  finalPrice: number
}
