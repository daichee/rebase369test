"use client"

import { useState, useEffect } from "react"
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

// Available addons will be loaded from API

export function AddonSelector({ selectedAddons, onChange, guests, dateRange }: AddonSelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("meal")
  const [availableAddons, setAvailableAddons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load addons from API
  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const response = await fetch('/api/booking/options')
        const result = await response.json()
        
        if (result.success) {
          setAvailableAddons(result.data)
        } else {
          console.error('Failed to fetch addons:', result.error)
        }
      } catch (error) {
        console.error('Error fetching addons:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAddons()
  }, [])

  const totalGuests = Object.values(guests).reduce((sum, count) => sum + count, 0)

  const handleAddonToggle = (addonId: string) => {
    const existing = selectedAddons.find((addon) => addon.addonId === addonId)
    
    if (existing) {
      onChange(selectedAddons.filter((addon) => addon.addonId !== addonId))
    } else {
      const addonConfig = availableAddons.find((addon) => addon.id === addonId)
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
    const config = availableAddons.find((a) => a.id === addon.addonId)
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
      // Full facility calculation based on database structure
      const personalFee = config.personalFees?.under5h || 400
      const roomFee = config.roomFees?.weekdayGuest || 2000 // Default to weekday guest rate
      const airconFee = config.airconFee * addon.facilityUsage.hours
      
      return personalFee * totalGuests + roomFee * addon.facilityUsage.hours + airconFee
    }

    return 0
  }

  const getTotalAddonPrice = () => {
    return selectedAddons.reduce((total, addon) => total + calculateAddonPrice(addon), 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              オプションサービス
            </CardTitle>
            <CardDescription>オプションを読み込み中...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
                  <span className="font-semibold">¥{(getTotalAddonPrice() || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* カテゴリ別オプション */}
          {Object.entries(ADDON_CATEGORIES).map(([categoryKey, category]) => {
            const Icon = category.icon
            const categoryAddons = availableAddons.filter((addon) => addon.category === categoryKey)
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
                                  ¥{(calculateAddonPrice(selectedAddon) || 0).toLocaleString()}
                                </Badge>
                              )}
                            </div>

                            {/* 年齢区分別設定（食事） */}
                            {isSelected && addonConfig.category === "meal" && addonConfig.rates && (
                              <div className="ml-6 space-y-2">
                                <p className="text-sm font-medium">年齢区分別人数</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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