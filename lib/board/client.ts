import type { BoardProject, BoardEstimate, BoardSyncRequest, BoardSyncResponse, BoardEstimateItem } from "./types"

class BoardApiClient {
  private baseUrl: string
  private apiKey: string
  private token: string

  constructor() {
    this.baseUrl = process.env.BOARD_API_URL || "https://api.the-board.jp/v1"
    this.apiKey = process.env.BOARD_API_KEY || ""
    this.token = process.env.BOARD_API_TOKEN || ""
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.token}`,
      "x-api-key": this.apiKey,
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

    const endpoint = `/projects${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    return this.request<{ projects: BoardProject[]; total: number }>(endpoint)
  }

  // 特定案件の詳細取得
  async getProject(projectId: number): Promise<BoardProject> {
    return this.request<BoardProject>(`/projects/${projectId}`)
  }

  // 案件の見積もり一覧取得
  async getEstimates(projectId: number): Promise<BoardEstimate[]> {
    return this.request<BoardEstimate[]>(`/projects/${projectId}/estimates`)
  }

  // 見積もり詳細取得
  async getEstimate(projectId: number, estimateId: number): Promise<BoardEstimate> {
    return this.request<BoardEstimate>(`/projects/${projectId}/estimates/${estimateId}`)
  }

  // 見積もり明細の同期
  async syncEstimate(request: BoardSyncRequest): Promise<BoardSyncResponse> {
    const endpoint = `/projects/${request.project_id}/estimates${
      request.estimate_id ? `/${request.estimate_id}` : ""
    }/items`

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
    return this.request<BoardSyncResponse>(`/projects/${projectId}/estimates/${estimateId}/items`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    })
  }

  // 案件詳細取得（拡張版）
  async getProjectDetails(projectId: number): Promise<BoardProject | null> {
    try {
      const project = await this.getProject(projectId)
      const estimates = await this.getEstimates(projectId)
      
      return {
        ...project,
        estimates
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null
      }
      throw error
    }
  }

  // 案件の存在確認
  async checkProjectExists(projectId: number): Promise<boolean> {
    try {
      await this.getProject(projectId)
      return true
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return false
      }
      throw error
    }
  }

  // Board書類編集ページのURL生成（拡張版）
  generateEditUrl(projectId: number, documentType: "estimate" | "invoice" = "estimate"): string {
    const baseUrl = "https://the-board.jp"
    return `${baseUrl}/projects/${projectId}/${documentType}/edit`
  }

  // アクセストークン生成（仮想的な実装）
  async generateAccessToken(projectId: number): Promise<string> {
    // 実際のBoard APIにアクセストークン生成エンドポイントがある場合はそれを使用
    // ここでは仮想的な実装として既存のトークンを返す
    return `temp_${this.token}_${projectId}_${Date.now()}`
  }

  // Board書類編集ページのURL生成（レガシー互換性のため残す）
  getEditUrl(projectId: number, documentType: "estimate" | "invoice" = "estimate"): string {
    return this.generateEditUrl(projectId, documentType)
  }

  // 接続テスト
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Board APIは /projects エンドポイントで接続テスト
      await this.request<any>("/projects?limit=1")
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
export const BoardClient = BoardApiClient
