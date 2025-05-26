"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ShoppingCart, Utensils, Building, Laptop } from "lucide-react"
import type { GuestCount } from "@/lib/pricing/types"

interface AddonSelectorProps {
  selectedAddons: any[]
  onChange: (selectedAddons: any[]) => void
  guests: GuestCount
  dateRange: {
    startDate: string
    endDate: string
    nights: number
  }
}

const ADDON_CATEGORIES = {
  meal: {
    icon: Utensils,
    title: "食事オプション",
    description: "朝食・夕食・BBQなど",
  },
  facility: {
    icon: Building,
    title: "施設利用",
    description: "会議室・体育館など",
  },
  equipment: {
    icon: Laptop,
    title: "備品レンタル",
    description: "プロジェクター・音響機器など",
  },
}

const AVAILABLE_ADDONS = [
  {
    id: "breakfast",
    category: "meal",
    name: "朝食",
    description: "和食または洋食",
    rates: { adult: 700, student: 700, child: 700, infant: 700 },
    unit: "人・回",
  },
  {
    id: "dinner",
    category: "meal", 
    name: "夕食",
    description: "お弁当または定食",
    rates: { adult: 1500, student: 1000, child: 800, infant: 800 },
    unit: "人・回",
  },
  {
    id: "bbq",
    category: "meal",
    name: "BBQ",
    description: "屋外バーベキュー（10名以上）",
    rates: { adult: 3000, student: 2200, child: 1500, infant: 1500 },
    unit: "人・回",
    minQuantity: 10,
  },
  {
    id: "meeting_room",
    category: "facility",
    name: "会議室",
    description: "個人料金 + 室料 + エアコン代",
    personalFees: { under5h: 200, under10h: 400, over10h: 600 },
    roomFees: { 
      weekdayGuest: 1000, 
      weekdayOther: 1500, 
      weekendGuest: 1500, 
      weekendOther: 2000 
    },
    airconFee: 500,
    unit: "時間",
  },
  {
    id: "gymnasium",
    category: "facility",
    name: "体育館",
    description: "個人料金 + 室料 + エアコン代",
    personalFees: { all: 500 },
    roomFees: { 
      weekdayGuest: 2000, 
      weekdayOther: 3500, 
      weekendGuest: 2500, 
      weekendOther: 4500 
    },
    airconFee: 1500,
    unit: "時間",
  },
  {
    id: "projector",
    category: "equipment",
    name: "プロジェクター",
    description: "会議・プレゼンテーション用",
    rate: 3000,
    unit: "台・泊",
    maxQuantity: 3,
  },
]

