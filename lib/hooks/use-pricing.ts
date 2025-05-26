"use client"

import { useState, useCallback } from "react"
import { PriceCalculator } from "@/lib/pricing/calculator"
import type { 
  GuestCount, 
  DateRange, 
  PriceBreakdown, 
  RoomUsage, 
  AddonItem 
} from "@/lib/pricing/types"

export interface BookingPriceRequest {
  guests: GuestCount
  dateRange: DateRange
  rooms: RoomUsage[]
  addons?: AddonItem[]
}

export function usePricing() {
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculatePrice = useCallback(async (request: BookingPriceRequest): Promise<PriceBreakdown> => {
    setIsCalculating(true)
    setError(null)
    
    try {
      // READMEの仕様通りの計算を実行
      const breakdown = PriceCalculator.calculateTotalPrice(
        request.rooms,
        request.guests,
        request.dateRange,
        request.addons || []
      )
      
      return breakdown
    } catch (error) {
      console.error("料金計算に失敗:", error)
      setError("料金計算に失敗しました")
      throw error
    } finally {
      setIsCalculating(false)
    }
  }, [])

  const calculateQuickPrice = useCallback(
    (guests: GuestCount, nights: number, roomType: "shared" | "private" = "shared"): number => {
      try {
        // 簡易計算（基本料金のみ）
        const baseRates = roomType === "private" 
          ? { adult: 8500, student: 5900, child: 5000, infant: 4200, baby: 0 }
          : { adult: 4800, student: 4000, child: 3200, infant: 2500, baby: 0 }
        
        let total = 0
        Object.entries(guests).forEach(([ageGroup, count]) => {
          if (count > 0 && ageGroup in baseRates) {
            const rate = baseRates[ageGroup as keyof typeof baseRates] || 0
            total += rate * count * nights
          }
        })
        
        return Math.round(total)
      } catch (error) {
        console.error("簡易料金計算に失敗:", error)
        return 0
      }
    }, []
  )

  const validateGuests = useCallback((guests: GuestCount): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // 合計人数チェック
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0)
    if (total === 0) {
      errors.push("宿泊人数を入力してください")
    }
    
    // 年齢区分別バリデーション
    if (guests.adult < 0) errors.push("大人の人数が不正です")
    if (guests.student < 0) errors.push("学生の人数が不正です")
    if (guests.child < 0) errors.push("小学生の人数が不正です")
    if (guests.infant < 0) errors.push("未就学児の人数が不正です")
    if (guests.baby < 0) errors.push("乳幼児の人数が不正です")
    
    // 大人が0人の場合は警告
    if (guests.adult === 0 && total > 0) {
      errors.push("大人の方が最低1名必要です")
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [])

  const validateDateRange = useCallback((dateRange: DateRange): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    const start = new Date(dateRange.startDate)
    const end = new Date(dateRange.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 日付の整合性チェック
    if (start >= end) {
      errors.push("チェックアウト日はチェックイン日より後の日付を選択してください")
    }
    
    // 過去日チェック
    if (start < today) {
      errors.push("チェックイン日は今日以降の日付を選択してください")
    }
    
    // 宿泊数チェック
    if (dateRange.nights <= 0) {
      errors.push("宿泊数が不正です")
    }
    
    // 最大宿泊数チェック（例：30泊まで）
    if (dateRange.nights > 30) {
      errors.push("宿泊数は30泊までです")
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [])

  const validateRooms = useCallback((rooms: RoomUsage[], guests: GuestCount): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (rooms.length === 0) {
      errors.push("部屋を選択してください")
    }
    
    // 定員チェック
    const totalCapacity = rooms.reduce((sum, room) => sum + room.assignedGuests, 0)
    const totalGuests = Object.values(guests).reduce((sum, count) => sum + count, 0)
    
    if (totalCapacity < totalGuests) {
      errors.push(`定員が不足しています（定員: ${totalCapacity}名、宿泊者: ${totalGuests}名）`)
    }
    
    // 部屋別の定員チェック
    rooms.forEach(room => {
      if (room.assignedGuests <= 0) {
        errors.push(`${room.roomId}の利用人数を入力してください`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [])

  const createRoomUsage = useCallback((
    roomId: string, 
    roomType: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c",
    usageType: "shared" | "private",
    assignedGuests: number
  ): RoomUsage => {
    // READMEの室料設定
    const roomRates = {
      large: 20000,     // 大部屋（作法室・被服室）
      medium_a: 13000,  // 中部屋（視聴覚室）
      medium_b: 8000,   // 中部屋（図書室）
      small_a: 7000,    // 個室（1年1組・1年2組）
      small_b: 6000,    // 個室（理科室）
      small_c: 5000,    // 個室（2年組・3年組）
    }
    
    return {
      roomId,
      roomType,
      usageType,
      roomRate: roomRates[roomType],
      assignedGuests
    }
  }, [])

  const createMealAddon = useCallback((
    mealType: "breakfast" | "dinner" | "bbq",
    ageBreakdown: { adult: number; student: number; child: number; infant: number }
  ): AddonItem => {
    const mealRates = {
      breakfast: { adult: 700, student: 700, child: 700, infant: 700 },
      dinner: { adult: 1500, student: 1000, child: 800, infant: 800 },
      bbq: { adult: 3000, student: 2200, child: 1500, infant: 1500 }
    }
    
    const rates = mealRates[mealType]
    const totalPrice = Object.entries(ageBreakdown).reduce((sum, [ageGroup, count]) => {
      return sum + (rates[ageGroup as keyof typeof rates] * count)
    }, 0)
    
    const totalQuantity = Object.values(ageBreakdown).reduce((sum, count) => sum + count, 0)
    
    return {
      addonId: mealType,
      category: "meal",
      name: mealType === "breakfast" ? "朝食" : mealType === "dinner" ? "夕食" : "BBQ",
      quantity: totalQuantity,
      ageBreakdown,
      unitPrice: totalPrice / totalQuantity,
      totalPrice
    }
  }, [])

  return {
    isCalculating,
    error,
    calculatePrice,
    calculateQuickPrice,
    validateGuests,
    validateDateRange,
    validateRooms,
    createRoomUsage,
    createMealAddon
  }
}