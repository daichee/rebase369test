import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PriceConfigService, type EditableConfig } from "@/lib/pricing/config-service"
import { PriceCalculator } from "@/lib/pricing/calculator"

/**
 * 料金管理API
 * 管理者による動的料金設定の管理を担当
 */

// GET /api/admin/pricing - 現在の料金設定取得
export async function GET() {
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

    // 現在の設定を取得
    const config = await PriceConfigService.getEditableConfig()
    
    return NextResponse.json(config)

  } catch (error) {
    console.error("Error fetching pricing config:", error)
    return NextResponse.json(
      { error: "Failed to fetch pricing configuration" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/pricing - 料金設定更新・適用
export async function PUT(request: NextRequest) {
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
    const config: EditableConfig = body

    // バリデーション
    if (!PriceConfigService.validateConfig(config)) {
      return NextResponse.json(
        { error: "Invalid configuration provided" },
        { status: 400 }
      )
    }

    // 設定更新
    await PriceConfigService.updateEditableConfig(config)

    // 計算エンジンのキャッシュ更新
    await PriceCalculator.refreshRateConfig()

    return NextResponse.json({ 
      success: true, 
      message: "Pricing configuration updated successfully" 
    })

  } catch (error) {
    console.error("Error updating pricing config:", error)
    return NextResponse.json(
      { error: "Failed to update pricing configuration" },
      { status: 500 }
    )
  }
}