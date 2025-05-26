"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface BoardProject {
  boardProjectId: number
  projectNo: number
  clientName: string
  title?: string
  status: string
  lastSyncedAt: string
  isActive: boolean
}

export interface SyncResult {
  success: boolean
  message: string
  syncId?: string
}

export function useBoardProjects() {
  const [projects, setProjects] = useState<BoardProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("board_projects")
        .select("*")
        .eq("is_active", true)
        .order("project_no", { ascending: false })

      if (fetchError) throw fetchError

      setProjects(data || [])
      setLastSync(new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Board案件の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const syncWithBoard = async (): Promise<SyncResult> => {
    try {
      setLoading(true)
      setError(null)

      // Board API連携のAPI呼び出し
      const response = await fetch("/api/board/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`同期に失敗しました: ${response.statusText}`)
      }

      const result = await response.json()

      // 成功した場合、プロジェクト一覧を再取得
      if (result.success) {
        await fetchProjects()
      }

      return {
        success: result.success,
        message: result.message || "同期が完了しました",
        syncId: result.syncId,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Board同期に失敗しました"
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage,
      }
    } finally {
      setLoading(false)
    }
  }

  const syncEstimateToBoard = async (params: {
    boardProjectId: number
    priceBreakdown: any
    bookingDetails: any
  }): Promise<SyncResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/board/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_estimate",
          boardProjectId: params.boardProjectId,
          priceBreakdown: params.priceBreakdown,
          bookingDetails: params.bookingDetails,
        }),
      })

      if (!response.ok) {
        throw new Error(`見積同期に失敗しました: ${response.statusText}`)
      }

      const result = await response.json()

      // 同期ログを記録
      await logSyncActivity({
        projectId: params.bookingDetails.id,
        boardProjectId: params.boardProjectId,
        syncType: "estimate_update",
        syncStatus: result.success ? "success" : "error",
        requestData: params,
        responseData: result,
        errorMessage: result.success ? null : result.message,
      })

      return {
        success: result.success,
        message: result.message || "見積同期が完了しました",
        syncId: result.syncId,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "見積同期に失敗しました"
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage,
      }
    } finally {
      setLoading(false)
    }
  }

  const searchProjects = (searchTerm: string): BoardProject[] => {
    if (!searchTerm) return projects

    const term = searchTerm.toLowerCase()
    return projects.filter(
      (project) =>
        project.clientName.toLowerCase().includes(term) ||
        project.projectNo.toString().includes(term) ||
        project.title?.toLowerCase().includes(term)
    )
  }

  const getProjectById = (boardProjectId: number): BoardProject | undefined => {
    return projects.find((project) => project.boardProjectId === boardProjectId)
  }

  const getBoardEditUrl = (boardProjectId: number): string => {
    // Board書類編集ページのURL生成
    return `https://board.app/projects/${boardProjectId}/documents`
  }

  const logSyncActivity = async (params: {
    projectId?: string
    boardProjectId: number
    syncType: "estimate_update" | "project_list"
    syncStatus: "success" | "error" | "pending"
    requestData?: any
    responseData?: any
    errorMessage?: string | null
  }) => {
    try {
      await supabase.from("board_sync_log").insert({
        project_id: params.projectId || null,
        board_project_id: params.boardProjectId,
        sync_type: params.syncType,
        sync_status: params.syncStatus,
        request_data: params.requestData || null,
        response_data: params.responseData || null,
        error_message: params.errorMessage,
        sync_started_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error("同期ログの記録に失敗:", err)
    }
  }

  const getSyncHistory = async (projectId?: string) => {
    try {
      let query = supabase
        .from("board_sync_log")
        .select("*")
        .order("sync_started_at", { ascending: false })
        .limit(50)

      if (projectId) {
        query = query.eq("project_id", projectId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : "同期履歴の取得に失敗しました")
      return []
    }
  }

  return {
    projects,
    loading,
    error,
    lastSync,
    fetchProjects,
    syncWithBoard,
    syncEstimateToBoard,
    searchProjects,
    getProjectById,
    getBoardEditUrl,
    getSyncHistory,
  }
}