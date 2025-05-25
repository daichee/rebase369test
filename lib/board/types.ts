// Board API関連の型定義
export interface BoardProject {
  id: number
  project_no: number
  client_name: string
  title: string
  status: "draft" | "active" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  estimate_amount?: number
  client_info?: {
    company?: string
    contact_person?: string
    email?: string
    phone?: string
  }
}

export interface BoardEstimate {
  id: number
  project_id: number
  estimate_no: string
  status: "draft" | "sent" | "approved" | "rejected"
  total_amount: number
  items: BoardEstimateItem[]
  created_at: string
  updated_at: string
}

export interface BoardEstimateItem {
  id?: number
  item_code: string
  item_name: string
  category: string
  quantity: number
  unit: string
  unit_price: number
  amount: number
  description?: string
  sort_order?: number
}

export interface BoardSyncRequest {
  project_id: number
  estimate_id?: number
  items: BoardEstimateItem[]
  sync_type: "create" | "update" | "replace"
}

export interface BoardSyncResponse {
  success: boolean
  estimate_id?: number
  message?: string
  errors?: string[]
  synced_items?: BoardEstimateItem[]
}

export interface BoardApiError {
  code: string
  message: string
  details?: any
}

// 予約システムからBoard APIへのマッピング用
export interface BookingToBoard {
  booking_id: string
  board_project_id: number
  room_items: BoardEstimateItem[]
  guest_items: BoardEstimateItem[]
  addon_items: BoardEstimateItem[]
  total_amount: number
}
