import { type NextRequest, NextResponse } from "next/server"
import { BoardSyncService } from "@/lib/board/board-sync-service"

// 環境変数からBoard API設定を取得
const boardApiConfig = {
  apiKey: process.env.BOARD_API_KEY || "",
  apiToken: process.env.BOARD_API_TOKEN || "",
  baseUrl: process.env.BOARD_API_URL || "https://api.the-board.jp/v1",
}

// 見積もりPDF取得APIエンドポイント
export async function GET(request: NextRequest) {
  try {
    // URLからestimateIdを取得
    const url = new URL(request.url)
    const estimateId = url.searchParams.get("estimateId")

    if (!estimateId) {
      return NextResponse.json({ error: "Missing estimateId parameter" }, { status: 400 })
    }

    // Board同期サービスを初期化
    const boardSyncService = new BoardSyncService(boardApiConfig)

    // PDFのURLを取得
    const pdfUrl = await boardSyncService.getEstimatePdfUrl(estimateId)

    return NextResponse.json({ success: true, data: { url: pdfUrl } })
  } catch (error) {
    console.error("PDF URL取得エラー:", error)
    return NextResponse.json(
      { error: "Failed to get PDF URL", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
