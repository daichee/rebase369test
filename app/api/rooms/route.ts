import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // クエリパラメータ
    const floor = searchParams.get("floor")
    const roomType = searchParams.get("room_type")
    const usageType = searchParams.get("usage_type")
    const isActive = searchParams.get("is_active")
    const minCapacity = searchParams.get("min_capacity")
    const maxCapacity = searchParams.get("max_capacity")

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
    if (minCapacity) {
      query = query.gte("capacity", parseInt(minCapacity))
    }
    if (maxCapacity) {
      query = query.lte("capacity", parseInt(maxCapacity))
    }

    const { data: rooms, error } = await query

    if (error) {
      console.error("Error fetching rooms:", error)
      return NextResponse.json(
        { error: "Failed to fetch rooms" },
        { status: 500 }
      )
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}