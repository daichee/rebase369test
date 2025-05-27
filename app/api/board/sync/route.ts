import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { boardApiClient } from "@/lib/board/client"
import { BoardSyncService } from "@/lib/board/board-sync-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const syncService = new BoardSyncService()

    // アクションタイプに応じて処理を分岐
    if (body.action === "update_estimate") {
      // 見積同期処理（リトライ機能付き）
      const { boardProjectId, priceBreakdown, bookingDetails } = body

      const estimateData = {
        roomAmount: priceBreakdown.roomAmount,
        guestAmount: priceBreakdown.guestAmount,
        addonAmount: priceBreakdown.addonAmount,
        total: priceBreakdown.total,
        roomMemo: `部屋: ${bookingDetails.selectedRooms?.map((r: any) => r.name).join(', ') || ''}`,
        guestMemo: `予約者: ${bookingDetails.guestName}`,
        addonMemo: 'オプションサービス',
        memo: `期間: ${bookingDetails.dateRange?.startDate} - ${bookingDetails.dateRange?.endDate}`,
      }

      // 変更検知
      const hasChanges = await syncService.detectChanges(bookingDetails.id, estimateData)
      if (!hasChanges) {
        return NextResponse.json({
          success: true,
          message: "見積データに変更がないため、同期をスキップしました",
          syncId: `estimate_skip_${Date.now()}`,
        })
      }

      // リトライ付き同期実行
      const result = await syncService.syncEstimateWithRetry(boardProjectId, estimateData)

      return NextResponse.json({
        ...result,
        syncId: `estimate_sync_${Date.now()}`,
      })
    } else if (body.action === "daily_sync") {
      // 定期同期処理
      const result = await syncService.performDailySync()
      return NextResponse.json(result)
    } else {
      // 手動プロジェクト一覧同期
      const boardProjects = await fetchBoardProjects()

      // board_projectsテーブルを更新
      for (const project of boardProjects) {
        await supabase
          .from("board_projects")
          .upsert({
            board_project_id: project.id,
            project_no: project.project_no,
            client_name: project.client_name,
            title: project.title,
            status: project.status,
            estimate_amount: project.estimate_amount,
            last_synced_at: new Date().toISOString(),
            is_active: true,
          })
      }

      // 同期ログを記録
      await supabase.from("board_sync_log").insert({
        board_project_id: 0,
        sync_type: "manual_project_sync",
        sync_status: "success",
        request_data: body,
        response_data: { projectCount: boardProjects.length },
      })

      return NextResponse.json({
        success: true,
        message: `${boardProjects.length}件のプロジェクトを同期しました`,
        syncId: `project_sync_${Date.now()}`,
      })
    }
  } catch (error) {
    console.error("Board sync error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Board同期中にエラーが発生しました",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Board API呼び出し関数
async function syncEstimateToBoard(params: {
  projectId: number
  estimateData: any
  bookingInfo: any
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Board APIに見積明細を送信
    const syncRequest = {
      project_id: params.projectId,
      items: [
        {
          name: '室料',
          amount: params.estimateData.roomAmount,
          quantity: 1,
          unit: '一式',
          memo: `部屋: ${params.bookingInfo.rooms?.map((r: any) => r.name).join(', ') || ''}`,
        },
        {
          name: '個人料金',
          amount: params.estimateData.guestAmount,
          quantity: 1,
          unit: '一式',
          memo: '年齢区分別料金',
        },
        {
          name: 'オプション',
          amount: params.estimateData.addonAmount,
          quantity: 1,
          unit: '一式',
          memo: 'オプションサービス',
        },
      ],
      memo: `予約者: ${params.bookingInfo.guestName}\n期間: ${params.bookingInfo.dates?.startDate} - ${params.bookingInfo.dates?.endDate}`,
    }

    const response = await boardApiClient.syncEstimate(syncRequest)
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Board API同期エラー" 
    }
  }
}

async function fetchBoardProjects(): Promise<any[]> {
  try {
    // 実際のBoard APIからプロジェクト一覧を取得
    const response = await boardApiClient.getProjects({
      limit: 200, // 最大200件取得
    })
    
    return response.projects || []
  } catch (error) {
    console.error("Board projects fetch error:", error)
    // エラー時は空配列を返す
    return []
  }
}
