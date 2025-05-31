"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRooms } from "@/lib/hooks/use-rooms"
import { useBookingStore } from "@/store/booking-store"
import { useMemo } from "react"

interface RoomStatus {
  roomId: string
  name: string
  floor: string
  capacity: number
  status: "occupied" | "available" | "checkout" | "checkin"
  guestName?: string
  guestCount?: number
  checkIn?: string
  checkOut?: string
}

export function RoomStatusGrid() {
  const { rooms, loading } = useRooms()
  const { bookings } = useBookingStore()

  const roomStatuses = useMemo(() => {
    if (!rooms.length) return []

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    return rooms.map((room): RoomStatus => {
      // Find active booking for this room
      const activeBooking = bookings.find(booking => {
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        return (
          booking.roomId === room.roomId &&
          booking.status === 'confirmed' &&
          checkIn <= today &&
          checkOut > today
        )
      })

      if (activeBooking) {
        const checkInDate = new Date(activeBooking.checkIn).toISOString().split('T')[0]
        const checkOutDate = new Date(activeBooking.checkOut).toISOString().split('T')[0]
        
        let status: RoomStatus["status"] = "occupied"
        if (checkInDate === todayStr) status = "checkin"
        else if (checkOutDate === todayStr) status = "checkout"

        return {
          roomId: room.roomId,
          name: room.name,
          floor: room.floor,
          capacity: room.capacity,
          status,
          guestName: activeBooking.guestName || '名前未設定',
          guestCount: activeBooking.guestCount,
          checkIn: activeBooking.checkIn,
          checkOut: activeBooking.checkOut
        }
      }

      return {
        roomId: room.roomId,
        name: room.name,
        floor: room.floor,
        capacity: room.capacity,
        status: "available"
      }
    })
  }, [rooms, bookings])

  const getStatusBadge = (status: RoomStatus["status"]) => {
    switch (status) {
      case "occupied":
        return <Badge variant="destructive">使用中</Badge>
      case "available":
        return <Badge variant="outline">空室</Badge>
      case "checkin":
        return <Badge className="bg-blue-500 hover:bg-blue-600">チェックイン</Badge>
      case "checkout":
        return <Badge className="bg-orange-500 hover:bg-orange-600">チェックアウト</Badge>
    }
  }

  const getStatusColor = (status: RoomStatus["status"]) => {
    switch (status) {
      case "occupied":
        return "border-red-200 bg-red-50"
      case "available":
        return "border-green-200 bg-green-50"
      case "checkin":
        return "border-blue-200 bg-blue-50"
      case "checkout":
        return "border-orange-200 bg-orange-50"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>部屋状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 13 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group by floor
  const floorGroups = roomStatuses.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = []
    acc[room.floor].push(room)
    return acc
  }, {} as Record<string, RoomStatus[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>部屋状況</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(floorGroups).map(([floor, rooms]) => (
          <div key={floor}>
            <h3 className="font-medium text-sm text-muted-foreground mb-3">{floor}</h3>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {rooms.map((room) => (
                <div
                  key={room.roomId}
                  className={`p-3 rounded border-2 transition-colors ${getStatusColor(room.status)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{room.name}</span>
                    {getStatusBadge(room.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    定員: {room.capacity}名
                  </div>
                  {room.guestName && (
                    <>
                      <div className="text-xs font-medium mt-1">
                        {room.guestName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {room.guestCount}名
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}