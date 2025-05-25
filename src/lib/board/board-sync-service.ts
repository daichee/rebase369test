import { BoardApiService } from "./board-api"
import { EstimateConverter } from "./estimate-converter"
import type { BoardApiConfig, BoardSyncInfo, CreateCustomerRequest } from "./types"
import { supabase } from "../supabase/client"

/**
 * Board APIとの連携を管理するクラス
 */
export class BoardSyncService {
  private boardApi: BoardApiService

  constructor(config: BoardApiConfig) {
    this.boardApi = new BoardApiService(config)
  }

  /**
   * 予約データからBoard見積もりを作成する
   */
  async createEstimateFromBooking(bookingId: string): Promise<BoardSyncInfo> {
    try {
      // 予約データを取得
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single()

      if (bookingError || !booking) {
        throw new Error(`予約データの取得に失敗しました: ${bookingError?.message || "データが見つかりません"}`)
      }

      // 顧客データを取得
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", booking.customerId)
        .single()

      if (customerError || !customer) {
        throw new Error(`顧客データの取得に失敗しました: ${customerError?.message || "データが見つかりません"}`)
      }

      // Board上の顧客を検索または作成
      const boardCustomerId = await this.findOrCreateCustomer(customer)

      // 見積もりデータを作成
      const estimateRequest = EstimateConverter.bookingToCreateEstimateRequest(booking, boardCustomerId)
      const estimateResponse = await this.boardApi.createEstimate(estimateRequest)

      // 連携情報を保存
      const syncInfo: BoardSyncInfo = {
        bookingId,
        estimateId: estimateResponse.data.id,
        syncedAt: new Date().toISOString(),
        status: "synced",
      }

      await this.saveSyncInfo(syncInfo)

      return syncInfo
    } catch (error) {
      console.error("Board見積もり作成エラー:", error)

      // エラー情報を保存
      const syncInfo: BoardSyncInfo = {
        bookingId,
        estimateId: "",
        syncedAt: new Date().toISOString(),
        status: "error",
        errorMessage: error instanceof Error ? error.message : "不明なエラー",
      }

      await this.saveSyncInfo(syncInfo)

      throw error
    }
  }

  /**
   * 顧客データをBoardに検索または作成する
   */
  private async findOrCreateCustomer(customer: any): Promise<string> {
    try {
      // まず顧客を名前で検索
      const customersResponse = await this.boardApi.getCustomers(1, 10)
      const existingCustomer = customersResponse.data.find(
        (c) => c.name === customer.name || c.email === customer.email,
      )

      if (existingCustomer) {
        return existingCustomer.id
      }

      // 顧客が見つからない場合は新規作成
      const createRequest: CreateCustomerRequest = {
        name: customer.name,
        name_kana: customer.nameKana || "",
        postal_code: customer.postalCode || "",
        address: customer.address || "",
        tel: customer.phone || "",
        email: customer.email || "",
        person_name: customer.representative || customer.name,
        memo: customer.notes || "",
      }

      const createResponse = await this.boardApi.createCustomer(createRequest)
      return createResponse.data.id
    } catch (error) {
      console.error("Board顧客検索/作成エラー:", error)
      throw error
    }
  }

  /**
   * 連携情報を保存する
   */
  private async saveSyncInfo(syncInfo: BoardSyncInfo): Promise<void> {
    try {
      // 既存の連携情報を確認
      const { data: existingSync } = await supabase
        .from("board_sync_info")
        .select("*")
        .eq("bookingId", syncInfo.bookingId)
        .single()

      if (existingSync) {
        // 既存データを更新
        await supabase
          .from("board_sync_info")
          .update({
            estimateId: syncInfo.estimateId,
            syncedAt: syncInfo.syncedAt,
            status: syncInfo.status,
            errorMessage: syncInfo.errorMessage,
          })
          .eq("bookingId", syncInfo.bookingId)
      } else {
        // 新規データを作成
        await supabase.from("board_sync_info").insert([syncInfo])
      }
    } catch (error) {
      console.error("連携情報保存エラー:", error)
    }
  }

  /**
   * 見積もりPDFのURLを取得する
   */
  async getEstimatePdfUrl(estimateId: string): Promise<string> {
    return this.boardApi.getEstimatePdfUrl(estimateId)
  }

  /**
   * 予約に紐づく見積もり情報を取得する
   */
  async getSyncInfoByBookingId(bookingId: string): Promise<BoardSyncInfo | null> {
    try {
      const { data, error } = await supabase.from("board_sync_info").select("*").eq("bookingId", bookingId).single()

      if (error) {
        console.error("連携情報取得エラー:", error)
        return null
      }

      return data as BoardSyncInfo
    } catch (error) {
      console.error("連携情報取得エラー:", error)
      return null
    }
  }
}
