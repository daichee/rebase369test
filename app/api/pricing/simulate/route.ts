import { NextRequest, NextResponse } from "next/server"
import { PriceCalculator } from "@/lib/pricing/calculator"
import { createClient } from "@/lib/supabase/server"
import type { GuestCount, DateRange, RoomUsage, AddonItem } from "@/lib/pricing/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { baseScenario, variations } = body

    if (!baseScenario) {
      return NextResponse.json(
        { error: "Base scenario is required" },
        { status: 400 }
      )
    }

    // ベースシナリオの計算
    const baseResult = await calculateScenario(baseScenario, "base")

    // バリエーションの計算
    const variationResults = []
    if (variations && Array.isArray(variations)) {
      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i]
        const result = await calculateScenario(variation, `variation_${i + 1}`)
        variationResults.push(result)
      }
    }

    // 自動最適化提案の生成
    const optimizationSuggestions = await generateOptimizationSuggestions(baseScenario)

    // 比較レポートの生成
    const comparisonReport = generateComparisonReport(baseResult, variationResults)

    return NextResponse.json({
      baseScenario: baseResult,
      variations: variationResults,
      optimizationSuggestions,
      comparisonReport,
      summary: {
        totalScenariosCalculated: 1 + variationResults.length,
        bestPrice: Math.min(baseResult.total, ...variationResults.map(v => v.total)),
        worstPrice: Math.max(baseResult.total, ...variationResults.map(v => v.total)),
        priceDifference: Math.max(baseResult.total, ...variationResults.map(v => v.total)) - 
                        Math.min(baseResult.total, ...variationResults.map(v => v.total))
      }
    })

  } catch (error) {
    console.error("Error in price simulation:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Simulation error: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error during price simulation" },
      { status: 500 }
    )
  }
}

async function calculateScenario(scenario: any, scenarioId: string) {
  const { rooms, guests, dateRange, addons = [] } = scenario

  // 日数計算
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)
  const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

  const dateRangeWithNights: DateRange = {
    ...dateRange,
    nights
  }

  // 料金計算
  const priceBreakdown = PriceCalculator.calculateTotalPrice(
    rooms as RoomUsage[],
    guests as GuestCount,
    dateRangeWithNights,
    addons as AddonItem[]
  )

  const totalGuests = Object.values(guests as GuestCount).reduce((sum: number, count: number) => sum + count, 0)
  const totalCapacity = rooms.reduce((sum: number, room: RoomUsage) => sum + room.capacity, 0)

  return {
    scenarioId,
    input: {
      rooms,
      guests,
      dateRange: dateRangeWithNights,
      addons,
      totalGuests,
      totalCapacity
    },
    ...priceBreakdown,
    efficiency: {
      pricePerGuest: Math.round(priceBreakdown.total / totalGuests),
      pricePerNight: Math.round(priceBreakdown.total / nights),
      capacityUtilization: Math.round((totalGuests / totalCapacity) * 100)
    }
  }
}

async function generateOptimizationSuggestions(baseScenario: any) {
  const supabase = createClient()
  const { rooms: baseRooms, guests, dateRange } = baseScenario

  const totalGuests = Object.values(guests as GuestCount).reduce((sum: number, count: number) => sum + count, 0)

  // 利用可能な部屋を取得
  const { data: availableRooms, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("is_active", true)
    .gte("capacity", 1)

  if (error || !availableRooms) {
    return []
  }

  const suggestions = []

  // 1. より安い部屋の組み合わせ提案
  const cheaperCombinations = findCheaperRoomCombinations(availableRooms, totalGuests, baseRooms)
  suggestions.push(...cheaperCombinations)

  // 2. 利用率最適化提案
  const utilizationOptimizations = findUtilizationOptimizations(availableRooms, totalGuests, baseRooms)
  suggestions.push(...utilizationOptimizations)

  // 3. 日程変更による料金削減提案
  const dateOptimizations = generateDateOptimizations(dateRange)
  suggestions.push(...dateOptimizations)

  return suggestions.slice(0, 5) // 上位5件
}

function findCheaperRoomCombinations(availableRooms: any[], totalGuests: number, currentRooms: any[]) {
  const currentTotalRate = currentRooms.reduce((sum: number, room: any) => sum + room.roomRate, 0)
  const suggestions = []

  // 単一部屋で対応可能な場合
  availableRooms
    .filter(room => room.capacity >= totalGuests && room.room_rate < currentTotalRate)
    .forEach(room => {
      suggestions.push({
        type: "cheaper_single_room",
        description: `${room.name}に変更することで室料を削減できます`,
        rooms: [room],
        savingsAmount: currentTotalRate - room.room_rate,
        priority: "high"
      })
    })

  return suggestions
}

function findUtilizationOptimizations(availableRooms: any[], totalGuests: number, currentRooms: any[]) {
  const currentCapacity = currentRooms.reduce((sum: number, room: any) => sum + room.capacity, 0)
  const currentUtilization = (totalGuests / currentCapacity) * 100
  const suggestions = []

  if (currentUtilization < 70) {
    // 利用率が低い場合、より小さな部屋を提案
    availableRooms
      .filter(room => room.capacity >= totalGuests && room.capacity < currentCapacity)
      .forEach(room => {
        const newUtilization = (totalGuests / room.capacity) * 100
        suggestions.push({
          type: "better_utilization",
          description: `${room.name}に変更することで利用率を改善できます`,
          rooms: [room],
          utilizationImprovement: newUtilization - currentUtilization,
          priority: "medium"
        })
      })
  }

  return suggestions
}

function generateDateOptimizations(dateRange: any) {
  const suggestions = []
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)

  // 平日開始の提案
  if (startDate.getDay() === 5 || startDate.getDay() === 6) { // 金土
    suggestions.push({
      type: "weekday_start",
      description: "平日開始にすることで22%の料金削減が可能です",
      priority: "high",
      potentialSavings: "22%"
    })
  }

  // 通常期への変更提案
  const currentMonth = startDate.getMonth() + 1
  const peakMonths = [3, 4, 5, 7, 8, 9, 12]
  
  if (peakMonths.includes(currentMonth)) {
    suggestions.push({
      type: "off_peak_season",
      description: "通常期への変更で15%の料金削減が可能です",
      priority: "medium",
      potentialSavings: "15%"
    })
  }

  return suggestions
}

function generateComparisonReport(baseResult: any, variationResults: any[]) {
  if (variationResults.length === 0) {
    return {
      cheapestOption: baseResult,
      mostExpensiveOption: baseResult,
      averagePrice: baseResult.total,
      priceRange: 0
    }
  }

  const allResults = [baseResult, ...variationResults]
  const prices = allResults.map(result => result.total)
  
  const cheapest = allResults.find(result => result.total === Math.min(...prices))
  const mostExpensive = allResults.find(result => result.total === Math.max(...prices))
  const averagePrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
  const priceRange = Math.max(...prices) - Math.min(...prices)

  return {
    cheapestOption: {
      scenarioId: cheapest?.scenarioId,
      total: cheapest?.total,
      savings: mostExpensive!.total - cheapest!.total
    },
    mostExpensiveOption: {
      scenarioId: mostExpensive?.scenarioId,
      total: mostExpensive?.total
    },
    averagePrice,
    priceRange,
    variationCount: variationResults.length
  }
}