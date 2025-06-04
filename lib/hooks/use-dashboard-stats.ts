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
  const { projects } = useBookingStore()

  const stats = useMemo(() => {
    if (roomsLoading || !rooms.length) return null

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // Get current month and previous month data
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Filter projects by time periods
    const todayBookings = projects.filter(project => {
      const checkIn = new Date(project.start_date)
      const checkOut = new Date(project.end_date)
      return (
        project.status === 'confirmed' &&
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
      const hasBooking = projects.some(project => {
        const checkIn = new Date(project.start_date)
        const checkOut = new Date(project.end_date)
        return (
          project.status === 'confirmed' &&
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
      const hasBooking = projects.some(project => {
        const checkIn = new Date(project.start_date)
        const checkOut = new Date(project.end_date)
        return (
          project.status === 'confirmed' &&
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
    const currentMonthBookings = projects.filter(project => {
      const checkIn = new Date(project.start_date)
      return (
        project.status === 'confirmed' &&
        checkIn.getMonth() === currentMonth &&
        checkIn.getFullYear() === currentYear
      )
    })

    // Calculate previous month sales
    const previousMonthBookings = projects.filter(project => {
      const checkIn = new Date(project.start_date)
      return (
        project.status === 'confirmed' &&
        checkIn.getMonth() === previousMonth &&
        checkIn.getFullYear() === previousMonthYear
      )
    })

    const currentMonthSales = currentMonthBookings.reduce((sum, project) => sum + (project.total_amount || 0), 0)
    const previousMonthSales = previousMonthBookings.reduce((sum, project) => sum + (project.total_amount || 0), 0)
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
    const todayCheckIns = projects
      .filter(project => {
        const checkIn = new Date(project.start_date)
        return (
          project.status === 'confirmed' &&
          checkIn.toISOString().split('T')[0] === todayStr
        )
      })
      .map(project => {
        // Get the first room from project_rooms if available
        const room = project.project_rooms?.[0]?.rooms || rooms[0]
        return {
          id: project.id,
          guestName: project.guest_name || '名前未設定',
          roomId: room?.roomId || 'TBD',
          roomName: room?.name || 'TBD',
          guestCount: project.pax_total || 0,
          checkIn: project.start_date
        }
      })

    // Today's check-outs
    const todayCheckOuts = projects
      .filter(project => {
        const checkOut = new Date(project.end_date)
        return (
          project.status === 'confirmed' &&
          checkOut.toISOString().split('T')[0] === todayStr
        )
      })
      .map(project => {
        // Get the first room from project_rooms if available
        const room = project.project_rooms?.[0]?.rooms || rooms[0]
        return {
          id: project.id,
          guestName: project.guest_name || '名前未設定',
          roomId: room?.roomId || 'TBD',
          roomName: room?.name || 'TBD',
          guestCount: project.pax_total || 0,
          checkOut: project.end_date
        }
      })

    // Generate sales chart data for last 60 days and next 30 days (90 days total)
    const salesChartData = []
    for (let i = 59; i >= -30; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      // Find all projects that have stay periods overlapping with this date
      const dayProjects = projects.filter(project => {
        if (project.status !== 'confirmed') return false
        
        const checkIn = new Date(project.start_date)
        const checkOut = new Date(project.end_date)
        const targetDate = new Date(dateStr)
        
        // Check if the target date falls within the stay period
        return targetDate >= checkIn && targetDate < checkOut
      })
      
      // For sales, distribute the total amount across the stay period
      let dailySales = 0
      let dailyBookings = 0
      
      dayProjects.forEach(project => {
        const checkIn = new Date(project.start_date)
        const checkOut = new Date(project.end_date)
        const stayDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        
        if (stayDays > 0) {
          // Distribute total amount across stay days
          dailySales += (project.total_amount || 0) / stayDays
        }
        
        // Count booking only on check-in day
        const targetDate = new Date(dateStr)
        if (checkIn.toISOString().split('T')[0] === dateStr) {
          dailyBookings += 1
        }
      })
      
      salesChartData.push({
        date: dateStr,
        sales: Math.round(dailySales),
        bookings: dailyBookings
      })
    }

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard Stats - Projects count:', projects.length)
      console.log('Dashboard Stats - Confirmed projects:', projects.filter(p => p.status === 'confirmed').length)
      console.log('Dashboard Stats - Sales chart data length:', salesChartData.length)
      console.log('Dashboard Stats - Sample chart data:', salesChartData.slice(0, 5))
      console.log('Dashboard Stats - Chart data with sales:', salesChartData.filter(d => d.sales > 0))
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
  }, [projects, rooms, roomsLoading])

  return {
    stats,
    loading: roomsLoading,
    error: null
  }
}