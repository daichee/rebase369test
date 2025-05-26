"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRooms } from "./use-rooms"

export interface DateRange {
  startDate: string
  endDate: string
  nights: number
}

export interface AvailabilityCheck {
  roomId: string
  isAvailable: boolean
  conflictingBookings: string[]
  availableCapacity: number
}

export interface OccupancyStats {
  totalRooms: number
  occupiedRooms: number
  occupancyRate: number
  totalCapacity: number
  occupiedCapacity: number
  guestOccupancyRate: number
}

export function useAvailability() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { rooms } = useRooms()

  const supabase = createClient()

  const checkAvailability = async (
    roomIds: string[],
    dateRange: DateRange,
    excludeBookingId?: string
  ): Promise<AvailabilityCheck[]> => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from("project_rooms")
        .select(`
          room_id,
          project_id,
          projects!inner(
            id,
            start_date,
            end_date,
            status,
            guest_name
          )
        `)
        .in("room_id", roomIds)
        .neq("projects.status", "cancelled")
        .or(
          `and(projects.start_date.lte.${dateRange.endDate},projects.end_date.gt.${dateRange.startDate})`
        )

      if (excludeBookingId) {
        query = query.neq("project_id", excludeBookingId)
      }

      const { data: conflicts, error: queryError } = await query

      if (queryError) throw queryError

      return roomIds.map((roomId) => {
        const roomConflicts = conflicts?.filter((c) => c.room_id === roomId) || []
        const room = rooms.find((r) => r.roomId === roomId)

        return {
          roomId,
          isAvailable: roomConflicts.length === 0,
          conflictingBookings: roomConflicts.map((c) => c.projects?.guest_name || "不明"),
          availableCapacity: roomConflicts.length === 0 ? room?.capacity || 0 : 0,
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "空室チェックに失敗しました")
      return roomIds.map((roomId) => ({
        roomId,
        isAvailable: false,
        conflictingBookings: [],
        availableCapacity: 0,
      }))
    } finally {
      setLoading(false)
    }
  }

  const getOccupancyStats = async (dateRange: DateRange): Promise<OccupancyStats> => {
    try {
      const { data: bookings, error: queryError } = await supabase
        .from("project_rooms")
        .select(`
          room_id,
          assigned_pax,
          projects!inner(
            start_date,
            end_date,
            status
          )
        `)
        .neq("projects.status", "cancelled")
        .or(
          `and(projects.start_date.lte.${dateRange.endDate},projects.end_date.gt.${dateRange.startDate})`
        )

      if (queryError) throw queryError

      const totalRooms = rooms.length
      const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0)

      const occupiedRoomIds = new Set(bookings?.map((b) => b.room_id) || [])
      const occupiedRooms = occupiedRoomIds.size

      const occupiedCapacity = bookings?.reduce((sum, booking) => sum + booking.assigned_pax, 0) || 0

      return {
        totalRooms,
        occupiedRooms,
        occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
        totalCapacity,
        occupiedCapacity,
        guestOccupancyRate: totalCapacity > 0 ? (occupiedCapacity / totalCapacity) * 100 : 0,
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "稼働率の取得に失敗しました")
      return {
        totalRooms: 0,
        occupiedRooms: 0,
        occupancyRate: 0,
        totalCapacity: 0,
        occupiedCapacity: 0,
        guestOccupancyRate: 0,
      }
    }
  }

  const preventDoubleBooking = async (roomIds: string[], dateRange: DateRange): Promise<boolean> => {
    const availability = await checkAvailability(roomIds, dateRange)
    return availability.every((check) => check.isAvailable)
  }

  const suggestAlternativeRooms = async (
    requestedCapacity: number,
    dateRange: DateRange
  ): Promise<string[]> => {
    try {
      const availability = await checkAvailability(
        rooms.map((r) => r.roomId),
        dateRange
      )

      const availableRooms = availability
        .filter((check) => check.isAvailable)
        .map((check) => rooms.find((r) => r.roomId === check.roomId))
        .filter((room): room is NonNullable<typeof room> => room !== undefined)

      // 単一部屋で対応可能
      const singleRoomOptions = availableRooms
        .filter((room) => room.capacity >= requestedCapacity)
        .sort((a, b) => a.capacity - b.capacity) // 最小の適切な部屋を優先

      if (singleRoomOptions.length > 0) {
        return [singleRoomOptions[0].roomId]
      }

      // 複数部屋の組み合わせを提案
      const sortedRooms = availableRooms.sort((a, b) => b.capacity - a.capacity)
      const combination: string[] = []
      let remainingCapacity = requestedCapacity

      for (const room of sortedRooms) {
        if (remainingCapacity <= 0) break
        combination.push(room.roomId)
        remainingCapacity -= room.capacity
      }

      return remainingCapacity <= 0 ? combination : []
    } catch (err) {
      setError(err instanceof Error ? err.message : "代替案の提案に失敗しました")
      return []
    }
  }

  return {
    loading,
    error,
    checkAvailability,
    getOccupancyStats,
    preventDoubleBooking,
    suggestAlternativeRooms,
  }
}