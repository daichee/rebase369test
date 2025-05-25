/**
 * Board APIとの連携を管理するクラス
 */
export class BoardSyncService {
  constructor(config: any) {
    // 簡素化された実装
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
    return null
  }
}
