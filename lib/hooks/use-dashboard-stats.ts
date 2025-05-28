"use client"

import { useMemo } from "react"
import { useRealtimeBookings } from "./use-realtime-bookings"
import { useRooms } from "./use-rooms"
import { useBookingStore } from "@/store/booking-store"

export interface DashboardStats {
  todayOccupancy: {
    percentage: number
    occupiedRooms: number
    totalRooms: number
  }
  weeklyOccupancy: {
    percentage: number
    occupiedDays: number
    totalDays: number
  }
  monthlyOccupancy: {
    percentage: number
    occupiedDays: number
    totalDays: number
  }
  monthlySales: {
    total: number
    previousMonth: number
    changePercentage: number
  }
  monthlyBookings: {
    count: number
    previousMonth: number
    changePercentage: number
  }
  averagePrice: {
    amount: number
    previousMonth: number
    changePercentage: number
  }
  todayCheckIns: Array<{
    id: string
    guestName: string
    roomId: string
    roomName: string
    guestCount: number
    checkIn: string
  }>
  todayCheckOuts: Array<{
    id: string
    guestName: string
    roomId: string
    roomName: string
    guestCount: number
    checkOut: string
  }>
  salesChartData: Array<{
    date: string
    sales: number
    bookings: number
  }>
}

export function useDashboardStats(): {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
} {
  useRealtimeBookings() // Initialize real-time connection
  const { rooms, loading: roomsLoading } = useRooms()
  const { bookings } = useBookingStore()

  const stats = useMemo(() => {
    if (roomsLoading || !rooms.length) return null

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // Get current month and previous month data
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Filter bookings by time periods
    const todayBookings = bookings.filter(booking => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      return (
        booking.status === 'confirmed' &&
        checkIn <= today &&
        checkOut > today
      )
    })

    // Calculate today's occupancy
    const todayOccupancy = {
      percentage: Math.round((todayBookings.length / rooms.length) * 100),
      occupiedRooms: todayBookings.length,
      totalRooms: rooms.length
    }

    // Calculate weekly occupancy (last 7 days)
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 6)
    let weeklyOccupiedDays = 0
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekStart)
      checkDate.setDate(weekStart.getDate() + i)
      const hasBooking = bookings.some(booking => {
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        return (
          booking.status === 'confirmed' &&
          checkIn <= checkDate &&
          checkOut > checkDate
        )
      })
      if (hasBooking) weeklyOccupiedDays++
    }

    const weeklyOccupancy = {
      percentage: Math.round((weeklyOccupiedDays / 7) * 100),
      occupiedDays: weeklyOccupiedDays,
      totalDays: 7
    }

    // Calculate monthly occupancy
    const monthStart = new Date(currentYear, currentMonth, 1)
    const monthEnd = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = monthEnd.getDate()
    let monthlyOccupiedDays = 0
    
    for (let i = 1; i <= daysInMonth; i++) {
      const checkDate = new Date(currentYear, currentMonth, i)
      const hasBooking = bookings.some(booking => {
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        return (
          booking.status === 'confirmed' &&
          checkIn <= checkDate &&
          checkOut > checkDate
        )
      })
      if (hasBooking) monthlyOccupiedDays++
    }

    const monthlyOccupancy = {
      percentage: Math.round((monthlyOccupiedDays / daysInMonth) * 100),
      occupiedDays: monthlyOccupiedDays,
      totalDays: daysInMonth
    }

    // Calculate current month sales
    const currentMonthBookings = bookings.filter(booking => {
      const checkIn = new Date(booking.checkIn)
      return (
        booking.status === 'confirmed' &&
        checkIn.getMonth() === currentMonth &&
        checkIn.getFullYear() === currentYear
      )
    })

    // Calculate previous month sales
    const previousMonthBookings = bookings.filter(booking => {
      const checkIn = new Date(booking.checkIn)
      return (
        booking.status === 'confirmed' &&
        checkIn.getMonth() === previousMonth &&
        checkIn.getFullYear() === previousMonthYear
      )
    })

    const currentMonthSales = currentMonthBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    const previousMonthSales = previousMonthBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    const salesChangePercentage = previousMonthSales > 0 ? Math.round(((currentMonthSales - previousMonthSales) / previousMonthSales) * 100) : 0

    const monthlySales = {
      total: currentMonthSales,
      previousMonth: previousMonthSales,
      changePercentage: salesChangePercentage
    }

    // Calculate booking counts
    const bookingsChangePercentage = previousMonthBookings.length > 0 
      ? Math.round(((currentMonthBookings.length - previousMonthBookings.length) / previousMonthBookings.length) * 100) 
      : 0

    const monthlyBookings = {
      count: currentMonthBookings.length,
      previousMonth: previousMonthBookings.length,
      changePercentage: bookingsChangePercentage
    }

    // Calculate average price
    const currentAvgPrice = currentMonthBookings.length > 0 ? currentMonthSales / currentMonthBookings.length : 0
    const previousAvgPrice = previousMonthBookings.length > 0 ? previousMonthSales / previousMonthBookings.length : 0
    const avgPriceChangePercentage = previousAvgPrice > 0 ? Math.round(((currentAvgPrice - previousAvgPrice) / previousAvgPrice) * 100) : 0

    const averagePrice = {
      amount: Math.round(currentAvgPrice),
      previousMonth: Math.round(previousAvgPrice),
      changePercentage: avgPriceChangePercentage
    }

    // Today's check-ins
    const todayCheckIns = bookings
      .filter(booking => {
        const checkIn = new Date(booking.checkIn)
        return (
          booking.status === 'confirmed' &&
          checkIn.toISOString().split('T')[0] === todayStr
        )
      })
      .map(booking => {
        const room = rooms.find(r => r.roomId === booking.roomId)
        return {
          id: booking.id,
          guestName: booking.guestName || '名前未設定',
          roomId: booking.roomId,
          roomName: room?.name || booking.roomId,
          guestCount: booking.guestCount,
          checkIn: booking.checkIn
        }
      })

    // Today's check-outs
    const todayCheckOuts = bookings
      .filter(booking => {
        const checkOut = new Date(booking.checkOut)
        return (
          booking.status === 'confirmed' &&
          checkOut.toISOString().split('T')[0] === todayStr
        )
      })
      .map(booking => {
        const room = rooms.find(r => r.roomId === booking.roomId)
        return {
          id: booking.id,
          guestName: booking.guestName || '名前未設定',
          roomId: booking.roomId,
          roomName: room?.name || booking.roomId,
          guestCount: booking.guestCount,
          checkOut: booking.checkOut
        }
      })

    // Generate sales chart data for last 30 days
    const salesChartData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayBookings = bookings.filter(booking => {
        const checkIn = new Date(booking.checkIn)
        return (
          booking.status === 'confirmed' &&
          checkIn.toISOString().split('T')[0] === dateStr
        )
      })
      
      salesChartData.push({
        date: dateStr,
        sales: dayBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
        bookings: dayBookings.length
      })
    }

    return {
      todayOccupancy,
      weeklyOccupancy,
      monthlyOccupancy,
      monthlySales,
      monthlyBookings,
      averagePrice,
      todayCheckIns,
      todayCheckOuts,
      salesChartData
    }
  }, [bookings, rooms, roomsLoading])

  return {
    stats,
    loading: roomsLoading,
    error: null
  }
}