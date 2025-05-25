/**
 * Board API連携用の型定義
 */

// Board API認証情報
export interface BoardApiConfig {
  apiKey: string
  apiToken: string
  baseUrl: string
}

// 見積もり関連の型定義
export interface BoardEstimate {
  id: string
  number: string
  title: string
  issue_date: string
  expire_date: string
  customer_id: string
  customer_name: string
  customer_address: string
  customer_tel: string
  customer_email: string
  memo: string
  subtotal_amount: number
  tax_amount: number
  total_amount: number
  status: "draft" | "sent" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

// 見積もり項目の型定義
export interface BoardEstimateItem {
  id: string
  estimate_id: string
  sort_no: number
  title: string
  unit_price: number
  quantity: number
  unit: string
  tax_rate: number
  tax_type: "included" | "excluded"
  description: string
  subtotal_amount: number
}

// 顧客情報の型定義
export interface BoardCustomer {
  id: string
  number: string
  name: string
  name_kana: string
  short_name: string
  postal_code: string
  address: string
  tel: string
  fax: string
  email: string
  person_name: string
  person_kana: string
  person_title: string
  person_email: string
  person_tel: string
  memo: string
  created_at: string
  updated_at: string
}

// 見積もり作成リクエスト
export interface CreateEstimateRequest {
  title: string
  issue_date: string
  expire_date: string
  customer_id: string
  memo?: string
  items: {
    title: string
    unit_price: number
    quantity: number
    unit: string
    tax_rate: number
    tax_type: "included" | "excluded"
    description?: string
  }[]
}

// 見積もり更新リクエスト
export interface UpdateEstimateRequest {
  title?: string
  issue_date?: string
  expire_date?: string
  customer_id?: string
  memo?: string
  status?: "draft" | "sent" | "approved" | "rejected"
}

// 見積もり項目更新リクエスト
export interface UpdateEstimateItemRequest {
  sort_no?: number
  title?: string
  unit_price?: number
  quantity?: number
  unit?: string
  tax_rate?: number
  tax_type?: "included" | "excluded"
  description?: string
}

// 顧客作成リクエスト
export interface CreateCustomerRequest {
  name: string
  name_kana?: string
  short_name?: string
  postal_code?: string
  address?: string
  tel?: string
  fax?: string
  email?: string
  person_name?: string
  person_kana?: string
  person_title?: string
  person_email?: string
  person_tel?: string
  memo?: string
}

// APIレスポンス型
export interface BoardApiResponse<T> {
  data: T
  status: number
  message: string
}

// ページネーション付きレスポンス
export interface BoardPaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    from: number
    last_page: number
    path: string
    per_page: number
    to: number
    total: number
  }
}

// 見積もりと予約の連携情報
export interface BoardSyncInfo {
  bookingId: string
  estimateId: string
  syncedAt: string
  status: "synced" | "pending" | "error"
  errorMessage?: string
}
