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
          { error: "予約が見つかりません" },
          { status: 404 }
        )
      }
      console.error("Error fetching project:", error)
      return NextResponse.json(
        { error: "予約データの取得に失敗しました" },
        { status: 500 }
      )
    }

    return NextResponse.json(project)

  } catch (error) {
    console.error("Error in booking GET by ID:", error)
    return NextResponse.json(
      { error: "サーバー内部エラーが発生しました" },
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
        { error: "リクエストデータの形式が正しくありません" },
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
          { error: "予約が見つかりません" },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: "予約の確認に失敗しました" },
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
          { error: "日付の形式が正しくありません" },
          { status: 400 }
        )
      }
      
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: "終了日は開始日より後の日付を選択してください" },
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
          error: "人数入力エラー: 宿泊者数は1名以上である必要があります",
          details: `pax_total: ${paxTotal}`
        },
        { status: 400 }
      )
    }

    if (paxTotal !== paxSum) {
      console.error("BOOKING_EDIT_ERROR - PAX constraint failed: pax_total ≠ sum of breakdown")
      return NextResponse.json(
        { 
          error: "人数内訳エラー: 宿泊者総数と内訳の合計が一致していません",
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
              error: `フィールド ${field} のデータ形式が正しくありません`,
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
              error: `PAXフィールド ${field} のデータ形式が正しくありません`,
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
          error: "予約の更新に失敗しました",
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
      // 部屋データの構造バリデーション（更新時）
      if (body.rooms.length === 0) {
        return NextResponse.json(
          { error: "部屋の割り当てをすべて削除することはできません。宿泊には最低1部屋の割り当てが必要です。" },
          { status: 400 }
        )
      }

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

      // 部屋割り当て人数の合計チェック（更新されたpax_totalと比較）
      const finalPaxTotal = updateData.pax_total ?? existingProject.pax_total
      const totalAssignedPax = body.rooms.reduce((sum: number, room: any) => sum + room.assigned_pax, 0)
      if (totalAssignedPax !== finalPaxTotal) {
        return NextResponse.json(
          { error: `部屋割り当て人数の合計 (${totalAssignedPax}名) が宿泊者総数 (${finalPaxTotal}名) と一致しません` },
          { status: 400 }
        )
      }

      // 既存の部屋割り当てを削除
      const { error: deleteError } = await supabase
        .from("project_rooms")
        .delete()
        .eq("project_id", id)

      if (deleteError) {
        console.error("Error deleting existing room assignments:", deleteError)
        return NextResponse.json(
          { error: "部屋割り当ての更新に失敗しました" },
          { status: 500 }
        )
      }

      // 新しい部屋割り当てを追加
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
          { error: "部屋割り当ての更新に失敗しました" },
          { status: 500 }
        )
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
        { error: "予約は更新されましたが詳細の取得に失敗しました" },
        { status: 500 }
      )
    }

    return NextResponse.json(finalProject)

  } catch (error) {
    console.error("Error in booking PUT:", error)
    return NextResponse.json(
      { error: "サーバー内部エラーが発生しました" },
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
          { error: "予約が見つかりません" },
          { status: 404 }
        )
      }
      console.error("Error checking project:", fetchError)
      return NextResponse.json(
        { error: "予約の確認に失敗しました" },
        { status: 500 }
      )
    }

    // 確定済みの予約は削除不可
    if (existingProject.status === "confirmed") {
      return NextResponse.json(
        { error: "確定済みの予約は削除できません。まずキャンセルしてください。" },
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
        { error: "部屋割り当ての削除に失敗しました" },
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
        { error: "予約の削除に失敗しました" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "予約が正常に削除されました" })

  } catch (error) {
    console.error("Error in booking DELETE:", error)
    return NextResponse.json(
      { error: "サーバー内部エラーが発生しました" },
      { status: 500 }
    )
  }
}