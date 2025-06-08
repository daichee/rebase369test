import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ApiErrorHandler, ValidationUtils } from "@/lib/utils/api-error-handler"

/**
 * Retrieves filtered list of rooms with comprehensive filtering options
 * 
 * @param request - Next.js request object containing filter parameters
 * @returns JSON response with filtered room data or error message
 * 
 * Query Parameters:
 * - floor: Filter by floor number (e.g., "2", "3")
 * - room_type: Filter by room type (large, medium_a, medium_b, small_a, small_b, small_c)
 * - usage_type: Filter by usage type (shared, private)
 * - is_active: Filter by active status (true/false)
 * - min_capacity: Minimum room capacity (positive integer)
 * - max_capacity: Maximum room capacity (positive integer)
 * 
 * Validation Rules:
 * - Capacity parameters must be positive integers
 * - min_capacity cannot be greater than max_capacity
 * - Boolean parameters are validated for proper format
 * 
 * Response: Array of room objects matching the filter criteria
 * Error Responses: 400 for validation errors, 500 for server errors
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // クエリパラメータの取得と検証
    const floor = searchParams.get("floor")
    const roomType = searchParams.get("room_type")
    const usageType = searchParams.get("usage_type")
    const isActive = searchParams.get("is_active")
    const minCapacityParam = searchParams.get("min_capacity")
    const maxCapacityParam = searchParams.get("max_capacity")

    // 数値パラメータの検証
    let minCapacity: number | null = null
    let maxCapacity: number | null = null

    if (minCapacityParam) {
      minCapacity = ValidationUtils.validatePositiveInteger(minCapacityParam)
      if (minCapacity === null) {
        return ApiErrorHandler.validationError(
          "最小定員は正の整数である必要があります",
          `Invalid min_capacity: ${minCapacityParam}`
        )
      }
    }

    if (maxCapacityParam) {
      maxCapacity = ValidationUtils.validatePositiveInteger(maxCapacityParam)
      if (maxCapacity === null) {
        return ApiErrorHandler.validationError(
          "最大定員は正の整数である必要があります",
          `Invalid max_capacity: ${maxCapacityParam}`
        )
      }
    }

    // 最小定員と最大定員の関係チェック
    if (minCapacity !== null && maxCapacity !== null && minCapacity > maxCapacity) {
      return ApiErrorHandler.validationError(
        "最小定員は最大定員以下である必要があります",
        `min_capacity (${minCapacity}) cannot be greater than max_capacity (${maxCapacity})`
      )
    }

    // 有効な値の検証
    const validRoomTypes = ["large", "medium_a", "medium_b", "small_a", "small_b", "small_c"]
    const validUsageTypes = ["shared", "private"]

    if (roomType && !validRoomTypes.includes(roomType)) {
      return ApiErrorHandler.validationError(
        "無効な部屋タイプです",
        `Valid room types: ${validRoomTypes.join(", ")}`
      )
    }

    if (usageType && !validUsageTypes.includes(usageType)) {
      return ApiErrorHandler.validationError(
        "無効な利用タイプです",
        `Valid usage types: ${validUsageTypes.join(", ")}`
      )
    }

    let query = supabase
      .from("rooms")
      .select("*")
      .order("floor", { ascending: true })
      .order("name", { ascending: true })

    // フィルタリング
    if (floor) {
      query = query.eq("floor", floor)
    }
    if (roomType) {
      query = query.eq("room_type", roomType)
    }
    if (usageType) {
      query = query.eq("usage_type", usageType)
    }
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true")
    }
    if (minCapacity !== null) {
      query = query.gte("capacity", minCapacity)
    }
    if (maxCapacity !== null) {
      query = query.lte("capacity", maxCapacity)
    }

    const { data: rooms, error } = await query

    if (error) {
      console.error("Error fetching rooms:", error)
      return ApiErrorHandler.serverError("部屋データの取得に失敗しました")
    }

    // フロア別にグループ化
    const groupedRooms = rooms.reduce((acc, room) => {
      if (!acc[room.floor]) {
        acc[room.floor] = []
      }
      acc[room.floor].push(room)
      return acc
    }, {} as Record<string, typeof rooms>)

    return NextResponse.json({
      data: rooms,
      groupedByFloor: groupedRooms,
      count: rooms.length
    })

  } catch (error) {
    console.error("Error in rooms GET:", error)
    return ApiErrorHandler.handleUnknownError(error)
  }
}