export function AddonSelector({ selectedAddons, onChange, guests, dateRange }: AddonSelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("meal")

  const totalGuests = Object.values(guests).reduce((sum, count) => sum + count, 0)

  const handleAddonToggle = (addonId: string) => {
    const existing = selectedAddons.find((addon) => addon.addonId === addonId)
    
    if (existing) {
      onChange(selectedAddons.filter((addon) => addon.addonId !== addonId))
    } else {
      const addonConfig = AVAILABLE_ADDONS.find((addon) => addon.id === addonId)
      if (!addonConfig) return

      const newAddon = {
        addonId,
        category: addonConfig.category,
        name: addonConfig.name,
        quantity: addonConfig.category === "meal" ? totalGuests : 1,
        unitPrice: addonConfig.category === "equipment" ? addonConfig.rate : 0,
        totalPrice: 0,
        ageBreakdown: addonConfig.category === "meal" ? { ...guests } : undefined,
        facilityUsage: addonConfig.category === "facility" ? { 
          hours: 4, 
          guestType: "guest" as const 
        } : undefined,
      }

      onChange([...selectedAddons, newAddon])
    }
  }

  const updateAddonQuantity = (addonId: string, quantity: number) => {
    onChange(
      selectedAddons.map((addon) =>
        addon.addonId === addonId ? { ...addon, quantity: Math.max(0, quantity) } : addon
      )
    )
  }

  const updateAgeBreakdown = (addonId: string, ageGroup: string, count: number) => {
    onChange(
      selectedAddons.map((addon) =>
        addon.addonId === addonId
          ? {
              ...addon,
              ageBreakdown: {
                ...addon.ageBreakdown,
                [ageGroup]: Math.max(0, count),
              },
            }
          : addon
      )
    )
  }

  const calculateAddonPrice = (addon: any) => {
    const config = AVAILABLE_ADDONS.find((a) => a.id === addon.addonId)
    if (!config) return 0

    if (config.category === "meal" && config.rates && addon.ageBreakdown) {
      return Object.entries(addon.ageBreakdown).reduce((total, [ageGroup, count]) => {
        const rate = config.rates[ageGroup as keyof typeof config.rates] || 0
        return total + rate * (count as number)
      }, 0)
    }

    if (config.category === "equipment") {
      return config.rate * addon.quantity * dateRange.nights
    }

    if (config.category === "facility" && addon.facilityUsage) {
      // 施設料金の計算は複雑なので簡略化
      const personalFee = config.personalFees?.all || 400
      const roomFee = 2000 // 平均的な室料
      const airconFee = config.airconFee * addon.facilityUsage.hours
      
      return personalFee * totalGuests + roomFee * addon.facilityUsage.hours + airconFee
    }

    return 0
  }

  const getTotalAddonPrice = () => {
    return selectedAddons.reduce((total, addon) => total + calculateAddonPrice(addon), 0)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            オプションサービス
          </CardTitle>
          <CardDescription>
            必要に応じて追加サービスを選択してください。すべて任意です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* オプション料金合計 */}
          {selectedAddons.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">オプション合計</span>
                  <span className="font-semibold">¥{getTotalAddonPrice().toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* カテゴリ別オプション */}
          {Object.entries(ADDON_CATEGORIES).map(([categoryKey, category]) => {
            const Icon = category.icon
            const categoryAddons = AVAILABLE_ADDONS.filter((addon) => addon.category === categoryKey)
            const isExpanded = expandedCategory === categoryKey

            return (
              <Card key={categoryKey}>
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {category.title}
                    </div>
                    <Badge variant="outline">
                      {selectedAddons.filter((a) => a.category === categoryKey).length} 選択中
                    </Badge>
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {categoryAddons.map((addonConfig) => {
                      const selectedAddon = selectedAddons.find((a) => a.addonId === addonConfig.id)
                      const isSelected = !!selectedAddon

                      return (
                        <Card key={addonConfig.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleAddonToggle(addonConfig.id)}
                                />
                                <div>
                                  <h4 className="font-medium">{addonConfig.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {addonConfig.description}
                                  </p>
                                </div>
                              </div>

                              {isSelected && (
                                <Badge className="bg-green-100 text-green-800">
                                  ¥{calculateAddonPrice(selectedAddon).toLocaleString()}
                                </Badge>
                              )}
                            </div>

                            {/* 年齢区分別設定（食事） */}
                            {isSelected && addonConfig.category === "meal" && addonConfig.rates && (
                              <div className="ml-6 space-y-2">
                                <p className="text-sm font-medium">年齢区分別人数</p>
                                <div className="grid grid-cols-2 gap-3">
                                  {Object.entries(addonConfig.rates).map(([ageGroup, rate]) => (
                                    <div key={ageGroup} className="flex items-center justify-between">
                                      <span className="text-sm">
                                        {ageGroup === "adult" ? "大人" : 
                                         ageGroup === "student" ? "学生" :
                                         ageGroup === "child" ? "小学生" : "未就学児"}
                                        (¥{rate})
                                      </span>
                                      <Input
                                        type="number"
                                        className="w-16 text-center"
                                        value={selectedAddon?.ageBreakdown?.[ageGroup] || 0}
                                        onChange={(e) => 
                                          updateAgeBreakdown(
                                            addonConfig.id, 
                                            ageGroup, 
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        min="0"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 数量設定（備品） */}
                            {isSelected && addonConfig.category === "equipment" && (
                              <div className="ml-6 flex items-center gap-3">
                                <span className="text-sm">数量:</span>
                                <Input
                                  type="number"
                                  className="w-20 text-center"
                                  value={selectedAddon?.quantity || 1}
                                  onChange={(e) => 
                                    updateAddonQuantity(addonConfig.id, parseInt(e.target.value) || 1)
                                  }
                                  min="1"
                                  max={addonConfig.maxQuantity || 10}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {addonConfig.unit}
                                </span>
                              </div>
                            )}

                            {/* 利用時間設定（施設） */}
                            {isSelected && addonConfig.category === "facility" && (
                              <div className="ml-6 flex items-center gap-3">
                                <span className="text-sm">利用時間:</span>
                                <Input
                                  type="number"
                                  className="w-20 text-center"
                                  value={selectedAddon?.facilityUsage?.hours || 4}
                                  onChange={(e) => {
                                    const newAddon = {
                                      ...selectedAddon,
                                      facilityUsage: {
                                        ...selectedAddon.facilityUsage,
                                        hours: parseInt(e.target.value) || 4,
                                      },
                                    }
                                    onChange(
                                      selectedAddons.map((a) => 
                                        a.addonId === addonConfig.id ? newAddon : a
                                      )
                                    )
                                  }}
                                  min="1"
                                  max="24"
                                />
                                <span className="text-sm text-muted-foreground">時間</span>
                              </div>
                            )}
                          </div>
                        </Card>
                      )
                    })}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}