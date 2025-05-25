import { type NextRequest, NextResponse } from "next/server"
import { BoardSyncService } from "@/lib/board/board-sync-service"
import { z } from "zod"

// 環境変数からBoard API設定を取得
const boardApiConfig = {
  apiKey: process.env.BOARD_API_KEY || "",
  apiToken: process.env.BOARD_API_TOKEN || "",
  baseUrl: process.env.BOARD_API_URL || "https://api.the-board.jp/v1",
}

// リクエストスキーマ
const syncRequestSchema = z.object({
  bookingId: z.string().uuid(),
})

// 見積もり同期APIエンドポイント
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json()

    // バリデーション
    const result = syncRequestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request", details: result.error.format() }, { status: 400 })
    }

    // Board同期サービスを初期化
    const boardSyncService = new BoardSyncService(boardApiConfig)

    // 見積もりを作成
    const syncInfo = await boardSyncService.createEstimateFromBooking(result.data.bookingId)

    return NextResponse.json({ success: true, data: syncInfo })
  } catch (error) {
    console.error("Board同期エラー:", error)
    return NextResponse.json(
      { error: "Sync failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// 見積もり同期状態取得APIエンドポイント
export async function GET(request: NextRequest) {
  try {
    // URLからbookingIdを取得
    const url = new URL(request.url)
    const bookingId = url.searchParams.get("bookingId")

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId parameter" }, { status: 400 })
    }

    // Board同期サービスを初期化
    const boardSyncService = new BoardSyncService(boardApiConfig)

    // 同期情報を取得
    const syncInfo = await boardSyncService.getSyncInfoByBookingId(bookingId)

    if (!syncInfo) {
      return NextResponse.json({ error: "Sync info not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: syncInfo })
  } catch (error) {
    console.error("同期情報取得エラー:", error)
    return NextResponse.json(
      { error: "Failed to get sync info", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
