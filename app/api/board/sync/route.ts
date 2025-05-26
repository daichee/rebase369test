import { type NextRequest, NextResponse } from "next/server"
import { boardApiClient } from "@/lib/board/client"
import type { BoardSyncRequest } from "@/lib/board/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { boardProjectId, estimateData } = body

    // 見積同期の場合
    if (boardProjectId && estimateData) {
      // 見積データをBoard形式に変換
      const boardItems = estimateData.items.map((item: any) => ({
        item_name: item.itemName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: item.amount,
        category: item.category
      }))

      const syncRequest: BoardSyncRequest = {
        project_id: boardProjectId,
        items: boardItems,
        total_amount: estimateData.totalAmount,
        sync_type: "estimate_update"
      }

      const result = await boardApiClient.syncEstimate(syncRequest)
      return NextResponse.json(result)
    }

    // 通常の同期リクエストの場合
    const syncRequest: BoardSyncRequest = body

    // リクエストデータの検証
    if (!syncRequest.project_id || !syncRequest.items || syncRequest.items.length === 0) {
      return NextResponse.json({ error: "必要なデータが不足しています" }, { status: 400 })
    }

    const result = await boardApiClient.syncEstimate(syncRequest)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Board sync API error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Board同期に失敗しました",
      details: String(error) 
    }, { status: 500 })
  }
}
