import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type { Database } from "@/lib/supabase/types"

// Supabaseスキーマに合わせた型定義
export type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  project_rooms?: (Database["public"]["Tables"]["project_rooms"]["Row"] & {
    rooms: Database["public"]["Tables"]["rooms"]["Row"]
  })[]
}

// 後方互換性のための旧Booking型（非推奨）
export interface Booking {
  id: string
  customerId: string
  roomId: string
  checkIn: string
  checkOut: string
  guestCount: number
  totalAmount: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  createdAt: string
  updatedAt: string
  notes?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
}

// 廃止予定：顧客情報はプロジェクトに統合
export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  createdAt: string
}

/**
 * Booking store state interface for comprehensive booking and project management
 * 
 * Features:
 * - Project-based booking management (replacing legacy booking system)
 * - Room assignment tracking with detailed project-room relationships
 * - Real-time state management with Zustand
 * - Error handling and loading state management
 * - Persistence support for offline capabilities
 * 
 * Data Structure:
 * - Projects: Main booking entities with guest and financial information
 * - Project Rooms: Many-to-many relationship tracking room assignments
 * - Selected Project: Currently active project for detail views/editing
 * 
 * State Management Features:
 * - Optimistic updates for better UX
 * - Error state management with detailed error messages
 * - Loading states for async operations
 * - Filtering and searching capabilities
 */
interface BookingState {
  // 新しいProject型のリスト
  projects: Project[]
  selectedProject: Project | null
  isLoading: boolean
  error: string | null

  // 新しいActions (Project型)
  /**
   * Sets the complete list of projects, replacing current state
   * 
   * @param projects - Array of Project objects with optional room relationships
   */
  setProjects: (projects: Project[]) => void
  
  /**
   * Adds a new project to the store
   * 
   * @param project - Complete Project object to add to state
   */
  addProject: (project: Project) => void
  
  /**
   * Updates an existing project with partial data
   * 
   * @param id - Project ID to update
   * @param updates - Partial Project object with fields to update
   */
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  setSelectedProject: (project: Project | null) => void

  // 後方互換性のための旧Actions (非推奨)
  bookings: Booking[]
  customers: Customer[]
  selectedBooking: Booking | null
  setBookings: (bookings: Booking[]) => void
  addBooking: (booking: Booking) => void
  updateBooking: (id: string, updates: Partial<Booking>) => void
  deleteBooking: (id: string) => void
  setSelectedBooking: (booking: Booking | null) => void
  setCustomers: (customers: Customer[]) => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Computed (Projectベース)
  getProjectsByDateRange: (startDate: string, endDate: string) => Project[]
  getProjectsByStatus: (status: Project["status"]) => Project[]
  getTotalRevenueFromProjects: () => number
  getOccupancyRateFromProjects: (date: string) => number

  // 後方互換性のためのComputed (非推奨)
  getBookingsByDateRange: (startDate: string, endDate: string) => Booking[]
  getBookingsByStatus: (status: Booking["status"]) => Booking[]
  getTotalRevenue: () => number
  getOccupancyRate: (date: string) => number
}

