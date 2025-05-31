import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * 料金設定履歴API
 * 料金設定の変更履歴を管理
 */

// GET /api/admin/pricing/history - 設定変更履歴取得
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    // 設定履歴を取得
    const { data: history, error } = await supabase
      .from("pricing_config")
      .select(`
        id,
        config_name,
        is_active,
        valid_from,
        valid_until,
        created_at,
        updated_at,
        created_by
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // 総数カウント
    const { count } = await supabase
      .from("pricing_config")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      data: history,
      total: count,
      hasMore: (count || 0) > offset + limit
    })

  } catch (error) {
    console.error("Error fetching pricing history:", error)
    return NextResponse.json(
      { error: "Failed to fetch pricing history" },
      { status: 500 }
    )
  }
}

// POST /api/admin/pricing/history/restore - 過去設定の復元
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
    const { configId }: { configId: string } = body

    if (!configId) {
      return NextResponse.json(
        { error: "Missing required parameter: configId" },
        { status: 400 }
      )
    }

    // 復元対象の設定を取得
    const { data: configToRestore, error: fetchError } = await supabase
      .from("pricing_config")
      .select("*")
      .eq("id", configId)
      .single()

    if (fetchError || !configToRestore) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      )
    }

    // 現在のアクティブ設定を無効化
    await supabase
      .from("pricing_config")
      .update({ is_active: false })
      .eq("is_active", true)

    // 新しい設定として復元（設定内容をコピーして新規作成）
    const { data: restoredConfig, error: restoreError } = await supabase
      .from("pricing_config")
      .insert({
        config_name: `${configToRestore.config_name}_restored_${Date.now()}`,
        config_data: configToRestore.config_data,
        is_active: true,
        valid_from: new Date().toISOString(),
        created_by: user.id
      })
      .select()
      .single()

    if (restoreError) {
      throw restoreError
    }

    return NextResponse.json({
      success: true,
      message: "Configuration restored successfully",
      restoredConfig
    })

  } catch (error) {
    console.error("Error restoring pricing config:", error)
    return NextResponse.json(
      { error: "Failed to restore pricing configuration" },
      { status: 500 }
    )
  }
}