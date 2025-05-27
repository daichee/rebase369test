import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { boardApiClient } from "@/lib/board/client"
import { BoardSyncService } from "@/lib/board/board-sync-service"

// Board案件一覧の定期同期API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === "daily_sync") {
      // 定期同期実行
      const syncService = new BoardSyncService()
      const result = await syncService.performDailySync()

      return NextResponse.json(result)
    } else if (action === "fetch_projects") {
      // 手動でBoard案件を取得
      const { client_name, status, date_from, date_to, limit = 50 } = body

      const params = {
        client_name: client_name || undefined,
        status: status !== "all" ? status : undefined,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
        limit,
      }

      const response = await boardApiClient.getProjects(params)

      return NextResponse.json({
        success: true,
        projects: response.projects,
        total: response.total,
      })
    }

    return NextResponse.json(
      { success: false, message: "無効なアクションです" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Board projects API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Board案件APIでエラーが発生しました",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Board案件一覧の取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const client_name = searchParams.get("client_name")
    const status = searchParams.get("status")
    const date_from = searchParams.get("date_from")
    const date_to = searchParams.get("date_to")
    const limit = parseInt(searchParams.get("limit") || "50")
    const includeLocal = searchParams.get("include_local") === "true"

    if (includeLocal) {
      // ローカルDBからキャッシュされた案件を取得
      const supabase = createClient()
      const query = supabase
        .from("board_projects")
        .select("*")
        .eq("is_active", true)
        .order("last_synced_at", { ascending: false })

      if (client_name) {
        query.ilike("client_name", `%${client_name}%`)
      }
      if (status && status !== "all") {
        query.eq("status", status)
      }
      if (limit) {
        query.limit(limit)
      }

      const { data: projects, error } = await query

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        projects: projects || [],
        total: projects?.length || 0,
        source: "local_cache",
      })
    } else {
      // Board APIから直接取得
      const params = {
        client_name: client_name || undefined,
        status: status !== "all" ? status : undefined,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
        limit,
      }

      const response = await boardApiClient.getProjects(params)

      return NextResponse.json({
        success: true,
        projects: response.projects,
        total: response.total,
        source: "board_api",
      })
    }
  } catch (error) {
    console.error("Board projects GET error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Board案件の取得に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}