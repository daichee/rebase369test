import type {
  BoardApiConfig,
  BoardApiResponse,
  BoardCustomer,
  BoardEstimate,
  BoardEstimateItem,
  BoardPaginatedResponse,
  CreateCustomerRequest,
  CreateEstimateRequest,
  UpdateEstimateItemRequest,
  UpdateEstimateRequest,
} from "./types"

/**
 * Board APIとの通信を行うクラス
 */
export class BoardApiService {
  private config: BoardApiConfig

  constructor(config: BoardApiConfig) {
    this.config = config
  }

  /**
   * APIリクエストを送信する
   */
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const headers = {
      "Content-Type": "application/json",
      "X-Api-Key": this.config.apiKey,
      Authorization: `Bearer ${this.config.apiToken}`,
    }

    const options: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Board API error: ${errorData.message || response.statusText}`)
      }

      return (await response.json()) as T
    } catch (error) {
      console.error("Board API request failed:", error)
      throw error
    }
  }

  /**
   * 見積もり一覧を取得する
   */
  async getEstimates(page = 1, perPage = 20): Promise<BoardPaginatedResponse<BoardEstimate>> {
    return this.request<BoardPaginatedResponse<BoardEstimate>>(`/estimates?page=${page}&per_page=${perPage}`)
  }

  /**
   * 見積もり詳細を取得する
   */
  async getEstimate(estimateId: string): Promise<BoardApiResponse<BoardEstimate>> {
    return this.request<BoardApiResponse<BoardEstimate>>(`/estimates/${estimateId}`)
  }

  /**
   * 見積もり項目一覧を取得する
   */
  async getEstimateItems(estimateId: string): Promise<BoardApiResponse<BoardEstimateItem[]>> {
    return this.request<BoardApiResponse<BoardEstimateItem[]>>(`/estimates/${estimateId}/items`)
  }

  /**
   * 見積もりを作成する
   */
  async createEstimate(data: CreateEstimateRequest): Promise<BoardApiResponse<BoardEstimate>> {
    return this.request<BoardApiResponse<BoardEstimate>>("/estimates", "POST", data)
  }

  /**
   * 見積もりを更新する
   */
  async updateEstimate(estimateId: string, data: UpdateEstimateRequest): Promise<BoardApiResponse<BoardEstimate>> {
    return this.request<BoardApiResponse<BoardEstimate>>(`/estimates/${estimateId}`, "PUT", data)
  }

  /**
   * 見積もり項目を更新する
   */
  async updateEstimateItem(
    estimateId: string,
    itemId: string,
    data: UpdateEstimateItemRequest,
  ): Promise<BoardApiResponse<BoardEstimateItem>> {
    return this.request<BoardApiResponse<BoardEstimateItem>>(`/estimates/${estimateId}/items/${itemId}`, "PUT", data)
  }

  /**
   * 顧客一覧を取得する
   */
  async getCustomers(page = 1, perPage = 20): Promise<BoardPaginatedResponse<BoardCustomer>> {
    return this.request<BoardPaginatedResponse<BoardCustomer>>(`/customers?page=${page}&per_page=${perPage}`)
  }

  /**
   * 顧客詳細を取得する
   */
  async getCustomer(customerId: string): Promise<BoardApiResponse<BoardCustomer>> {
    return this.request<BoardApiResponse<BoardCustomer>>(`/customers/${customerId}`)
  }

  /**
   * 顧客を作成する
   */
  async createCustomer(data: CreateCustomerRequest): Promise<BoardApiResponse<BoardCustomer>> {
    return this.request<BoardApiResponse<BoardCustomer>>("/customers", "POST", data)
  }

  /**
   * 見積書PDFのダウンロードURLを取得する
   */
  async getEstimatePdfUrl(estimateId: string): Promise<string> {
    const response = await this.request<BoardApiResponse<{ url: string }>>(`/estimates/${estimateId}/pdf`)
    return response.data.url
  }
}
