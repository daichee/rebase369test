"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type BoardProjectRow = Database["public"]["Tables"]["board_projects"]["Row"]

export interface BoardProject {
  id: number
  projectNo: number
  clientName: string
  title?: string
  status: string
  lastSyncedAt: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BoardSyncResult {
  success: boolean
  message: string
  syncedCount?: number
  errors?: string[]
}

export function useBoardProjects() {
  const [projects, setProjects] = useState<BoardProject[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from("board_projects")
        .select("*")
        .eq("is_active", true)
        .order("project_no", { ascending: false })

      if (error) throw error

      const mappedProjects = data.map(mapSupabaseToBoardProject)
      setProjects(mappedProjects)
      
      // 最終同期日時を取得
      if (data.length > 0) {
        const latestSync = Math.max(...data.map(p => new Date(p.last_synced_at).getTime()))
        setLastSyncAt(new Date(latestSync).toISOString())
      }
    } catch (error) {
      console.error("Board案件の取得に失敗:", error)
      setError("Board案件の取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const syncFromBoard = async (): Promise<BoardSyncResult> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Board API経由で案件一覧を取得
      const response = await fetch("/api/board/projects", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Board API同期に失敗: ${response.status}`)
      }

      const { projects: boardProjects, error: apiError } = await response.json()
      
      if (apiError) {
        throw new Error(apiError)
      }

      // Supabaseに同期
      let syncedCount = 0
      const errors: string[] = []

      for (const project of boardProjects) {
        try {
          const { error: upsertError } = await supabase
            .from("board_projects")
            .upsert({
              board_project_id: project.id,
              project_no: project.project_no,
              client_name: project.client_name,
              title: project.title,
              status: project.status,
              last_synced_at: new Date().toISOString(),
              is_active: true,
            }, {
              onConflict: "board_project_id"
            })

          if (upsertError) {
            errors.push(`案件${project.project_no}: ${upsertError.message}`)
          } else {
            syncedCount++
          }
        } catch (error) {
          errors.push(`案件${project.project_no}: ${error}`)
        }
      }

      // 最新データを再取得
      await fetchProjects()

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `${syncedCount}件の案件を同期しました`
          : `${syncedCount}件同期、${errors.length}件でエラーが発生しました`,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      console.error("Board同期に失敗:", error)
      const errorMessage = "Board同期に失敗しました"
      setError(errorMessage)
      
      return {
        success: false,
        message: errorMessage,
        errors: [String(error)]
      }
    } finally {
      setIsLoading(false)
    }
  }

  const searchProjects = async (searchParams: {
    clientName?: string
    projectNo?: number
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<BoardProject[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from("board_projects")
        .select("*")
        .eq("is_active", true)

      if (searchParams.clientName) {
        query = query.ilike("client_name", `%${searchParams.clientName}%`)
      }
      
      if (searchParams.projectNo) {
        query = query.eq("project_no", searchParams.projectNo)
      }
      
      if (searchParams.status) {
        query = query.eq("status", searchParams.status)
      }
      
      if (searchParams.dateFrom) {
        query = query.gte("created_at", searchParams.dateFrom)
      }
      
      if (searchParams.dateTo) {
        query = query.lte("created_at", searchParams.dateTo)
      }

      const { data, error } = await query.order("project_no", { ascending: false })

      if (error) throw error

      return data.map(mapSupabaseToBoardProject)
    } catch (error) {
      console.error("Board案件の検索に失敗:", error)
      setError("Board案件の検索に失敗しました")
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const getProjectById = async (boardProjectId: number): Promise<BoardProject | null> => {
    try {
      const { data, error } = await supabase
        .from("board_projects")
        .select("*")
        .eq("board_project_id", boardProjectId)
        .eq("is_active", true)
        .single()

      if (error) throw error

      return mapSupabaseToBoardProject(data)
    } catch (error) {
      console.error("Board案件の取得に失敗:", error)
      return null
    }
  }

  const syncEstimateToBoard = async (
    boardProjectId: number,
    estimateData: {
      roomAmount: number
      guestAmount: number
      addonAmount: number
      totalAmount: number
      items: Array<{
        itemName: string
        quantity: number
        unitPrice: number
        amount: number
        category: string
      }>
    }
  ): Promise<BoardSyncResult> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/board/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardProjectId,
          estimateData
        })
      })

      if (!response.ok) {
        throw new Error(`見積同期に失敗: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      return {
        success: true,
        message: "見積データをBoardに同期しました",
        syncedCount: 1
      }

    } catch (error) {
      console.error("見積同期に失敗:", error)
      const errorMessage = "見積同期に失敗しました"
      setError(errorMessage)
      
      return {
        success: false,
        message: errorMessage,
        errors: [String(error)]
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getBoardEditUrl = (boardProjectId: number, documentType: "estimate" = "estimate"): string => {
    // Board書類編集ページのURL生成（実際のBoard URLに合わせて調整）
    return `https://board.example.com/projects/${boardProjectId}/documents/${documentType}/edit`
  }

  return {
    projects,
    isLoading,
    error,
    lastSyncAt,
    fetchProjects,
    syncFromBoard,
    searchProjects,
    getProjectById,
    syncEstimateToBoard,
    getBoardEditUrl,
    refetch: fetchProjects
  }
}

// Supabaseの行データをBoard案件オブジェクトにマッピング
function mapSupabaseToBoardProject(row: BoardProjectRow): BoardProject {
  return {
    id: row.board_project_id,
    projectNo: row.project_no,
    clientName: row.client_name,
    title: row.title || undefined,
    status: row.status,
    lastSyncedAt: row.last_synced_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}