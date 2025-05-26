"use client"

import { useState } from "react"
import { PriceCalculator } from "@/lib/pricing/calculator"
import type { GuestCount, DateRange, PriceBreakdown, RoomUsage, AddonItem } from "@/lib/pricing/types"
import { useRooms } from "./use-rooms"

export function usePricing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getRoomById } = useRooms()

  const calculateBookingPrice = async (params: {
    rooms: string[]
    guests: GuestCount
    dateRange: DateRange
    addons?: AddonItem[]
  }): Promise<PriceBreakdown> => {
    try {
      setLoading(true)
      setError(null)

      // 部屋情報を取得してRoomUsageに変換
      const roomUsages: RoomUsage[] = params.rooms.map((roomId) => {
        const room = getRoomById(roomId)
        if (!room) {
          throw new Error(`部屋が見つかりません: ${roomId}`)
        }

        const totalGuests = Object.values(params.guests).reduce((sum, count) => sum + count, 0)
        const assignedGuests = Math.min(totalGuests, room.capacity)

        return {
          roomId: room.roomId,
          roomType: room.roomType,
          usageType: room.usageType,
          roomRate: room.roomRate,
          assignedGuests,
        }
      })

      // 料金計算エンジンで計算
      const priceBreakdown = PriceCalculator.calculateTotalPrice(
        roomUsages,
        params.guests,
        params.dateRange,
        params.addons || []
      )

      return priceBreakdown
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "料金計算に失敗しました"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const calculateRoomPriceOnly = (roomIds: string[], nights: number): number => {
    try {
      const roomUsages: RoomUsage[] = roomIds.map((roomId) => {
        const room = getRoomById(roomId)
        if (!room) return null

        return {
          roomId: room.roomId,
          roomType: room.roomType,
          usageType: room.usageType,
          roomRate: room.roomRate,
          assignedGuests: 0,
        }
      }).filter((room): room is RoomUsage => room !== null)

      return PriceCalculator.calculateRoomPrice(roomUsages, nights)
    } catch (err) {
      setError(err instanceof Error ? err.message : "室料計算に失敗しました")
      return 0
    }
  }

  const validateGuestCapacity = (roomIds: string[], guests: GuestCount): {
    isValid: boolean
    totalCapacity: number
    totalGuests: number
    message?: string
  } => {
    const totalGuests = Object.values(guests).reduce((sum, count) => sum + count, 0)
    const totalCapacity = roomIds.reduce((sum, roomId) => {
      const room = getRoomById(roomId)
      return sum + (room?.capacity || 0)
    }, 0)

    const isValid = totalGuests <= totalCapacity

    return {
      isValid,
      totalCapacity,
      totalGuests,
      message: isValid 
        ? undefined 
        : `定員超過です。選択した部屋の総定員: ${totalCapacity}名、ゲスト数: ${totalGuests}名`,
    }
  }

  const getPriceDetails = (params: {
    rooms: string[]
    guests: GuestCount
    dateRange: DateRange
  }) => {
    try {
      const roomUsages: RoomUsage[] = params.rooms.map((roomId) => {
        const room = getRoomById(roomId)
        if (!room) {
          throw new Error(`部屋が見つかりません: ${roomId}`)
        }

        return {
          roomId: room.roomId,
          roomType: room.roomType,
          usageType: room.usageType,
          roomRate: room.roomRate,
          assignedGuests: 0,
        }
      })

      return PriceCalculator.getPriceDetails(params.guests, params.dateRange, roomUsages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "料金詳細の取得に失敗しました")
      return {}
    }
  }

  const optimizeRoomSelection = (totalGuests: number, availableRoomIds: string[]): {
    recommendedRooms: string[]
    usageType: "shared" | "private"
    reason: string
  } => {
    const availableRooms = availableRoomIds
      .map((id) => getRoomById(id))
      .filter((room): room is NonNullable<typeof room> => room !== undefined)

    // 大人数の場合は大部屋を優先
    if (totalGuests >= 20) {
      const largeRooms = availableRooms.filter((r) => r.roomType === "large")
      if (largeRooms.length > 0) {
        return {
          recommendedRooms: [largeRooms[0].roomId],
          usageType: "shared",
          reason: `${totalGuests}名の大人数のため、大部屋（${largeRooms[0].name}）をお勧めします。`,
        }
      }
    }

    // 中人数の場合は中部屋を考慮
    if (totalGuests >= 10) {
      const mediumRooms = availableRooms.filter((r) => r.roomType.startsWith("medium"))
      if (mediumRooms.length > 0) {
        const suitableRoom = mediumRooms.find((r) => r.capacity >= totalGuests)
        if (suitableRoom) {
          return {
            recommendedRooms: [suitableRoom.roomId],
            usageType: "shared",
            reason: `${totalGuests}名に適した中部屋（${suitableRoom.name}）をお勧めします。`,
          }
        }
      }
    }

    // 小人数の場合は個室を考慮
    if (totalGuests <= 5) {
      const smallRooms = availableRooms.filter((r) => r.roomType.startsWith("small"))
      const suitableRoom = smallRooms.find((r) => r.capacity >= totalGuests)
      if (suitableRoom) {
        return {
          recommendedRooms: [suitableRoom.roomId],
          usageType: "private",
          reason: `${totalGuests}名の少人数のため、個室（${suitableRoom.name}）をお勧めします。プライベート料金となります。`,
        }
      }
    }

    // 複数部屋の組み合わせ
    const sortedRooms = availableRooms.sort((a, b) => b.capacity - a.capacity)
    const combination: string[] = []
    let remainingGuests = totalGuests

    for (const room of sortedRooms) {
      if (remainingGuests <= 0) break
      combination.push(room.roomId)
      remainingGuests -= room.capacity
    }

    const hasPrivateRooms = combination.some((id) => {
      const room = getRoomById(id)
      return room?.usageType === "private"
    })

    return {
      recommendedRooms: combination,
      usageType: hasPrivateRooms ? "private" : "shared",
      reason: `${totalGuests}名に対して、複数部屋の組み合わせをお勧めします。`,
    }
  }

  return {
    loading,
    error,
    calculateBookingPrice,
    calculateRoomPriceOnly,
    validateGuestCapacity,
    getPriceDetails,
    optimizeRoomSelection,
  }
}