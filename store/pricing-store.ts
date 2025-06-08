import { create } from "zustand"
import { devtools } from "zustand/middleware"

export interface PricingRule {
  id: string
  name: string
  type: "seasonal" | "weekday" | "special" | "addon"
  roomType?: string
  startDate?: string
  endDate?: string
  dayOfWeek?: number[]
  multiplier?: number
  fixedAmount?: number
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

export interface PricingCalculation {
  basePrice: number
  appliedRules: Array<{
    ruleId: string
    ruleName: string
    amount: number
    type: "multiplier" | "fixed"
  }>
  totalPrice: number
  breakdown: {
    base: number
    seasonal: number
    weekday: number
    special: number
    addons: number
  }
}

/**
 * Pricing store state interface for dynamic pricing rule management
 * 
 * Features:
 * - Rule-based pricing system with multiple rule types
 * - Seasonal and day-of-week pricing variations
 * - Special event and add-on pricing rules
 * - Priority-based rule application
 * - Real-time calculation and preview
 * 
 * Rule Types:
 * - seasonal: Date range-based pricing adjustments
 * - weekday: Day-of-week specific pricing
 * - special: Event-based or custom pricing rules
 * - addon: Service and amenity pricing
 * 
 * Calculation Features:
 * - Multiplier and fixed amount support
 * - Rule priority and conflict resolution
 * - Detailed pricing breakdown with applied rules
 * - Base price calculation with modifiers
 */
interface PricingState {
  rules: PricingRule[]
  isLoading: boolean
  error: string | null

  // Actions
  /**
   * Sets the complete list of pricing rules
   * 
   * @param rules - Array of PricingRule objects
   */
  setRules: (rules: PricingRule[]) => void
  
  /**
   * Adds a new pricing rule to the store
   * 
   * @param rule - Complete PricingRule object
   */
  addRule: (rule: PricingRule) => void
  
  /**
   * Updates an existing pricing rule
   * 
   * @param id - Rule ID to update
   * @param updates - Partial PricingRule object with changes
   */
  updateRule: (id: string, updates: Partial<PricingRule>) => void
  
  /**
   * Removes a pricing rule from the store
   * 
   * @param id - Rule ID to delete
   */
  deleteRule: (id: string) => void

  /**
   * Sets loading state for async operations
   * 
   * @param loading - Loading state boolean
   */
  setLoading: (loading: boolean) => void
  
  /**
   * Sets error state with optional error message
   * 
   * @param error - Error message string or null to clear
   */
  setError: (error: string | null) => void

  // Calculations
  calculatePrice: (
    roomId: string,
    roomType: string,
    basePrice: number,
    checkIn: string,
    checkOut: string,
    guestCount: number,
  ) => PricingCalculation

  getApplicableRules: (roomType: string, date: string, dayOfWeek: number) => PricingRule[]
}

export const usePricingStore = create<PricingState>()(
  devtools(
    (set, get) => ({
      rules: [
        {
          id: "1",
          name: "夏季料金（7-8月）",
          type: "seasonal",
          startDate: "2024-07-01",
          endDate: "2024-08-31",
          multiplier: 1.3,
          isActive: true,
          priority: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          name: "週末料金",
          type: "weekday",
          dayOfWeek: [5, 6], // 金曜日、土曜日
          multiplier: 1.2,
          isActive: true,
          priority: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "3",
          name: "GW特別料金",
          type: "special",
          startDate: "2024-04-29",
          endDate: "2024-05-05",
          multiplier: 1.5,
          isActive: true,
          priority: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "4",
          name: "朝食オプション",
          type: "addon",
          fixedAmount: 1500,
          isActive: true,
          priority: 10,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,

      setRules: (rules) => set({ rules }),

      addRule: (rule) =>
        set((state) => ({
          rules: [...state.rules, rule],
        })),

      updateRule: (id, updates) =>
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule,
          ),
        })),

      deleteRule: (id) =>
        set((state) => ({
          rules: state.rules.filter((rule) => rule.id !== id),
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      getApplicableRules: (roomType, date, dayOfWeek) => {
        const { rules } = get()
        const safeRules = Array.isArray(rules) ? rules : []
        const targetDate = (() => {
          try {
            return new Date(date)
          } catch {
            return new Date()
          }
        })()

        return safeRules
          .filter((rule) => {
            if (!rule?.isActive) return false

            switch (rule.type) {
              case "seasonal":
                if (rule.startDate && rule.endDate) {
                  const start = new Date(rule.startDate)
                  const end = new Date(rule.endDate)
                  return targetDate >= start && targetDate <= end
                }
                return false

              case "weekday":
                return rule.dayOfWeek?.includes(dayOfWeek) || false

              case "special":
                if (rule.startDate && rule.endDate) {
                  const start = new Date(rule.startDate)
                  const end = new Date(rule.endDate)
                  return targetDate >= start && targetDate <= end
                }
                return false

              case "addon":
                return true

              default:
                return false
            }
          })
          .sort((a, b) => a.priority - b.priority)
      },

      calculatePrice: (roomId, roomType, basePrice, checkIn, checkOut, guestCount) => {
        const { getApplicableRules } = get()
        const checkInDate = (() => {
          try {
            return new Date(checkIn)
          } catch {
            return new Date()
          }
        })()
        const checkOutDate = (() => {
          try {
            return new Date(checkOut)
          } catch {
            return new Date()
          }
        })()
        const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))

        let totalPrice = 0
        const appliedRules: PricingCalculation["appliedRules"] = []
        const breakdown = {
          base: 0,
          seasonal: 0,
          weekday: 0,
          special: 0,
          addons: 0,
        }

        // 各泊の料金を計算
        for (let i = 0; i < nights; i++) {
          const currentDate = new Date(checkInDate)
          currentDate.setDate(currentDate.getDate() + i)
          const dayOfWeek = currentDate.getDay()
          const dateStr = currentDate.toISOString().split("T")[0]

          let nightPrice = basePrice
          const applicableRules = (() => {
            try {
              return getApplicableRules(roomType, dateStr, dayOfWeek) || []
            } catch {
              return []
            }
          })()

          // 乗数ルールを適用
          for (const rule of applicableRules) {
            if (rule.multiplier && rule.type !== "addon") {
              const oldPrice = nightPrice
              nightPrice *= rule.multiplier
              const ruleAmount = nightPrice - oldPrice

              appliedRules.push({
                ruleId: rule.id,
                ruleName: rule.name,
                amount: ruleAmount,
                type: "multiplier",
              })

              // 内訳に追加
              switch (rule.type) {
                case "seasonal":
                  breakdown.seasonal += ruleAmount
                  break
                case "weekday":
                  breakdown.weekday += ruleAmount
                  break
                case "special":
                  breakdown.special += ruleAmount
                  break
              }
            }
          }

          breakdown.base += basePrice
          totalPrice += nightPrice
        }

        // アドオン料金を追加
        const allRules = get().rules || []
        const addonRules = allRules.filter((rule) => rule?.type === "addon" && rule?.isActive)
        for (const rule of addonRules) {
          if (rule.fixedAmount) {
            const addonAmount = rule.fixedAmount * guestCount * nights
            totalPrice += addonAmount
            breakdown.addons += addonAmount

            appliedRules.push({
              ruleId: rule.id,
              ruleName: rule.name,
              amount: addonAmount,
              type: "fixed",
            })
          }
        }

        return {
          basePrice: basePrice * nights,
          appliedRules,
          totalPrice,
          breakdown,
        }
      },
    }),
    {
      name: "pricing-store",
    },
  ),
)
