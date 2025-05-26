"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

export interface AvailabilityCheck {
  roomId: string
  dateRange: {
    start: string
    end: string
  }
}

export interface AvailabilityResult {
  roomId: string
  isAvailable: boolean
  conflictingBookings?: {
    projectId: string
    guestName: string
    checkIn: string
    checkOut: string
  }[]
  occupancyRate: number
}

export interface OccupancyStats {
  overall: number
  byRoom: Record<string, number>
  byDate: Record<string, number>
}

export function useAvailability() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const checkAvailability = async (checks: AvailabilityCheck[]): Promise<AvailabilityResult[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const results: AvailabilityResult[] = []
      
      for (const check of checks) {
        // 指定期間中の既存予約を取得
        const { data: conflicts, error } = await supabase
          .from("projects")
          .select(`
            id,
            guest_name,
            start_date,
            end_date,
            status,
            project_rooms!inner(room_id)
          `)
          .eq("project_rooms.room_id", check.roomId)
          .in("status", ["confirmed", "draft"])
          .or(`
            and(start_date.lte.${check.dateRange.end},end_date.gt.${check.dateRange.start})
          `)

        if (error) throw error

        const isAvailable = !conflicts || conflicts.length === 0
        const conflictingBookings = conflicts?.map(booking => ({
          projectId: booking.id,
          guestName: booking.guest_name,
          checkIn: booking.start_date,
          checkOut: booking.end_date
        })) || []

        results.push({
          roomId: check.roomId,
          isAvailable,
          conflictingBookings: conflictingBookings.length > 0 ? conflictingBookings : undefined,
          occupancyRate: 0 // 後で計算
        })
      }

      return results
    } catch (error) {
      console.error("空室チェックに失敗:", error)
      setError("空室チェックに失敗しました")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const checkRoomAvailability = async (
    roomId: string, 
    startDate: string, 
    endDate: string
  ): Promise<boolean> => {
    try {
      const results = await checkAvailability([{
        roomId,
        dateRange: { start: startDate, end: endDate }
      }])
      
      return results[0]?.isAvailable || false
    } catch (error) {
      console.error("部屋の空室チェックに失敗:", error)
      return false
    }
  }

  const getOccupancyStats = async (
    startDate: string, 
    endDate: string
  ): Promise<OccupancyStats> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // 期間内の全予約を取得
      const { data: bookings, error: bookingsError } = await supabase
        .from("projects")
        .select(`
          start_date,
          end_date,
          status,
          project_rooms(room_id)
        `)
        .in("status", ["confirmed", "draft"])
        .lte("start_date", endDate)
        .gte("end_date", startDate)

      if (bookingsError) throw bookingsError

      // 全部屋を取得
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("room_id")
        .eq("is_active", true)

      if (roomsError) throw roomsError

      // 稼働率計算
      const totalRooms = rooms.length
      const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      const totalRoomNights = totalRooms * totalDays

      let occupiedRoomNights = 0
      const byRoom: Record<string, number> = {}
      const byDate: Record<string, number> = {}

      // 部屋別・日別稼働率計算
      rooms.forEach(room => {
        byRoom[room.room_id] = 0
      })

      bookings?.forEach(booking => {
        booking.project_rooms.forEach(roomAssignment => {
          const checkIn = new Date(booking.start_date)
          const checkOut = new Date(booking.end_date)
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
          
          occupiedRoomNights += nights
          byRoom[roomAssignment.room_id] = (byRoom[roomAssignment.room_id] || 0) + nights
          
          // 日別稼働率
          const currentDate = new Date(checkIn)
          while (currentDate < checkOut) {
            const dateStr = currentDate.toISOString().split('T')[0]
            byDate[dateStr] = (byDate[dateStr] || 0) + 1
            currentDate.setDate(currentDate.getDate() + 1)
          }
        })
      })

      // パーセンテージに変換
      const overall = totalRoomNights > 0 ? (occupiedRoomNights / totalRoomNights) * 100 : 0
      
      Object.keys(byRoom).forEach(roomId => {
        byRoom[roomId] = totalDays > 0 ? (byRoom[roomId] / totalDays) * 100 : 0
      })

      Object.keys(byDate).forEach(date => {
        byDate[date] = totalRooms > 0 ? (byDate[date] / totalRooms) * 100 : 0
      })

      return {
        overall: Math.round(overall * 100) / 100,
        byRoom,
        byDate
      }
    } catch (error) {
      console.error("稼働率の取得に失敗:", error)
      setError("稼働率の取得に失敗しました")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const preventDoubleBooking = async (
    roomId: string,
    startDate: string,
    endDate: string,
    excludeProjectId?: string
  ): Promise<{ isValid: boolean; conflicts: string[] }> => {
    try {
      let query = supabase
        .from("projects")
        .select(`
          id,
          guest_name,
          project_rooms!inner(room_id)
        `)
        .eq("project_rooms.room_id", roomId)
        .in("status", ["confirmed", "draft"])
        .or(`
          and(start_date.lt.${endDate},end_date.gt.${startDate})
        `)

      if (excludeProjectId) {
        query = query.neq("id", excludeProjectId)
      }

      const { data: conflicts, error } = await query

      if (error) throw error

      const isValid = !conflicts || conflicts.length === 0
      const conflictMessages = conflicts?.map(booking => 
        `${booking.guest_name}様の予約と重複しています`
      ) || []

      return {
        isValid,
        conflicts: conflictMessages
      }
    } catch (error) {
      console.error("重複予約チェックに失敗:", error)
      return {
        isValid: false,
        conflicts: ["重複予約チェックに失敗しました"]
      }
    }
  }

  return {
    isLoading,
    error,
    checkAvailability,
    checkRoomAvailability,
    getOccupancyStats,
    preventDoubleBooking
  }
}