export const useBookingStore = create<BookingState>()(
  devtools(
    persist(
      (set, get) => ({
        // 新しいProject型のstate
        projects: [],
        selectedProject: null,
        isLoading: false,
        error: null,

        // 新しいProject型のactions
        setProjects: (projects) => set({ projects }),

        addProject: (project) =>
          set((state) => ({
            projects: [...state.projects, project],
          })),

        updateProject: (id, updates) =>
          set((state) => ({
            projects: state.projects.map((project) => (project.id === id ? { ...project, ...updates } : project)),
          })),

        deleteProject: (id) =>
          set((state) => ({
            projects: state.projects.filter((project) => project.id !== id),
          })),

        setSelectedProject: (project) => set({ selectedProject: project }),

        // 後方互換性のための旧state（非推奨）
        bookings: [],
        customers: [],
        selectedBooking: null,

        setBookings: (bookings) => set({ bookings }),
        addBooking: (booking) =>
          set((state) => ({
            bookings: [...state.bookings, booking],
          })),
        updateBooking: (id, updates) =>
          set((state) => ({
            bookings: state.bookings.map((booking) => (booking.id === id ? { ...booking, ...updates } : booking)),
          })),
        deleteBooking: (id) =>
          set((state) => ({
            bookings: state.bookings.filter((booking) => booking.id !== id),
          })),
        setSelectedBooking: (booking) => set({ selectedBooking: booking }),
        setCustomers: (customers) => set({ customers }),
        addCustomer: (customer) =>
          set((state) => ({
            customers: [...state.customers, customer],
          })),
        updateCustomer: (id, updates) =>
          set((state) => ({
            customers: state.customers.map((customer) => (customer.id === id ? { ...customer, ...updates } : customer)),
          })),

        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        // 新しいProject型のcomputed
        getProjectsByDateRange: (startDate, endDate) => {
          const { projects } = get()
          const safeProjects = Array.isArray(projects) ? projects : []
          return safeProjects.filter((project) => {
            const startDateObj = new Date(project.start_date)
            const endDateObj = new Date(project.end_date)
            const filterStart = new Date(startDate)
            const filterEnd = new Date(endDate)

            return (
              (startDateObj >= filterStart && startDateObj <= filterEnd) ||
              (endDateObj >= filterStart && endDateObj <= filterEnd) ||
              (startDateObj <= filterStart && endDateObj >= filterEnd)
            )
          })
        },

        getProjectsByStatus: (status) => {
          const { projects } = get()
          const safeProjects = Array.isArray(projects) ? projects : []
          return safeProjects.filter((project) => project?.status === status)
        },

        getTotalRevenueFromProjects: () => {
          const { projects } = get()
          const safeProjects = Array.isArray(projects) ? projects : []
          return safeProjects
            .filter((project) => project?.status === "completed")
            .reduce((total, project) => total + (project?.total_amount || 0), 0)
        },

        getOccupancyRateFromProjects: (date) => {
          const { projects } = get()
          const safeProjects = Array.isArray(projects) ? projects : []
          const targetDate = new Date(date)
          const occupiedRooms = safeProjects.filter((project) => {
            if (!project?.start_date || !project?.end_date || !project?.status) return false
            const startDate = new Date(project.start_date)
            const endDate = new Date(project.end_date)
            return targetDate >= startDate && targetDate < endDate && project.status === "confirmed"
          }).length

          const totalRooms = 13
          return (occupiedRooms / totalRooms) * 100
        },

        // 後方互換性のためのcomputed (非推奨)
        getBookingsByDateRange: (startDate, endDate) => {
          const { bookings } = get()
          const safeBookings = Array.isArray(bookings) ? bookings : []
          return safeBookings.filter((booking) => {
            const checkIn = new Date(booking.checkIn)
            const checkOut = new Date(booking.checkOut)
            const start = new Date(startDate)
            const end = new Date(endDate)

            return (
              (checkIn >= start && checkIn <= end) ||
              (checkOut >= start && checkOut <= end) ||
              (checkIn <= start && checkOut >= end)
            )
          })
        },

        getBookingsByStatus: (status) => {
          const { bookings } = get()
          const safeBookings = Array.isArray(bookings) ? bookings : []
          return safeBookings.filter((booking) => booking?.status === status)
        },

        getTotalRevenue: () => {
          const { bookings } = get()
          const safeBookings = Array.isArray(bookings) ? bookings : []
          return safeBookings
            .filter((booking) => booking?.status === "completed")
            .reduce((total, booking) => total + (booking?.totalAmount || 0), 0)
        },

        getOccupancyRate: (date) => {
          const { bookings } = get()
          const safeBookings = Array.isArray(bookings) ? bookings : []
          const targetDate = new Date(date)
          const occupiedRooms = safeBookings.filter((booking) => {
            if (!booking?.checkIn || !booking?.checkOut || !booking?.status) return false
            const checkIn = new Date(booking.checkIn)
            const checkOut = new Date(booking.checkOut)
            return targetDate >= checkIn && targetDate < checkOut && booking.status === "confirmed"
          }).length

          const totalRooms = 13
          return (occupiedRooms / totalRooms) * 100
        },
      }),
      {
        name: "booking-store",
        partialize: (state) => ({
          projects: state.projects,
          bookings: state.bookings,
          customers: state.customers,
        }),
      },
    ),
    {
      name: "booking-store",
    },
  ),
)
