import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { roomIds, startDate, endDate, sessionId } = await request.json()

    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return NextResponse.json(
        { error: "部屋IDが必要です" },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "開始日と終了日が必要です" },
        { status: 400 }
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
      console.error("競合データ取得エラー:", conflictError)
      return NextResponse.json(
        { error: "競合データの取得に失敗しました" },
        { status: 500 }
      )
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
    console.error("競合ステータス取得エラー:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomIds = searchParams.get('roomIds')?.split(',') || []
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sessionId = searchParams.get('sessionId')

    if (roomIds.length === 0 || !startDate || !endDate) {
      return NextResponse.json(
        { error: "roomIds, startDate, endDateが必要です" },
        { status: 400 }
      )
    }

    // POSTと同じロジックを実行
    return await POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ roomIds, startDate, endDate, sessionId })
    }))

  } catch (error) {
    console.error("GET競合ステータス取得エラー:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}