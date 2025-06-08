import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Searches for available rooms based on date range and guest requirements
 * 
 * @param request - Next.js request object containing search criteria
 * @returns JSON response with available rooms and their availability status
 * 
 * Required Query Parameters:
 * - start_date: Check-in date (ISO string format)
 * - end_date: Check-out date (ISO string format)
 * - guest_count: Number of guests (positive integer)
 * 
 * Optional Query Parameters:
 * - room_type: Filter by specific room type
 * - usage_type: Filter by usage type (shared/private)
 * - floor: Filter by specific floor number
 * 
 * Search Logic:
 * 1. Retrieves rooms with capacity >= guest_count
 * 2. Filters by optional criteria (type, usage, floor)
 * 3. Checks availability against existing bookings in date range
 * 4. Returns rooms with availability status and conflict information
 * 
 * Response Format:
 * {
 *   available: Room[],    // Fully available rooms
 *   partially: Room[],    // Rooms with some availability
 *   unavailable: Room[]   // Fully booked rooms
 * }
 * 
 * Error Responses: 400 for missing/invalid parameters, 500 for server errors
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // 必須パラメータ
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const guestCount = parseInt(searchParams.get("guest_count") || "0")

    // オプションパラメータ
    const roomType = searchParams.get("room_type")
    const usageType = searchParams.get("usage_type")
    const floor = searchParams.get("floor")

    if (!startDate || !endDate || guestCount <= 0) {
      return NextResponse.json(
        { error: "Missing required parameters: start_date, end_date, guest_count" },
        { status: 400 }
      )
    }

    // 基本的な部屋取得クエリ
    let roomQuery = supabase
      .from("rooms")
      .select("*")
      .eq("is_active", true)
      .gte("capacity", guestCount)

    // フィルタリング
    if (roomType) {
      roomQuery = roomQuery.eq("room_type", roomType)
    }
    if (usageType) {
      roomQuery = roomQuery.eq("usage_type", usageType)
    }
    if (floor) {
      roomQuery = roomQuery.eq("floor", floor)
    }

    const { data: allRooms, error: roomError } = await roomQuery

    if (roomError) {
      console.error("Error fetching rooms:", roomError)
      return NextResponse.json(
        { error: "Failed to fetch rooms" },
        { status: 500 }
      )
    }

    // 期間中に予約されている部屋を取得
    const { data: bookedRooms, error: bookingError } = await supabase
      .from("project_rooms")
      .select(`
        room_id,
        projects!inner (
          start_date,
          end_date,
          status
        )
      `)
      .not("projects.status", "eq", "cancelled")
      .gte("projects.end_date", startDate)
      .lte("projects.start_date", endDate)

    if (bookingError) {
      console.error("Error fetching bookings:", bookingError)
      return NextResponse.json(
        { error: "Failed to check room availability" },
        { status: 500 }
      )
    }

    // 予約済み部屋のIDセットを作成
    const bookedRoomIds = new Set(bookedRooms.map(booking => booking.room_id))

    // 利用可能な部屋をフィルタリング
    const availableRooms = allRooms.filter(room => !bookedRoomIds.has(room.room_id))

    // 部屋の組み合わせ提案を生成
    const roomCombinations = generateRoomCombinations(availableRooms, guestCount)

    // 部屋を利用タイプ別にグループ化
    const roomsByUsageType = availableRooms.reduce((acc, room) => {
      if (!acc[room.usage_type]) {
        acc[room.usage_type] = []
      }
      acc[room.usage_type].push(room)
      return acc
    }, {} as Record<string, typeof availableRooms>)

    return NextResponse.json({
      availableRooms,
      roomsByUsageType,
      roomCombinations,
      searchParams: {
        startDate,
        endDate,
        guestCount,
        roomType,
        usageType,
        floor
      },
      stats: {
        totalRoomsFound: allRooms.length,
        availableRoomsCount: availableRooms.length,
        bookedRoomsCount: bookedRoomIds.size,
        combinationsCount: roomCombinations.length
      }
    })

  } catch (error) {
    console.error("Error in room search:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 部屋の組み合わせ提案を生成する関数
function generateRoomCombinations(rooms: any[], guestCount: number) {
  const combinations: any[] = []

  // 単独の部屋で収容可能な場合
  rooms.forEach(room => {
    if (room.capacity >= guestCount) {
      combinations.push({
        rooms: [room],
        totalCapacity: room.capacity,
        totalRate: room.room_rate,
        utilizationRate: (guestCount / room.capacity) * 100,
        type: 'single_room'
      })
    }
  })

  // 複数部屋の組み合わせ（2部屋まで）
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const room1 = rooms[i]
      const room2 = rooms[j]
      const totalCapacity = room1.capacity + room2.capacity
      
      if (totalCapacity >= guestCount) {
        combinations.push({
          rooms: [room1, room2],
          totalCapacity,
          totalRate: room1.room_rate + room2.room_rate,
          utilizationRate: (guestCount / totalCapacity) * 100,
          type: 'two_rooms'
        })
      }
    }
  }

  // 利用率の高い順（無駄の少ない順）でソート
  return combinations
    .sort((a, b) => b.utilizationRate - a.utilizationRate)
    .slice(0, 10) // 上位10件のみ
}