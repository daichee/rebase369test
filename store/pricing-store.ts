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

interface PricingState {
  rules: PricingRule[]
  isLoading: boolean
  error: string | null

  // Actions
  setRules: (rules: PricingRule[]) => void
  addRule: (rule: PricingRule) => void
  updateRule: (id: string, updates: Partial<PricingRule>) => void
  deleteRule: (id: string) => void

  setLoading: (loading: boolean) => void
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "週末料金",
          type: "weekday",
          dayOfWeek: [5, 6], // 金曜日、土曜日
          multiplier: 1.2,
          isActive: true,
          priority: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "4",
          name: "朝食オプション",
          type: "addon",
          fixedAmount: 1500,
          isActive: true,
          priority: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
        const targetDate = new Date(date)

        return rules
          .filter((rule) => {
            if (!rule.isActive) return false

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
        const checkInDate = new Date(checkIn)
        const checkOutDate = new Date(checkOut)
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

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
          const applicableRules = getApplicableRules(roomType, dateStr, dayOfWeek)

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
        const addonRules = get().rules.filter((rule) => rule.type === "addon" && rule.isActive)
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
