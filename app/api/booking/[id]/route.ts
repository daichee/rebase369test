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
      console.error("BOOKING_EDIT_ERROR - Invalid JSON in request body:", error)
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    // Comprehensive logging for debugging
    console.log("BOOKING_EDIT_DEBUG - PUT /api/booking/[id] Request:")
    console.log("- Booking ID:", id)
    console.log("- Request body keys:", Object.keys(body))
    console.log("- Request body:", JSON.stringify(body, null, 2))
    console.log("- Request body PAX values:", {
      pax_total: body.pax_total,
      pax_adults: body.pax_adults,
      pax_adult_leaders: body.pax_adult_leaders,
      pax_students: body.pax_students,
      pax_children: body.pax_children,
      pax_infants: body.pax_infants,
      pax_babies: body.pax_babies
    })

    // プロジェクトの存在確認
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("*")  // Get full project to compare with updates
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("BOOKING_EDIT_ERROR - Project fetch failed:", fetchError)
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: "Failed to check project" },
        { status: 500 }
      )
    }

    console.log("BOOKING_EDIT_DEBUG - Existing project data:", JSON.stringify(existingProject, null, 2))

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
    
    console.log("BOOKING_EDIT_DEBUG - Filtered updateData for projects table:", JSON.stringify(updateData, null, 2))

    // Critical PAX constraint validation BEFORE database update
    const paxFields = {
      pax_total: updateData.pax_total ?? existingProject.pax_total,
      pax_adults: updateData.pax_adults ?? existingProject.pax_adults,
      pax_adult_leaders: updateData.pax_adult_leaders ?? existingProject.pax_adult_leaders,
      pax_students: updateData.pax_students ?? existingProject.pax_students,
      pax_children: updateData.pax_children ?? existingProject.pax_children,
      pax_infants: updateData.pax_infants ?? existingProject.pax_infants,
      pax_babies: updateData.pax_babies ?? existingProject.pax_babies
    }

    console.log("BOOKING_EDIT_DEBUG - PAX validation fields:", paxFields)
    console.log("BOOKING_EDIT_DEBUG - PAX field types:", {
      pax_total: typeof paxFields.pax_total,
      pax_adults: typeof paxFields.pax_adults,
      pax_adult_leaders: typeof paxFields.pax_adult_leaders,
      pax_students: typeof paxFields.pax_students,
      pax_children: typeof paxFields.pax_children,
      pax_infants: typeof paxFields.pax_infants,
      pax_babies: typeof paxFields.pax_babies
    })

    // Calculate PAX sum for validation - handle data types carefully
    const paxSum = Number(paxFields.pax_adults || 0) + 
                   Number(paxFields.pax_adult_leaders || 0) + 
                   Number(paxFields.pax_students || 0) + 
                   Number(paxFields.pax_children || 0) + 
                   Number(paxFields.pax_infants || 0) + 
                   Number(paxFields.pax_babies || 0)

    const paxTotal = Number(paxFields.pax_total)

    console.log("BOOKING_EDIT_DEBUG - PAX calculation:")
    console.log("- pax_total (raw):", paxFields.pax_total, typeof paxFields.pax_total)
    console.log("- pax_total (converted):", paxTotal, typeof paxTotal)
    console.log("- calculated sum:", paxSum, typeof paxSum)
    console.log("- constraint validation (===):", paxTotal === paxSum)
    console.log("- constraint validation (==):", paxTotal == paxSum)
    console.log("- individual PAX values (converted):", {
      adults: Number(paxFields.pax_adults || 0),
      adult_leaders: Number(paxFields.pax_adult_leaders || 0),
      students: Number(paxFields.pax_students || 0),
      children: Number(paxFields.pax_children || 0),
      infants: Number(paxFields.pax_infants || 0),
      babies: Number(paxFields.pax_babies || 0)
    })

    // Validate PAX constraint (must match database constraint)
    if (paxTotal <= 0) {
      console.error("BOOKING_EDIT_ERROR - PAX constraint failed: pax_total must be > 0")
      return NextResponse.json(
        { 
          error: "PAX validation failed: Total guests must be greater than 0",
          details: `pax_total: ${paxTotal}`
        },
        { status: 400 }
      )
    }

    if (paxTotal !== paxSum) {
      console.error("BOOKING_EDIT_ERROR - PAX constraint failed: pax_total ≠ sum of breakdown")
      return NextResponse.json(
        { 
          error: "PAX validation failed: Total guests must equal sum of breakdown",
          details: `pax_total: ${paxTotal}, breakdown sum: ${paxSum}`,
          breakdown: paxFields,
          convertedBreakdown: {
            adults: Number(paxFields.pax_adults || 0),
            adult_leaders: Number(paxFields.pax_adult_leaders || 0),
            students: Number(paxFields.pax_students || 0),
            children: Number(paxFields.pax_children || 0),
            infants: Number(paxFields.pax_infants || 0),
            babies: Number(paxFields.pax_babies || 0)
          }
        },
        { status: 400 }
      )
    }

    // Data type validation and conversion for numeric fields
    const numericFields = ['room_amount', 'pax_amount', 'addon_amount', 'subtotal_amount', 'total_amount']
    for (const field of numericFields) {
      if (updateData[field as keyof ProjectUpdate] !== undefined) {
        const value = updateData[field as keyof ProjectUpdate]
        if (typeof value === 'string' && !isNaN(Number(value))) {
          // Convert string numbers to numbers
          updateData[field as keyof ProjectUpdate] = Number(value)
          console.log(`BOOKING_EDIT_DEBUG - Converted ${field} from string to number: ${value}`)
        } else if (typeof value !== 'number' && value !== null) {
          console.error(`BOOKING_EDIT_ERROR - Invalid type for ${field}: ${typeof value}`)
          return NextResponse.json(
            { 
              error: `Invalid data type for ${field}`,
              details: `Expected number, got ${typeof value}`
            },
            { status: 400 }
          )
        }
      }
    }

    // Convert PAX fields to integers for database consistency
    const paxFieldsToConvert = ['pax_total', 'pax_adults', 'pax_adult_leaders', 'pax_students', 'pax_children', 'pax_infants', 'pax_babies']
    for (const field of paxFieldsToConvert) {
      if (updateData[field as keyof ProjectUpdate] !== undefined) {
        const value = updateData[field as keyof ProjectUpdate]
        if (typeof value === 'string' && !isNaN(Number(value))) {
          updateData[field as keyof ProjectUpdate] = parseInt(value, 10)
          console.log(`BOOKING_EDIT_DEBUG - Converted PAX ${field} from string to integer: ${value}`)
        } else if (typeof value === 'number') {
          updateData[field as keyof ProjectUpdate] = Math.round(value)
          console.log(`BOOKING_EDIT_DEBUG - Rounded PAX ${field} to integer: ${value}`)
        } else if (value !== null && value !== undefined) {
          console.error(`BOOKING_EDIT_ERROR - Invalid type for PAX ${field}: ${typeof value}`)
          return NextResponse.json(
            { 
              error: `Invalid data type for PAX ${field}`,
              details: `Expected number, got ${typeof value}`
            },
            { status: 400 }
          )
        }
      }
    }

    console.log("BOOKING_EDIT_DEBUG - Final updateData after validation:", JSON.stringify(updateData, null, 2))

    // プロジェクト更新
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("BOOKING_EDIT_ERROR - Database update failed:", {
        error: updateError,
        errorCode: updateError.code,
        errorMessage: updateError.message,
        errorDetails: updateError.details,
        errorHint: updateError.hint,
        updateData: updateData
      })
      return NextResponse.json(
        { 
          error: "Failed to update project",
          details: updateError.message,
          code: updateError.code,
          hint: updateError.hint,
          updateData: updateData
        },
        { status: 500 }
      )
    }

    console.log("BOOKING_EDIT_DEBUG - Project updated successfully:", JSON.stringify(updatedProject, null, 2))

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