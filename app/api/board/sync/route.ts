import { type NextRequest, NextResponse } from "next/server"
import { boardApiClient } from "@/lib/board/client"
import type { BoardSyncRequest } from "@/lib/board/types"

export async function POST(request: NextRequest) {
  try {
    const syncRequest: BoardSyncRequest = await request.json()

    // リクエストデータの検証
    if (!syncRequest.project_id || !syncRequest.items || syncRequest.items.length === 0) {
      return NextResponse.json({ error: "必要なデータが不足しています" }, { status: 400 })
    }

    const result = await boardApiClient.syncEstimate(syncRequest)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Board sync API error:", error)
    return NextResponse.json({ error: "Board同期に失敗しました" }, { status: 500 })
  }
}
