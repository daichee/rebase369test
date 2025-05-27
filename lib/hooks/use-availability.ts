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
  partialAvailability?: {
    availableDates: string[]
    conflictDates: string[]
    suggestionScore: number
  }
  suggestionScore?: number
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

  const checkPartialAvailability = async (
    roomIds: string[],
    dateRange: DateRange
  ): Promise<AvailabilityCheck[]> => {
    try {
      setLoading(true)
      setError(null)

      // 部分的な空室状況をチェック
      const results = await checkAvailability(roomIds, dateRange)
      
      // 部分利用可能な部屋を詳細分析
      const enhancedResults = await Promise.all(results.map(async (result) => {
        if (!result.isAvailable) {
          // 部分利用可能かチェック
          const partialInfo = await analyzePartialAvailability(result.roomId, dateRange)
          return {
            ...result,
            partialAvailability: partialInfo,
            suggestionScore: partialInfo ? partialInfo.suggestionScore : 0
          }
        }
        return {
          ...result,
          suggestionScore: 10 // 完全に利用可能な場合は最高スコア
        }
      }))

      return enhancedResults
    } catch (err) {
      setError(err instanceof Error ? err.message : "部分空室チェックに失敗しました")
      return []
    } finally {
      setLoading(false)
    }
  }

  const analyzePartialAvailability = async (
    roomId: string,
    dateRange: DateRange
  ) => {
    // 指定期間の日付を生成
    const requestedDates = generateDateRange(dateRange.startDate, dateRange.endDate)
    
    // 各日の予約状況をチェック
    const { data: conflicts } = await supabase
      .from("project_rooms")
      .select(`
        room_id,
        projects!inner(
          start_date,
          end_date,
          status
        )
      `)
      .eq("room_id", roomId)
      .neq("projects.status", "cancelled")

    const occupiedDates = new Set<string>()
    conflicts?.forEach(conflict => {
      const conflictDates = generateDateRange(
        conflict.projects?.start_date || "",
        conflict.projects?.end_date || ""
      )
      conflictDates.forEach(date => occupiedDates.add(date))
    })

    const availableDates = requestedDates.filter(date => !occupiedDates.has(date))
    const conflictDates = requestedDates.filter(date => occupiedDates.has(date))

    if (availableDates.length > 0 && conflictDates.length > 0) {
      return {
        availableDates,
        conflictDates,
        suggestionScore: (availableDates.length / requestedDates.length) * 10
      }
    }

    return null
  }

  const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates: string[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current < end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  const findIntelligentAlternatives = async (
    requestedCapacity: number,
    dateRange: DateRange,
    searchMode: "standard" | "flexible" | "intelligent" = "standard"
  ) => {
    try {
      const alternatives = []

      // 標準的な代替案
      const basicAlternatives = await suggestAlternativeRooms(requestedCapacity, dateRange)
      
      if (searchMode === "intelligent" || searchMode === "flexible") {
        // 前後2週間の日程提案
        for (let offset = 1; offset <= 14; offset++) {
          const newStart = new Date(dateRange.startDate)
          newStart.setDate(newStart.getDate() + offset)
          
          const newEnd = new Date(dateRange.endDate)
          newEnd.setDate(newEnd.getDate() + offset)

          const newDateRange = {
            startDate: newStart.toISOString().split('T')[0],
            endDate: newEnd.toISOString().split('T')[0],
            nights: dateRange.nights
          }

          const altAvailability = await checkAvailability(
            rooms.map(r => r.roomId),
            newDateRange
          )

          const availableCount = altAvailability.filter(a => a.isAvailable).length
          if (availableCount > 0) {
            // 平日かどうかで優先度決定
            const dayOfWeek = newStart.getDay()
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 4
            
            alternatives.push({
              type: "alternative_dates",
              dateRange: newDateRange,
              availableRooms: availableCount,
              priority: offset <= 7 ? "high" : "medium",
              score: isWeekday ? 8 : 6,
              description: `${offset}日${offset > 0 ? '後' : '前'}の${isWeekday ? '平日' : '週末'}プラン`
            })
          }
        }
      }

      return alternatives.slice(0, 6) // 最大6件の提案
    } catch (err) {
      setError(err instanceof Error ? err.message : "代替案の検索に失敗しました")
      return []
    }
  }

  const analyzeRoomCombinations = async (
    requestedCapacity: number,
    dateRange: DateRange
  ) => {
    try {
      const availability = await checkAvailability(
        rooms.map(r => r.roomId),
        dateRange
      )

      const availableRooms = availability
        .filter(a => a.isAvailable)
        .map(a => rooms.find(r => r.roomId === a.roomId))
        .filter(room => room !== undefined)

      // 動的プログラミングで最適な組み合わせを探す
      const optimalCombination = findOptimalCombination(availableRooms as any[], requestedCapacity)
      
      return optimalCombination ? {
        rooms: optimalCombination,
        totalCapacity: optimalCombination.reduce((sum, room) => sum + room.capacity, 0),
        efficiency: requestedCapacity / optimalCombination.reduce((sum, room) => sum + room.capacity, 0),
        roomCount: optimalCombination.length
      } : null
    } catch (err) {
      setError(err instanceof Error ? err.message : "部屋組み合わせ分析に失敗しました")
      return null
    }
  }

  const findOptimalCombination = (availableRooms: any[], targetCapacity: number) => {
    // 簡易版の最適化アルゴリズム
    const sortedRooms = availableRooms.sort((a, b) => b.capacity - a.capacity)
    const combination = []
    let remainingCapacity = targetCapacity

    for (const room of sortedRooms) {
      if (remainingCapacity <= 0) break
      if (room.capacity <= remainingCapacity * 1.5) { // 効率的な組み合わせのみ
        combination.push(room)
        remainingCapacity -= room.capacity
      }
    }

    return remainingCapacity <= 0 ? combination : null
  }

  return {
    loading,
    error,
    checkAvailability,
    checkPartialAvailability,
    getOccupancyStats,
    preventDoubleBooking,
    suggestAlternativeRooms,
    findIntelligentAlternatives,
    analyzeRoomCombinations,
  }
}