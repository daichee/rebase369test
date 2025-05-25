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
}

export interface DailyPrice {
  date: string
  dayType: "weekday" | "weekend"
  season: "regular" | "peak"
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

export interface SeasonInfo {
  seasonId: string
  name: string
  type: "regular" | "peak"
  multiplier: number
}

export interface RateInfo {
  ageGroup: keyof GuestCount
  basePrice: number
  dayMultiplier: number
  seasonMultiplier: number
  finalPrice: number
}
