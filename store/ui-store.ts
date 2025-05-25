import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface UIState {
  // Navigation
  currentPage: string
  sidebarOpen: boolean

  // Modals
  isBookingModalOpen: boolean
  isCustomerModalOpen: boolean
  isRoomModalOpen: boolean

  // Loading states
  isGlobalLoading: boolean
  loadingStates: Record<string, boolean>

  // Notifications
  notifications: Array<{
    id: string
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
    timestamp: number
  }>

  // Calendar view
  calendarView: "month" | "week" | "day"
  selectedDate: string

  // Actions
  setCurrentPage: (page: string) => void
  setSidebarOpen: (open: boolean) => void

  setBookingModalOpen: (open: boolean) => void
  setCustomerModalOpen: (open: boolean) => void
  setRoomModalOpen: (open: boolean) => void

  setGlobalLoading: (loading: boolean) => void
  setLoadingState: (key: string, loading: boolean) => void

  addNotification: (notification: Omit<UIState["notifications"][0], "id" | "timestamp">) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  setCalendarView: (view: UIState["calendarView"]) => void
  setSelectedDate: (date: string) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      currentPage: "dashboard",
      sidebarOpen: true,

      isBookingModalOpen: false,
      isCustomerModalOpen: false,
      isRoomModalOpen: false,

      isGlobalLoading: false,
      loadingStates: {},

      notifications: [],

      calendarView: "month",
      selectedDate: new Date().toISOString().split("T")[0],

      setCurrentPage: (page) => set({ currentPage: page }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setBookingModalOpen: (open) => set({ isBookingModalOpen: open }),
      setCustomerModalOpen: (open) => set({ isCustomerModalOpen: open }),
      setRoomModalOpen: (open) => set({ isRoomModalOpen: open }),

      setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
      setLoadingState: (key, loading) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, [key]: loading },
        })),

      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9)
        const timestamp = Date.now()
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id, timestamp }],
        }))

        // 5秒後に自動削除
        setTimeout(() => {
          get().removeNotification(id)
        }, 5000)
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      setCalendarView: (view) => set({ calendarView: view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: "ui-store",
    },
  ),
)
