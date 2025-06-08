import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PriceConfigService, type EditableConfig } from "@/lib/pricing/config-service"
import { PriceCalculator } from "@/lib/pricing/calculator"

/**
 * 料金管理API
 * 管理者による動的料金設定の管理を担当
 */

/**
 * Retrieves current pricing configuration for admin management
 * 
 * @returns JSON response with editable pricing configuration
 * 
 * Security:
 * - Requires user authentication
 * - Requires admin role authorization
 * 
 * Response Format:
 * {
 *   personalRates: Object,    // Guest pricing by age group and day type
 *   roomRates: Object,        // Room pricing by room type
 *   addonRates: Object,       // Add-on service pricing
 *   peakMonths: number[],     // Peak season months
 *   configName: string,       // Configuration identifier
 *   version: string,          // Version information
 *   lastUpdated: string       // Last modification timestamp
 * }
 * 
 * Error Responses:
 * - 401: Authentication required
 * - 403: Admin privileges required
 * - 500: Server error during config retrieval
 */
export async function GET() {
  try {
    const supabase = createClient()
    
    // 管理者権限チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 })
    }

    // 現在の設定を取得
    const config = await PriceConfigService.getEditableConfig()
    
    return NextResponse.json(config)

  } catch (error) {
    console.error("Error fetching pricing config:", error)
    return NextResponse.json(
      { error: "料金設定の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * Updates and applies new pricing configuration
 * 
 * @param request - Next.js request object containing new pricing configuration
 * @returns JSON response confirming successful update or error details
 * 
 * Security:
 * - Requires user authentication
 * - Requires admin role authorization
 * 
 * Request Body Format:
 * {
 *   personalRates: {
 *     shared: { adult: {...}, student: {...}, ... },
 *     private: { adult: {...}, student: {...}, ... }
 *   },
 *   roomRates: { large: number, medium_a: number, ... },
 *   addonRates: { meal: {...}, facility: {...}, equipment: {...} },
 *   peakMonths: number[],
 *   configName: string,
 *   version: string
 * }
 * 
 * Validation:
 * - All rate values must be non-negative numbers
 * - Peak months must be valid (1-12)
 * - Configuration structure must match expected schema
 * 
 * Side Effects:
 * - Saves configuration to database
 * - Clears pricing calculation cache
 * - Updates configuration version and timestamp
 * 
 * Error Responses:
 * - 401: Authentication required
 * - 403: Admin privileges required
 * - 400: Invalid configuration data
 * - 500: Server error during update
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 管理者権限チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 })
    }

    const body = await request.json()
    const config: EditableConfig = body

    // バリデーション
    if (!PriceConfigService.validateConfig(config)) {
      return NextResponse.json(
        { error: "無効な設定が指定されました" },
        { status: 400 }
      )
    }

    // 設定更新
    await PriceConfigService.updateEditableConfig(config)

    // 計算エンジンのキャッシュ更新
    await PriceCalculator.refreshRateConfig()

    return NextResponse.json({ 
      success: true, 
      message: "料金設定が正常に更新されました" 
    })

  } catch (error) {
    console.error("Error updating pricing config:", error)
    return NextResponse.json(
      { error: "料金設定の更新に失敗しました" },
      { status: 500 }
    )
  }
}