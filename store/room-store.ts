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

interface RoomState {
  rooms: Room[]
  availability: RoomAvailability[]
  selectedRoom: Room | null
  isLoading: boolean
  error: string | null

  // Actions
  setRooms: (rooms: Room[]) => void
  addRoom: (room: Room) => void
  updateRoom: (id: string, updates: Partial<Room>) => void
  deleteRoom: (id: string) => void
  setSelectedRoom: (room: Room | null) => void

  setAvailability: (availability: RoomAvailability[]) => void
  updateRoomAvailability: (roomId: string, date: string, isAvailable: boolean, price?: number) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Computed
  getAvailableRooms: (checkIn: string, checkOut: string) => Room[]
  getRoomsByType: (type: Room["type"]) => Room[]
  getActiveRooms: () => Room[]
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
          createdAt: "2025-05-30T00:00:00.000Z",
          updatedAt: "2025-05-30T00:00:00.000Z",
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
          createdAt: "2025-05-30T00:00:00.000Z",
          updatedAt: "2025-05-30T00:00:00.000Z",
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
          createdAt: "2025-05-30T00:00:00.000Z",
          updatedAt: "2025-05-30T00:00:00.000Z",
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
