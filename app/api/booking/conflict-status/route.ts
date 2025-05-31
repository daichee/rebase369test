import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { ApiErrorHandler, ValidationUtils } from "@/lib/utils/api-error-handler"

export async function POST(request: NextRequest) {
  try {
    const { roomIds, startDate, endDate, sessionId } = await request.json()

    // Validate required fields
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return ApiErrorHandler.validationError(
        "部屋IDが必要です",
        "roomIds must be a non-empty array"
      )
    }

    // Validate date range
    const dateRange = ValidationUtils.validateDateRange(startDate, endDate)
    if (!dateRange) {
      return ApiErrorHandler.validationError(
        "有効な開始日と終了日が必要です",
        "Both startDate and endDate must be valid dates with startDate < endDate"
      )
    }

    const supabase = createServerClient()

    // 競合解決データを取得
    const { data: conflictData, error: conflictError } = await supabase.rpc(
      'get_conflict_resolution_data',
      {
        p_room_ids: roomIds,
        p_start_date: startDate,
        p_end_date: endDate,
        p_exclude_booking_id: null
      }
    )

    if (conflictError) {
      console.error("Conflict data fetch error:", conflictError)
      return ApiErrorHandler.serverError("競合データの取得に失敗しました")
    }

    // ロック状態を取得（sessionIdが提供されている場合）
    let lockStatus = null
    if (sessionId) {
      const { data: lockData, error: lockError } = await supabase.rpc(
        'get_booking_lock_status',
        {
          p_session_id: sessionId,
          p_room_ids: roomIds,
          p_start_date: startDate,
          p_end_date: endDate
        }
      )

      if (!lockError) {
        lockStatus = lockData
      }
    }

    // システム統計を取得
    const { data: systemStats, error: statsError } = await supabase.rpc(
      'get_booking_system_stats'
    )

    return NextResponse.json({
      success: true,
      data: {
        conflicts: conflictData?.conflicts || [],
        alternativeRooms: conflictData?.alternativeRooms || [],
        alternativeDates: conflictData?.alternativeDates || [],
        hasConflicts: conflictData?.hasConflicts || false,
        lockStatus,
        systemStats: statsError ? null : systemStats,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Conflict status fetch error:", error)
    return ApiErrorHandler.handleUnknownError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomIds = searchParams.get('roomIds')?.split(',').filter(id => id.trim()) || []
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sessionId = searchParams.get('sessionId')

    // Validate required parameters
    if (roomIds.length === 0) {
      return ApiErrorHandler.validationError(
        "部屋IDが必要です",
        "roomIds parameter is required and must contain at least one room ID"
      )
    }

    // Validate date range
    const dateRange = ValidationUtils.validateDateRange(startDate || "", endDate || "")
    if (!dateRange) {
      return ApiErrorHandler.validationError(
        "有効な開始日と終了日が必要です",
        "Both startDate and endDate parameters are required and must be valid dates"
      )
    }

    // Create a proper request body and delegate to POST handler
    const requestBody = { roomIds, startDate, endDate, sessionId }
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' }
    })

    return await POST(postRequest)

  } catch (error) {
    console.error("GET conflict status fetch error:", error)
    return ApiErrorHandler.handleUnknownError(error)
  }
}