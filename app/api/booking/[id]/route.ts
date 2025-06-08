import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"]

interface RouteContext {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createClient()
    const { id } = params

    const { data: project, error } = await supabase
      .from("projects")
      .select(`
        *,
        project_rooms (
          *,
          rooms (*)
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        )
      }
      console.error("Error fetching project:", error)
      return NextResponse.json(
        { error: "Failed to fetch project" },
        { status: 500 }
      )
    }

    return NextResponse.json(project)

  } catch (error) {
    console.error("Error in booking GET by ID:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createClient()
    const { id } = params
    
    // Validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("Invalid JSON in request body:", error)
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    // Log incoming data for debugging
    console.log("PUT /api/booking/[id] - Incoming body:", JSON.stringify(body, null, 2))

    // プロジェクトの存在確認
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("id, nights")
      .eq("id", id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        )
      }
      console.error("Error checking project:", fetchError)
      return NextResponse.json(
        { error: "Failed to check project" },
        { status: 500 }
      )
    }

    // Extract only valid project fields for update
    const validProjectFields = [
      'status', 'start_date', 'end_date', 'pax_total', 'pax_adults', 'pax_adult_leaders',
      'pax_students', 'pax_children', 'pax_infants', 'pax_babies', 'guest_name',
      'guest_email', 'guest_phone', 'guest_org', 'purpose', 'room_amount',
      'pax_amount', 'addon_amount', 'subtotal_amount', 'total_amount', 'notes'
    ]
    
    let updateData: ProjectUpdate = {}
    
    // Only include valid fields that exist in the request body
    validProjectFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field as keyof ProjectUpdate] = body[field]
      }
    })
    
    // 日程バリデーション（日程が変更された場合）
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date)
      const endDate = new Date(body.end_date)
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        )
      }
      
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        )
      }
      
      // NOTE: nights は GENERATED ALWAYS カラムのため手動設定不可
      // PostgreSQL が自動的に (end_date - start_date) を計算する
    }
    
    console.log("Filtered updateData for projects table:", JSON.stringify(updateData, null, 2))

    // プロジェクト更新
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating project:", updateError)
      console.error("Update data:", updateData)
      return NextResponse.json(
        { 
          error: "Failed to update project",
          details: updateError.message,
          code: updateError.code 
        },
        { status: 500 }
      )
    }

    // 部屋割り当て更新（部屋情報が含まれている場合）
    if (body.rooms && Array.isArray(body.rooms)) {
      // 既存の部屋割り当てを削除
      const { error: deleteError } = await supabase
        .from("project_rooms")
        .delete()
        .eq("project_id", id)

      if (deleteError) {
        console.error("Error deleting existing room assignments:", deleteError)
        return NextResponse.json(
          { error: "Failed to update room assignments" },
          { status: 500 }
        )
      }

      // 新しい部屋割り当てを追加
      if (body.rooms.length > 0) {
        const roomData = body.rooms.map((room: any) => ({
          project_id: id,
          room_id: room.room_id,
          assigned_pax: room.assigned_pax,
          room_rate: room.room_rate,
          nights: updatedProject.nights, // 更新されたプロジェクトから取得
          amount: room.room_rate * updatedProject.nights,
        }))

        const { error: roomError } = await supabase
          .from("project_rooms")
          .insert(roomData)

        if (roomError) {
          console.error("Error creating new room assignments:", roomError)
          return NextResponse.json(
            { error: "Failed to update room assignments" },
            { status: 500 }
          )
        }
      }
    }

    // 更新されたプロジェクトと部屋情報を取得
    const { data: finalProject, error: finalFetchError } = await supabase
      .from("projects")
      .select(`
        *,
        project_rooms (
          *,
          rooms (*)
        )
      `)
      .eq("id", id)
      .single()

    if (finalFetchError) {
      console.error("Error fetching updated project:", finalFetchError)
      return NextResponse.json(
        { error: "Project updated but failed to fetch details" },
        { status: 500 }
      )
    }

    return NextResponse.json(finalProject)

  } catch (error) {
    console.error("Error in booking PUT:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createClient()
    const { id } = params

    // プロジェクトの存在確認
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("id, status")
      .eq("id", id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        )
      }
      console.error("Error checking project:", fetchError)
      return NextResponse.json(
        { error: "Failed to check project" },
        { status: 500 }
      )
    }

    // 確定済みの予約は削除不可
    if (existingProject.status === "confirmed") {
      return NextResponse.json(
        { error: "Cannot delete confirmed booking. Please cancel first." },
        { status: 400 }
      )
    }

    // 関連する部屋割り当てを先に削除
    const { error: roomDeleteError } = await supabase
      .from("project_rooms")
      .delete()
      .eq("project_id", id)

    if (roomDeleteError) {
      console.error("Error deleting room assignments:", roomDeleteError)
      return NextResponse.json(
        { error: "Failed to delete room assignments" },
        { status: 500 }
      )
    }

    // プロジェクトを削除
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Error deleting project:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Project deleted successfully" })

  } catch (error) {
    console.error("Error in booking DELETE:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}