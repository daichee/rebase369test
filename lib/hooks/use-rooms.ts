"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Room {
  roomId: string
  name: string
  floor: string
  capacity: number
  roomType: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c"
  roomRate: number
  usageType: "shared" | "private"
  isActive: boolean
  amenities: string[]
  description?: string
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("is_active", true)
        .order("floor", { ascending: true })
        .order("room_id", { ascending: true })

      if (fetchError) throw fetchError
      
      // Map database fields to component interface
      const mappedRooms = data?.map((room) => ({
        roomId: room.room_id,
        name: room.name,
        floor: room.floor,
        capacity: room.capacity,
        roomType: room.room_type,
        roomRate: room.room_rate,
        usageType: room.usage_type,
        isActive: room.is_active,
        amenities: room.amenities || [],
        description: room.description
      })) || []
      setRooms(mappedRooms)
    } catch (err) {
      setError(err instanceof Error ? err.message : "部屋データの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const getRoomsByFloor = (floor: "2F" | "3F") => {
    return rooms.filter((room) => room.floor === floor)
  }

  const getRoomById = (roomId: string) => {
    return rooms.find((room) => room.roomId === roomId)
  }

  const getLargeRooms = () => {
    return rooms.filter((room) => room.roomType === "large")
  }

  const getMediumRooms = () => {
    return rooms.filter((room) => room.roomType.startsWith("medium"))
  }

  const getSmallRooms = () => {
    return rooms.filter((room) => room.roomType.startsWith("small"))
  }

  const getAvailableCapacity = (roomIds: string[]) => {
    return roomIds.reduce((total, roomId) => {
      const room = getRoomById(roomId)
      return total + (room?.capacity || 0)
    }, 0)
  }

  return {
    rooms,
    loading,
    error,
    refetch: fetchRooms,
    getRoomsByFloor,
    getRoomById,
    getLargeRooms,
    getMediumRooms,
    getSmallRooms,
    getAvailableCapacity,
  }
}