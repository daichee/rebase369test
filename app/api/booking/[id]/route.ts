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
    const body = await request.json()

    // プロジェクトの存在確認
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("id")
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

    // 宿泊日数再計算（日程が変更された場合）
    let updateData: ProjectUpdate = { ...body }
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date)
      const endDate = new Date(body.end_date)
      const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      updateData.nights = nights
    }

    // プロジェクト更新
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating project:", updateError)
      return NextResponse.json(
        { error: "Failed to update project" },
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
          nights: updateData.nights || updatedProject.nights,
          amount: room.room_rate * (updateData.nights || updatedProject.nights),
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