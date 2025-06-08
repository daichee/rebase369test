import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import { calculateNights } from "@/lib/utils/date-utils"

type Project = Database["public"]["Tables"]["projects"]["Row"]
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"]

/**
 * Retrieves a paginated list of bookings with optional filtering
 * 
 * @param request - Next.js request object containing query parameters
 * @returns JSON response containing booking data, count, and pagination info
 * 
 * Query Parameters:
 * - status: Filter by booking status
 * - start_date: Filter bookings starting from this date (ISO string)
 * - end_date: Filter bookings ending before this date (ISO string)
 * - guest_name: Filter by guest name (partial match)
 * - limit: Number of results to return (default: 50)
 * - offset: Number of results to skip for pagination (default: 0)
 * 
 * Response Format:
 * {
 *   data: Project[], // Array of booking projects with room details
 *   count: number,   // Total count of matching bookings
 *   hasMore: boolean // Whether more results are available
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // クエリパラメータ
    const status = searchParams.get("status")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const guestName = searchParams.get("guest_name")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("projects")
      .select(`
        *,
        project_rooms (
          *,
          rooms (*)
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // フィルタリング
    if (status) {
      query = query.eq("status", status)
    }
    if (startDate) {
      query = query.gte("start_date", startDate)
    }
    if (endDate) {
      query = query.lte("end_date", endDate)
    }
    if (guestName) {
      query = query.ilike("guest_name", `%${guestName}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching projects:", error)
      return NextResponse.json(
        { error: "予約一覧の取得に失敗しました" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      count,
      hasMore: (count || 0) > offset + limit
    })

  } catch (error) {
    console.error("Error in booking GET:", error)
    return NextResponse.json(
      { error: "サーバー内部エラーが発生しました" },
      { status: 500 }
    )
  }
}

/**
 * Creates a new booking with room assignments and optional pricing details
 * 
 * @param request - Next.js request object containing booking data in JSON body
 * @returns JSON response with created booking data or error message
 * 
 * Required Body Fields:
 * - start_date: Check-in date (ISO string)
 * - end_date: Check-out date (ISO string)  
 * - pax_total: Total number of guests
 * - guest_name: Primary guest name
 * - guest_email: Primary guest email
 * - rooms: Array of room assignments with room_id, assigned_pax, room_rate
 * 
 * Optional Body Fields:
 * - pax_adults, pax_students, pax_children, etc.: Guest breakdown by age
 * - guest_phone, guest_org, purpose: Additional guest information
 * - room_amount, pax_amount, addon_amount: Pricing breakdown
 * - priceBreakdown: Detailed calculation results for archival
 * - addons: Selected add-on services
 * - notes: Special instructions or notes
 * 
 * Validation Rules:
 * - At least one room must be assigned
 * - Total assigned pax must equal pax_total
 * - Room rates and pax counts must be positive numbers
 * 
 * Response: Created booking project with room assignments (status 201)
 * Error Responses: 400 for validation errors, 500 for server errors
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // バリデーション
    const requiredFields = ["start_date", "end_date", "pax_total", "guest_name", "guest_email"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `必須フィールドが不足しています: ${field}` },
          { status: 400 }
        )
      }
    }

    // 部屋割り当て必須バリデーション
    if (!body.rooms || !Array.isArray(body.rooms) || body.rooms.length === 0) {
      return NextResponse.json(
        { error: "部屋の割り当てが必要です。宿泊には最低1部屋の割り当てが必要です。" },
        { status: 400 }
      )
    }

    // 部屋データの構造バリデーション
    for (let i = 0; i < body.rooms.length; i++) {
      const room = body.rooms[i]
      if (!room.room_id || !room.assigned_pax || !room.room_rate) {
        return NextResponse.json(
          { error: `部屋データが不正です (部屋 ${i + 1}): room_id, assigned_pax, room_rateが必要です` },
          { status: 400 }
        )
      }
      if (typeof room.assigned_pax !== 'number' || room.assigned_pax <= 0) {
        return NextResponse.json(
          { error: `部屋割り当て人数が不正です (部屋 ${i + 1}): 1名以上である必要があります` },
          { status: 400 }
        )
      }
      if (typeof room.room_rate !== 'number' || room.room_rate < 0) {
        return NextResponse.json(
          { error: `部屋料金が不正です (部屋 ${i + 1}): 0以上の数値である必要があります` },
          { status: 400 }
        )
      }
    }

    // 部屋割り当て人数の合計チェック
    const totalAssignedPax = body.rooms.reduce((sum: number, room: any) => sum + room.assigned_pax, 0)
    if (totalAssignedPax !== body.pax_total) {
      return NextResponse.json(
        { error: `部屋割り当て人数の合計 (${totalAssignedPax}名) が宿泊者総数 (${body.pax_total}名) と一致しません` },
        { status: 400 }
      )
    }

    // 宿泊日数計算
    const nights = calculateNights(body.start_date, body.end_date)

    // プロジェクトデータ準備
    const projectData: ProjectInsert = {
      start_date: body.start_date,
      end_date: body.end_date,
      pax_total: body.pax_total,
      pax_adults: body.pax_adults || 0,
      pax_adult_leaders: body.pax_adult_leaders || 0,
      pax_students: body.pax_students || 0,
      pax_children: body.pax_children || 0,
      pax_infants: body.pax_infants || 0,
      pax_babies: body.pax_babies || 0,
      guest_name: body.guest_name,
      guest_email: body.guest_email,
      guest_phone: body.guest_phone || null,
      guest_org: body.guest_org || null,
      purpose: body.purpose || null,
      room_amount: body.room_amount || 0,
      pax_amount: body.pax_amount || 0,
      addon_amount: body.addon_amount || 0,
      subtotal_amount: body.subtotal_amount || 0,
      total_amount: body.total_amount || 0,
      notes: body.notes || null,
      status: body.status || "draft",
    }

    // プロジェクト作成
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert(projectData)
      .select()
      .single()

    if (projectError) {
      console.error("Error creating project:", projectError)
      return NextResponse.json(
        { error: "予約の作成に失敗しました" },
        { status: 500 }
      )
    }

    // 料金計算結果を保存 (オプション - テーブルが存在しない場合はスキップ)
    if (body.priceBreakdown) {
      try {
        // まずテーブルの存在確認
        const { error: tableCheckError } = await supabase
          .from("booking_price_details")
          .select("id")
          .limit(1)

        if (!tableCheckError) {
          // テーブルが存在する場合のみ保存を試行
          const { error: priceError } = await supabase
            .from("booking_price_details")
            .insert({
              booking_id: project.id,
              rooms_used: body.rooms || [],
              guest_breakdown: {
                adult: body.adult || 0,
                student: body.student || 0,
                child: body.child || 0,
                infant: body.infant || 0,
                baby: body.baby || 0
              },
              date_range: {
                startDate: body.start_date,
                endDate: body.end_date,
                nights: nights
              },
              addons_selected: body.addons || [],
              season_config: body.priceBreakdown.seasonConfig || {},
              room_amount: body.priceBreakdown.roomAmount || 0,
              guest_amount: body.priceBreakdown.guestAmount || 0,
              addon_amount: body.priceBreakdown.addonAmount || 0,
              subtotal: body.priceBreakdown.subtotal || 0,
              total_amount: body.priceBreakdown.total || 0,
              daily_breakdown: body.priceBreakdown.dailyBreakdown || [],
              calculation_method: 'unified_calculator'
            })

          if (priceError) {
            console.warn("Failed to save price details:", priceError)
            // 非致命的エラーとして継続
          }
        } else {
          console.info("booking_price_details table not found, skipping price details save")
        }
      } catch (error) {
        console.warn("Error saving price details:", error)
        // 非致命的エラーとして継続
      }
    }

    // 部屋割り当て処理 (必須)
    const roomData = body.rooms.map((room: any) => ({
      project_id: project.id,
      room_id: room.room_id,
      assigned_pax: room.assigned_pax,
      room_rate: room.room_rate,
      nights: nights,
    }))

    const { error: roomError } = await supabase
      .from("project_rooms")
      .insert(roomData)

    if (roomError) {
      console.error("Error creating room assignments:", roomError)
      
      // プロジェクトをロールバック（安全な処理）
      try {
        const { error: rollbackError } = await supabase
          .from("projects")
          .delete()
          .eq("id", project.id)
        
        if (rollbackError) {
          console.error("Critical: Failed to rollback project after room assignment failure:", rollbackError)
          // プロジェクトが残存する可能性があることをログに記録
          console.error("Orphaned project ID:", project.id)
        }
      } catch (rollbackException) {
        console.error("Critical: Exception during project rollback:", rollbackException)
        console.error("Orphaned project ID:", project.id)
      }
      
      return NextResponse.json(
        { error: "部屋割り当ての作成に失敗しました。予約は作成されませんでした。" },
        { status: 500 }
      )
    }

    // 作成されたプロジェクトと部屋情報を取得
    const { data: createdProject, error: fetchError } = await supabase
      .from("projects")
      .select(`
        *,
        project_rooms (
          *,
          rooms (*)
        )
      `)
      .eq("id", project.id)
      .single()

    if (fetchError) {
      console.error("Error fetching created project:", fetchError)
      return NextResponse.json(
        { error: "予約は作成されましたが詳細の取得に失敗しました" },
        { status: 500 }
      )
    }

    return NextResponse.json(createdProject, { status: 201 })

  } catch (error) {
    console.error("Error in booking POST:", error)
    return NextResponse.json(
      { error: "サーバー内部エラーが発生しました" },
      { status: 500 }
    )
  }
}