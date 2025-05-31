import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PriceCalculator } from "@/lib/pricing/calculator"
import type { RoomUsage, GuestCount, DateRange, AddonItem } from "@/lib/pricing/types"

/**
 * 料金変更プレビューAPI
 * 設定変更前に料金計算結果をプレビュー
 */

// POST /api/admin/pricing/preview - 料金変更プレビュー計算
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 管理者権限チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      rooms, 
      guests, 
      dateRange, 
      addons = [], 
      newConfig 
    }: {
      rooms: RoomUsage[]
      guests: GuestCount
      dateRange: DateRange
      addons?: AddonItem[]
      newConfig?: any
    } = body

    // バリデーション
    if (!rooms || !guests || !dateRange) {
      return NextResponse.json(
        { error: "Missing required parameters: rooms, guests, dateRange" },
        { status: 400 }
      )
    }

    // 現在の設定での計算
    const currentCalculation = await PriceCalculator.calculateTotalPriceAsync(
      rooms,
      guests,
      dateRange,
      addons
    )

    // 新しい設定での計算（提供されている場合）
    let newCalculation = null
    if (newConfig) {
      // 一時的に新しい設定を使って計算
      // TODO: 実装の詳細化が必要
      newCalculation = PriceCalculator.calculateTotalPrice(
        rooms,
        guests,
        dateRange,
        addons
      )
    }

    const response = {
      current: currentCalculation,
      preview: newCalculation,
      comparison: newCalculation ? {
        totalDifference: newCalculation.total - currentCalculation.total,
        roomDifference: newCalculation.roomAmount - currentCalculation.roomAmount,
        guestDifference: newCalculation.guestAmount - currentCalculation.guestAmount,
        addonDifference: newCalculation.addonAmount - currentCalculation.addonAmount,
        percentageChange: ((newCalculation.total - currentCalculation.total) / currentCalculation.total * 100).toFixed(2)
      } : null
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Error calculating pricing preview:", error)
    return NextResponse.json(
      { error: "Failed to calculate pricing preview" },
      { status: 500 }
    )
  }
}