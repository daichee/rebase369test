import { create } from "zustand"
import { devtools } from "zustand/middleware"

export interface Room {
  id: string
  name: string
  type: "single" | "double" | "suite" | "family"
  capacity: number
  basePrice: number
  amenities: string[]
  description?: string
  images?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RoomAvailability {
  roomId: string
  date: string
  isAvailable: boolean
  price: number
  reason?: string
}

/**
 * Room store state interface for comprehensive room and availability management
 * 
 * Features:
 * - Complete room inventory management
 * - Real-time availability tracking with date-specific pricing
 * - Room type categorization and filtering
 * - Amenity and feature management
 * - Admin room configuration support
 * 
 * Room Management:
 * - CRUD operations for room data
 * - Room type classification (single, double, suite, family)
 * - Capacity and pricing information
 * - Amenity and description management
 * - Active/inactive status control
 * 
 * Availability System:
 * - Date-specific availability tracking
 * - Dynamic pricing by date and room
 * - Conflict detection and resolution
 * - Booking integration for real-time updates
 */
interface RoomState {
  rooms: Room[]
  availability: RoomAvailability[]
  selectedRoom: Room | null
  isLoading: boolean
  error: string | null

  // Actions
  /**
   * Sets the complete list of rooms
   * 
   * @param rooms - Array of Room objects
   */
  setRooms: (rooms: Room[]) => void
  
  /**
   * Adds a new room to the inventory
   * 
   * @param room - Complete Room object to add
   */
  addRoom: (room: Room) => void
  
  /**
   * Updates an existing room with partial data
   * 
   * @param id - Room ID to update
   * @param updates - Partial Room object with changes
   */
  updateRoom: (id: string, updates: Partial<Room>) => void
  
  /**
   * Removes a room from the inventory
   * 
   * @param id - Room ID to delete
   */
  deleteRoom: (id: string) => void
  
  /**
   * Sets the currently selected room for detail views
   * 
   * @param room - Room object to select or null to clear
   */
  setSelectedRoom: (room: Room | null) => void

  /**
   * Sets availability data for multiple rooms and dates
   * 
   * @param availability - Array of RoomAvailability objects
   */
  setAvailability: (availability: RoomAvailability[]) => void
  
  /**
   * Updates availability for a specific room and date
   * 
   * @param roomId - Room ID to update
   * @param date - Date string (YYYY-MM-DD format)
   * @param isAvailable - Availability status
   * @param price - Optional price override for the date
   */
  updateRoomAvailability: (roomId: string, date: string, isAvailable: boolean, price?: number) => void

  /**
   * Sets loading state for async operations
   * 
   * @param loading - Loading state boolean
   */
  setLoading: (loading: boolean) => void
  
  /**
   * Sets error state with optional message
   * 
   * @param error - Error message or null to clear
   */
  setError: (error: string | null) => void

  // Computed
  /**
   * Gets available rooms for a specific date range
   * 
   * @param checkIn - Check-in date string
   * @param checkOut - Check-out date string
   * @returns Array of available Room objects
   */
  getAvailableRooms: (checkIn: string, checkOut: string) => Room[]
  
  /**
   * Filters rooms by type
   * 
   * @param type - Room type to filter by
   * @returns Array of Room objects matching the type
   */
  getRoomsByType: (type: Room["type"]) => Room[]
  
  /**
   * Gets all active (non-disabled) rooms
   * 
   * @returns Array of active Room objects
   */
  getActiveRooms: () => Room[]
  
  /**
   * Gets availability information for a specific room and date
   * 
   * @param roomId - Room ID to check
   * @param date - Date string to check
   * @returns RoomAvailability object or null if not found
   */
  getRoomAvailability: (roomId: string, date: string) => RoomAvailability | null
}

export const useRoomStore = create<RoomState>()(
  devtools(
    (set, get) => ({
      rooms: [
        {
          id: "1",
          name: "スタンダードルーム A",
          type: "double",
          capacity: 2,
          basePrice: 15000,
          amenities: ["WiFi", "エアコン", "テレビ", "バスルーム"],
          description: "快適なスタンダードルーム",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "ファミリールーム B",
          type: "family",
          capacity: 4,
          basePrice: 25000,
          amenities: ["WiFi", "エアコン", "テレビ", "バスルーム", "キッチン"],
          description: "ファミリー向けの広いお部屋",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "スイートルーム C",
          type: "suite",
          capacity: 2,
          basePrice: 35000,
          amenities: ["WiFi", "エアコン", "テレビ", "バスルーム", "キッチン", "バルコニー"],
          description: "豪華なスイートルーム",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      availability: [],
      selectedRoom: null,
      isLoading: false,
      error: null,

      setRooms: (rooms) => set({ rooms }),

      addRoom: (room) =>
        set((state) => ({
          rooms: [...state.rooms, room],
        })),

      updateRoom: (id, updates) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === id ? { ...room, ...updates, updatedAt: new Date().toISOString() } : room,
          ),
        })),

      deleteRoom: (id) =>
        set((state) => ({
          rooms: state.rooms.filter((room) => room.id !== id),
        })),

      setSelectedRoom: (room) => set({ selectedRoom: room }),

      setAvailability: (availability) => set({ availability }),

      updateRoomAvailability: (roomId, date, isAvailable, price) =>
        set((state) => {
          const existingIndex = state.availability.findIndex((a) => a.roomId === roomId && a.date === date)

          const newAvailability = {
            roomId,
            date,
            isAvailable,
            price: price || state.rooms.find((r) => r.id === roomId)?.basePrice || 0,
          }

          if (existingIndex >= 0) {
            const updated = [...state.availability]
            updated[existingIndex] = newAvailability
            return { availability: updated }
          } else {
            return { availability: [...state.availability, newAvailability] }
          }
        }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      getAvailableRooms: (checkIn, checkOut) => {
        const { rooms, availability } = get()
        const safeRooms = Array.isArray(rooms) ? rooms : []
        const safeAvailability = Array.isArray(availability) ? availability : []
        const checkInDate = new Date(checkIn)
        const checkOutDate = new Date(checkOut)

        return safeRooms.filter((room) => {
          if (!room.isActive) return false

          // チェック期間中の全ての日付で空室かどうか確認
          const currentDate = new Date(checkInDate)
          while (currentDate < checkOutDate) {
            const dateStr = currentDate.toISOString().split("T")[0]
            const roomAvailability = safeAvailability.find((a) => a?.roomId === room?.id && a?.date === dateStr)

            if (roomAvailability && !roomAvailability.isAvailable) {
              return false
            }

            currentDate.setDate(currentDate.getDate() + 1)
          }

          return true
        })
      },

      getRoomsByType: (type) => {
        const { rooms } = get()
        const safeRooms = Array.isArray(rooms) ? rooms : []
        return safeRooms.filter((room) => room?.type === type && room?.isActive)
      },

      getActiveRooms: () => {
        const { rooms } = get()
        const safeRooms = Array.isArray(rooms) ? rooms : []
        return safeRooms.filter((room) => room?.isActive)
      },

      getRoomAvailability: (roomId, date) => {
        const { availability } = get()
        const safeAvailability = Array.isArray(availability) ? availability : []
        return safeAvailability.find((a) => a?.roomId === roomId && a?.date === date) || null
      },
    }),
    {
      name: "room-store",
    },
  ),
)
