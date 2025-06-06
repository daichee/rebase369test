import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import { calculateNights } from "@/lib/utils/date-utils"

type Project = Database["public"]["Tables"]["projects"]["Row"]
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"]

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
        { error: "Failed to fetch projects" },
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
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // バリデーション
    const requiredFields = ["start_date", "end_date", "pax_total", "guest_name", "guest_email"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
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
        { error: "Failed to create project" },
        { status: 500 }
      )
    }

    // 料金計算結果を保存
    if (body.priceBreakdown) {
      try {
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
      } catch (error) {
        console.warn("Error saving price details:", error)
        // 非致命的エラーとして継続
      }
    }

    // 部屋割り当て処理
    if (body.rooms && Array.isArray(body.rooms)) {
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
        // プロジェクトをロールバック
        await supabase.from("projects").delete().eq("id", project.id)
        return NextResponse.json(
          { error: "Failed to create room assignments" },
          { status: 500 }
        )
      }
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
        { error: "Project created but failed to fetch details" },
        { status: 500 }
      )
    }

    return NextResponse.json(createdProject, { status: 201 })

  } catch (error) {
    console.error("Error in booking POST:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}