"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, TrendingUp, Calendar, Users } from "lucide-react"
import { PriceCalculator } from "@/lib/pricing/calculator"
import type { GuestCount, DateRange, RoomUsage, AddonItem, PriceBreakdown } from "@/lib/pricing/types"

interface PriceCalculatorProps {
  rooms: RoomUsage[]
  guests: GuestCount
  dateRange: DateRange
  addons?: AddonItem[]
  onPriceChange?: (breakdown: PriceBreakdown) => void
}

export function PriceCalculatorComponent({
  rooms,
  guests,
  dateRange,
  addons = [],
  onPriceChange,
}: PriceCalculatorProps) {
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // 料金計算実行
  useEffect(() => {
    const calculatePrice = async () => {
      if (rooms.length === 0 || dateRange.nights <= 0) {
        setPriceBreakdown(null)
        return
      }

      setIsCalculating(true)

      try {
        // 少し遅延を入れてリアルタイム感を演出
        await new Promise((resolve) => setTimeout(resolve, 300))

        const breakdown = PriceCalculator.calculateTotalPrice(rooms, guests, dateRange, addons)

        setPriceBreakdown(breakdown)
        onPriceChange?.(breakdown)
      } catch (error) {
        console.error("料金計算エラー:", error)
      } finally {
        setIsCalculating(false)
      }
    }

    calculatePrice()
  }, [rooms, guests, dateRange, addons, onPriceChange])

  if (!priceBreakdown) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            料金計算
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {isCalculating ? "計算中..." : "条件を入力してください"}
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          料金計算結果
          {isCalculating && <Badge variant="secondary">計算中</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">合計</TabsTrigger>
            <TabsTrigger value="breakdown">内訳</TabsTrigger>
            <TabsTrigger value="daily">日別</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">室料:</span>
                <span className="text-sm">{formatCurrency(priceBreakdown.roomAmount)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">個人料金:</span>
                <span className="text-sm">{formatCurrency(priceBreakdown.guestAmount)}</span>
              </div>

              {priceBreakdown.addonAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">オプション:</span>
                  <span className="text-sm">{formatCurrency(priceBreakdown.addonAmount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>合計金額:</span>
                <span className="text-primary">{formatCurrency(priceBreakdown.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{dateRange.nights}</div>
                <div className="text-xs text-muted-foreground">泊数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(guests).reduce((sum, count) => sum + count, 0)}
                </div>
                <div className="text-xs text-muted-foreground">総人数</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="space-y-4">
              {/* 室料詳細 */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  室料詳細
                </h4>
                <div className="space-y-2 pl-6">
                  {rooms.map((room, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {room.roomId} ({dateRange.nights}泊)
                      </span>
                      <span>{formatCurrency(room.roomRate * dateRange.nights)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 個人料金詳細 */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  個人料金詳細
                </h4>
                <div className="space-y-2 pl-6">
                  {Object.entries(guests).map(([ageGroup, count]) => {
                    if (count === 0) return null

                    const ageLabels = {
                      adult: "大人",
                      adult_leader: "大人(付添)",
                      student: "学生",
                      child: "小学生",
                      infant: "未就学児",
                      baby: "乳幼児",
                    }

                    return (
                      <div key={ageGroup} className="flex justify-between text-sm">
                        <span>
                          {ageLabels[ageGroup as keyof typeof ageLabels]} × {count}名
                        </span>
                        <span>計算中</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* オプション詳細 */}
              {addons.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    オプション詳細
                  </h4>
                  <div className="space-y-2 pl-6">
                    {addons.map((addon, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {addon.name} × {addon.quantity}
                        </span>
                        <span>{formatCurrency(addon.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <div className="space-y-3">
              {priceBreakdown.dailyBreakdown.map((daily, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{new Date(daily.date).toLocaleDateString("ja-JP")}</span>
                    <div className="flex gap-2">
                      <Badge variant={daily.dayType === "weekend" ? "default" : "secondary"}>
                        {daily.dayType === "weekend" ? "休日" : "平日"}
                      </Badge>
                      <Badge variant={daily.season === "peak" ? "destructive" : "outline"}>
                        {daily.season === "peak" ? "繁忙期" : "通常期"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>室料:</span>
                      <span>{formatCurrency(daily.roomAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>個人料金:</span>
                      <span>{formatCurrency(daily.guestAmount)}</span>
                    </div>
                    {daily.addonAmount > 0 && (
                      <div className="flex justify-between">
                        <span>オプション:</span>
                        <span>{formatCurrency(daily.addonAmount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>小計:</span>
                      <span>{formatCurrency(daily.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
