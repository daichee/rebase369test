import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // パラメータ
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const roomId = searchParams.get("room_id")
    const floor = searchParams.get("floor")
    const groupBy = searchParams.get("group_by") || "room" // room, floor, overall

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters: start_date, end_date" },
        { status: 400 }
      )
    }

    // 全部屋情報を取得
    let roomQuery = supabase
      .from("rooms")
      .select("*")
      .eq("is_active", true)

    if (roomId) {
      roomQuery = roomQuery.eq("room_id", roomId)
    }
    if (floor) {
      roomQuery = roomQuery.eq("floor", floor)
    }

    const { data: rooms, error: roomError } = await roomQuery

    if (roomError) {
      console.error("Error fetching rooms:", roomError)
      return NextResponse.json(
        { error: "Failed to fetch rooms" },
        { status: 500 }
      )
    }

    // 期間中の予約データを取得
    const { data: bookings, error: bookingError } = await supabase
      .from("project_rooms")
      .select(`
        *,
        projects!inner (
          start_date,
          end_date,
          status,
          nights
        ),
        rooms (
          name,
          floor,
          capacity,
          room_type
        )
      `)
      .not("projects.status", "eq", "cancelled")
      .or(`and(projects.start_date.lte.${endDate},projects.end_date.gte.${startDate})`)

    if (bookingError) {
      console.error("Error fetching bookings:", bookingError)
      return NextResponse.json(
        { error: "Failed to fetch booking data" },
        { status: 500 }
      )
    }

    // 期間の日数を計算
    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    // 稼働率計算
    const occupancyData = calculateOccupancy(rooms, bookings, start, end, totalDays, groupBy)

    return NextResponse.json({
      occupancyData,
      period: {
        startDate,
        endDate,
        totalDays
      },
      groupBy,
      stats: {
        totalRooms: rooms.length,
        totalBookings: bookings.length
      }
    })

  } catch (error) {
    console.error("Error in occupancy calculation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function calculateOccupancy(rooms: any[], bookings: any[], startDate: Date, endDate: Date, totalDays: number, groupBy: string) {
  // 各部屋の稼働率を計算
  const roomOccupancy = rooms.map(room => {
    const roomBookings = bookings.filter(booking => booking.room_id === room.room_id)
    
    let occupiedDays = 0
    
    roomBookings.forEach(booking => {
      const bookingStart = new Date(booking.projects.start_date)
      const bookingEnd = new Date(booking.projects.end_date)
      
      // 期間との重複日数を計算
      const overlapStart = new Date(Math.max(startDate.getTime(), bookingStart.getTime()))
      const overlapEnd = new Date(Math.min(endDate.getTime(), bookingEnd.getTime()))
      
      if (overlapStart < overlapEnd) {
        const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))
        occupiedDays += overlapDays
      }
    })

    const occupancyRate = totalDays > 0 ? (occupiedDays / totalDays) * 100 : 0

    return {
      roomId: room.room_id,
      roomName: room.name,
      floor: room.floor,
      capacity: room.capacity,
      roomType: room.room_type,
      totalDays,
      occupiedDays,
      availableDays: totalDays - occupiedDays,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      bookingCount: roomBookings.length
    }
  })

  // グループ化処理
  switch (groupBy) {
    case "floor":
      return groupOccupancyByFloor(roomOccupancy)
    
    case "overall":
      return calculateOverallOccupancy(roomOccupancy, totalDays)
    
    default: // "room"
      return roomOccupancy.sort((a, b) => b.occupancyRate - a.occupancyRate)
  }
}

function groupOccupancyByFloor(roomOccupancy: any[]) {
  const floorGroups = roomOccupancy.reduce((acc, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = []
    }
    acc[room.floor].push(room)
    return acc
  }, {} as Record<string, any[]>)

  return Object.entries(floorGroups).map(([floor, rooms]) => {
    const totalRooms = rooms.length
    const totalOccupiedDays = rooms.reduce((sum, room) => sum + room.occupiedDays, 0)
    const totalPossibleDays = rooms.reduce((sum, room) => sum + room.totalDays, 0)
    const averageOccupancyRate = totalPossibleDays > 0 ? (totalOccupiedDays / totalPossibleDays) * 100 : 0

    return {
      floor,
      totalRooms,
      totalOccupiedDays,
      totalPossibleDays,
      occupancyRate: Math.round(averageOccupancyRate * 100) / 100,
      rooms: rooms.sort((a, b) => b.occupancyRate - a.occupancyRate)
    }
  }).sort((a, b) => b.occupancyRate - a.occupancyRate)
}

function calculateOverallOccupancy(roomOccupancy: any[], totalDays: number) {
  const totalRooms = roomOccupancy.length
  const totalOccupiedDays = roomOccupancy.reduce((sum, room) => sum + room.occupiedDays, 0)
  const totalPossibleDays = roomOccupancy.reduce((sum, room) => sum + room.totalDays, 0)
  const overallOccupancyRate = totalPossibleDays > 0 ? (totalOccupiedDays / totalPossibleDays) * 100 : 0

  const byRoomType = roomOccupancy.reduce((acc, room) => {
    if (!acc[room.roomType]) {
      acc[room.roomType] = []
    }
    acc[room.roomType].push(room)
    return acc
  }, {} as Record<string, any[]>)

  const roomTypeStats = Object.entries(byRoomType).map(([type, rooms]) => {
    const typeOccupiedDays = rooms.reduce((sum, room) => sum + room.occupiedDays, 0)
    const typePossibleDays = rooms.reduce((sum, room) => sum + room.totalDays, 0)
    const typeOccupancyRate = typePossibleDays > 0 ? (typeOccupiedDays / typePossibleDays) * 100 : 0

    return {
      roomType: type,
      roomCount: rooms.length,
      occupancyRate: Math.round(typeOccupancyRate * 100) / 100,
      occupiedDays: typeOccupiedDays,
      possibleDays: typePossibleDays
    }
  })

  return {
    overall: {
      totalRooms,
      totalOccupiedDays,
      totalPossibleDays,
      occupancyRate: Math.round(overallOccupancyRate * 100) / 100
    },
    byRoomType: roomTypeStats.sort((a, b) => b.occupancyRate - a.occupancyRate),
    topPerformingRooms: roomOccupancy
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
      .slice(0, 5),
    lowestPerformingRooms: roomOccupancy
      .sort((a, b) => a.occupancyRate - b.occupancyRate)
      .slice(0, 5)
  }
}