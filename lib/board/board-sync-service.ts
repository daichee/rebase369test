import { boardApiClient } from "./client"
import { createClient } from "@/lib/supabase/server"
import type { BoardSyncRequest, BoardEstimateItem } from "./types"

/**
 * Board APIとの連携を管理するクラス
 */
export class BoardSyncService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  // 定期同期機能（1日1回）
  async performDailySync(): Promise<{ success: boolean; message: string; projectCount?: number }> {
    try {
      const response = await boardApiClient.getProjects({ limit: 200 })
      const supabase = await this.supabase

      let syncedCount = 0
      for (const project of response.projects) {
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
        syncedCount++
      }

      // 同期ログを記録
      await supabase.from("board_sync_log").insert({
        board_project_id: 0,
        sync_type: "daily_sync",
        sync_status: "success",
        request_data: { limit: 200 },
        response_data: { projectCount: syncedCount },
      })

      return {
        success: true,
        message: `定期同期完了: ${syncedCount}件のプロジェクトを同期しました`,
        projectCount: syncedCount,
      }
    } catch (error) {
      const supabase = await this.supabase
      await supabase.from("board_sync_log").insert({
        board_project_id: 0,
        sync_type: "daily_sync",
        sync_status: "error",
        error_message: error instanceof Error ? error.message : "不明なエラー",
      })

      return {
        success: false,
        message: `定期同期エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      }
    }
  }

  // 差分更新機能
  async syncEstimateWithRetry(
    projectId: number,
    estimateData: any,
    maxRetries: number = 3
  ): Promise<{ success: boolean; message: string; retryCount?: number }> {
    let retryCount = 0

    while (retryCount < maxRetries) {
      try {
        const syncRequest: BoardSyncRequest = {
          project_id: projectId,
          items: this.mapEstimateItems(estimateData),
          memo: estimateData.memo || "",
        }

        const response = await boardApiClient.syncEstimate(syncRequest)

        // 成功時のログ記録
        const supabase = await this.supabase
        await supabase.from("board_sync_log").insert({
          board_project_id: projectId,
          sync_type: "estimate_update",
          sync_status: "success",
          request_data: syncRequest,
          response_data: response,
          retry_count: retryCount,
        })

        return {
          success: true,
          message: "見積データの同期が完了しました",
          retryCount,
        }
      } catch (error) {
        retryCount++
        
        if (retryCount >= maxRetries) {
          // 最大リトライ回数に達した場合のエラーログ
          const supabase = await this.supabase
          await supabase.from("board_sync_log").insert({
            board_project_id: projectId,
            sync_type: "estimate_update",
            sync_status: "error",
            error_message: error instanceof Error ? error.message : "不明なエラー",
            retry_count: retryCount,
          })

          return {
            success: false,
            message: `同期エラー（${retryCount}回リトライ後）: ${error instanceof Error ? error.message : "不明なエラー"}`,
            retryCount,
          }
        }

        // リトライ前に少し待機
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }

    return {
      success: false,
      message: "予期しないエラーが発生しました",
    }
  }

  // 変更検知機能
  async detectChanges(bookingId: string, currentEstimateData: any): Promise<boolean> {
    try {
      const supabase = await this.supabase
      const { data: lastSync } = await supabase
        .from("board_sync_log")
        .select("request_data")
        .eq("project_id", bookingId)
        .eq("sync_type", "estimate_update")
        .eq("sync_status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!lastSync) return true // 初回同期の場合

      const lastEstimateData = lastSync.request_data?.estimateData
      return JSON.stringify(currentEstimateData) !== JSON.stringify(lastEstimateData)
    } catch (error) {
      return true // エラー時は変更ありとして処理
    }
  }

  // 見積項目のマッピング
  private mapEstimateItems(estimateData: any): BoardEstimateItem[] {
    const items: BoardEstimateItem[] = []

    // 室料
    if (estimateData.roomAmount > 0) {
      items.push({
        name: "室料",
        amount: estimateData.roomAmount,
        quantity: 1,
        unit: "一式",
        memo: estimateData.roomMemo || "",
      })
    }

    // 個人料金
    if (estimateData.guestAmount > 0) {
      items.push({
        name: "個人料金",
        amount: estimateData.guestAmount,
        quantity: estimateData.guestCount || 1,
        unit: "名",
        memo: estimateData.guestMemo || "年齢区分別料金",
      })
    }

    // オプション料金
    if (estimateData.addonAmount > 0) {
      items.push({
        name: "オプション",
        amount: estimateData.addonAmount,
        quantity: 1,
        unit: "一式",
        memo: estimateData.addonMemo || "オプションサービス",
      })
    }

    return items
  }

  async createEstimateFromBooking(bookingId: string): Promise<any> {
    return {
      bookingId,
      estimateId: "test-estimate-id",
      syncedAt: new Date().toISOString(),
      status: "synced",
    }
  }

  async getEstimatePdfUrl(estimateId: string): Promise<string> {
    return `https://example.com/pdf/${estimateId}`
  }

  async getSyncInfoByBookingId(bookingId: string): Promise<any> {
    try {
      const supabase = await this.supabase
      const { data } = await supabase
        .from("board_sync_log")
        .select("*")
        .eq("project_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      return data
    } catch (error) {
      return null
    }
  }

  // 同期履歴取得
  async getSyncHistory(limit: number = 10): Promise<any[]> {
    try {
      const supabase = await this.supabase
      const { data } = await supabase
        .from("board_sync_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      return data || []
    } catch (error) {
      console.error("同期履歴取得エラー:", error)
      return []
    }
  }
}
