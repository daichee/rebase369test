import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { boardApiClient } from "@/lib/board/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

    // アクションタイプに応じて処理を分岐
    if (body.action === "update_estimate") {
      // 見積同期処理
      const { boardProjectId, priceBreakdown, bookingDetails } = body

      // 実際のBoard API呼び出し（プレースホルダー）
      const boardResponse = await syncEstimateToBoard({
        projectId: boardProjectId,
        estimateData: {
          roomAmount: priceBreakdown.roomAmount,
          guestAmount: priceBreakdown.guestAmount,
          addonAmount: priceBreakdown.addonAmount,
          total: priceBreakdown.total,
          dailyBreakdown: priceBreakdown.dailyBreakdown,
        },
        bookingInfo: {
          guestName: bookingDetails.guestName,
          dates: bookingDetails.dateRange,
          rooms: bookingDetails.selectedRooms,
        },
      })

      // 同期ログを記録
      await supabase.from("board_sync_log").insert({
        project_id: bookingDetails.id,
        board_project_id: boardProjectId,
        sync_type: "estimate_update",
        sync_status: boardResponse.success ? "success" : "error",
        request_data: body,
        response_data: boardResponse,
        error_message: boardResponse.success ? null : boardResponse.error,
      })

      return NextResponse.json({
        success: boardResponse.success,
        message: boardResponse.success
          ? "見積データの同期が完了しました"
          : `同期エラー: ${boardResponse.error}`,
        syncId: `estimate_sync_${Date.now()}`,
      })
    } else {
      // プロジェクト一覧同期
      const boardProjects = await fetchBoardProjects()

      // board_projectsテーブルを更新
      for (const project of boardProjects) {
        await supabase
          .from("board_projects")
          .upsert({
            board_project_id: project.id,
            project_no: project.projectNo,
            client_name: project.clientName,
            title: project.title,
            status: project.status,
            last_synced_at: new Date().toISOString(),
            is_active: true,
          })
      }

      // 同期ログを記録
      await supabase.from("board_sync_log").insert({
        board_project_id: 0, // 全体同期なのでプロジェクト固有IDなし
        sync_type: "project_list",
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
      limit: 100, // 最大100件取得
    })
    
    return response.projects || []
  } catch (error) {
    console.error("Board projects fetch error:", error)
    // エラー時は空配列を返す
    return []
  }
}
