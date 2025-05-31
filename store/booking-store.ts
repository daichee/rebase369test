import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

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
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  createdAt: string
}

interface BookingState {
  bookings: Booking[]
  customers: Customer[]
  selectedBooking: Booking | null
  isLoading: boolean
  error: string | null

  // Actions
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

  // Computed
  getBookingsByDateRange: (startDate: string, endDate: string) => Booking[]
  getBookingsByStatus: (status: Booking["status"]) => Booking[]
  getTotalRevenue: () => number
  getOccupancyRate: (date: string) => number
}

export const useBookingStore = create<BookingState>()(
  devtools(
    persist(
      (set, get) => ({
        bookings: [],
        customers: [],
        selectedBooking: null,
        isLoading: false,
        error: null,

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

          // 総部屋数を13として計算（実際の部屋数に応じて調整）
          const totalRooms = 13
          return (occupiedRooms / totalRooms) * 100
        },
      }),
      {
        name: "booking-store",
        partialize: (state) => ({
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
