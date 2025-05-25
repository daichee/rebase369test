import type { BoardProject, BoardEstimate, BoardSyncRequest, BoardSyncResponse, BoardEstimateItem } from "./types"

class BoardApiClient {
  private baseUrl: string
  private apiKey: string
  private token: string

  constructor() {
    this.baseUrl = process.env.BOARD_API_URL || ""
    this.apiKey = process.env.BOARD_API_KEY || ""
    this.token = process.env.BOARD_API_TOKEN || ""
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
      "X-API-Key": this.apiKey,
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Board API Error: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Board API request failed:", error)
      throw error
    }
  }

  // Board案件一覧取得
  async getProjects(params?: {
    client_name?: string
    status?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
  }): Promise<{ projects: BoardProject[]; total: number }> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/api/projects${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    return this.request<{ projects: BoardProject[]; total: number }>(endpoint)
  }

  // 特定案件の詳細取得
  async getProject(projectId: number): Promise<BoardProject> {
    return this.request<BoardProject>(`/api/projects/${projectId}`)
  }

  // 案件の見積もり一覧取得
  async getEstimates(projectId: number): Promise<BoardEstimate[]> {
    return this.request<BoardEstimate[]>(`/api/projects/${projectId}/estimates`)
  }

  // 見積もり詳細取得
  async getEstimate(projectId: number, estimateId: number): Promise<BoardEstimate> {
    return this.request<BoardEstimate>(`/api/projects/${projectId}/estimates/${estimateId}`)
  }

  // 見積もり明細の同期
  async syncEstimate(request: BoardSyncRequest): Promise<BoardSyncResponse> {
    const endpoint = `/api/projects/${request.project_id}/estimates${
      request.estimate_id ? `/${request.estimate_id}` : ""
    }/sync`

    return this.request<BoardSyncResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(request),
    })
  }

  // 見積もり明細の一括更新
  async updateEstimateItems(
    projectId: number,
    estimateId: number,
    items: BoardEstimateItem[],
  ): Promise<BoardSyncResponse> {
    return this.request<BoardSyncResponse>(`/api/projects/${projectId}/estimates/${estimateId}/items`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    })
  }

  // Board書類編集ページのURL生成
  getEditUrl(projectId: number, documentType: "estimate" | "invoice" = "estimate"): string {
    return `${this.baseUrl}/projects/${projectId}/${documentType}/edit`
  }

  // 接続テスト
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request<any>("/api/health")
      return { success: true, message: "Board API接続成功" }
    } catch (error) {
      return {
        success: false,
        message: `Board API接続失敗: ${error instanceof Error ? error.message : "不明なエラー"}`,
      }
    }
  }
}

export const boardApiClient = new BoardApiClient()
