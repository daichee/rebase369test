import { useNotification } from "@/components/common/notification-provider"
import type { ApiError } from "@/lib/utils/api-error-handler"

export interface ApiResponse<T = any> {
  data?: T
  error?: ApiError
}

export function useApiErrorHandler() {
  const { addNotification } = useNotification()

  const handleApiError = (error: ApiError | unknown, fallbackMessage?: string) => {
    let title = "エラー"
    let message = fallbackMessage || "予期しないエラーが発生しました"

    if (error && typeof error === "object" && "code" in error) {
      const apiError = error as ApiError
      message = apiError.message

      // エラータイプに応じてタイトルを設定
      switch (apiError.code) {
        case "VALIDATION_ERROR":
          title = "入力エラー"
          break
        case "NOT_FOUND":
          title = "データが見つかりません"
          break
        case "CONFLICT":
          title = "競合エラー"
          break
        case "CALCULATION_ERROR":
          title = "計算エラー"
          break
        case "SERVER_ERROR":
          title = "サーバーエラー"
          break
      }
    }

    addNotification({
      type: "error",
      title,
      message,
      duration: 8000, // エラーは少し長めに表示
    })
  }

  const handleApiSuccess = (message: string, title: string = "成功") => {
    addNotification({
      type: "success",
      title,
      message,
      duration: 4000,
    })
  }

  const handleApiWarning = (message: string, title: string = "注意") => {
    addNotification({
      type: "warning",
      title,
      message,
      duration: 6000,
    })
  }

  const handleApiInfo = (message: string, title: string = "情報") => {
    addNotification({
      type: "info",
      title,
      message,
      duration: 5000,
    })
  }

  // API呼び出しをラップして自動的にエラーハンドリングを行う関数
  const withErrorHandling = async <T>(
    apiCall: () => Promise<Response>,
    options?: {
      successMessage?: string
      errorMessage?: string
      showSuccessNotification?: boolean
    }
  ): Promise<T | null> => {
    try {
      const response = await apiCall()
      const data = await response.json()

      if (!response.ok) {
        handleApiError(data.error, options?.errorMessage)
        return null
      }

      if (options?.showSuccessNotification && options?.successMessage) {
        handleApiSuccess(options.successMessage)
      }

      return data as T
    } catch (error) {
      console.error("API call failed:", error)
      handleApiError(
        error,
        options?.errorMessage || "ネットワークエラーが発生しました"
      )
      return null
    }
  }

  return {
    handleApiError,
    handleApiSuccess,
    handleApiWarning,
    handleApiInfo,
    withErrorHandling,
  }
}

// フォールバック機能付きのデータフェッチャー
export function createApiFetcher<T>(
  endpoint: string,
  fallbackData?: T
) {
  return async (params?: Record<string, string>): Promise<T | null> => {
    const url = new URL(endpoint, window.location.origin)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    try {
      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        console.warn("API request failed, using fallback data:", data.error)
        return fallbackData || null
      }

      return data as T
    } catch (error) {
      console.error("Network error, using fallback data:", error)
      return fallbackData || null
    }
  }
}