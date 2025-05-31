"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calculator, Settings } from "lucide-react"
import { PersonalPricingMatrix } from "./personal-pricing-matrix"
import { RoomPricingManager } from "./room-pricing-manager"
import { SeasonPeriodManager } from "./season-period-manager"
import { PriceCalculator } from "@/lib/pricing/calculator"

interface PricingSimulation {
  guests: {
    adult: number
    adult_leader: number
    student: number
    child: number
    infant: number
    baby: number
  }
  rooms: {
    roomType: string
    count: number
  }[]
  dateRange: {
    startDate: string
    endDate: string
    nights: number
  }
}

export function EnhancedPricingMatrix() {
  const [activeTab, setActiveTab] = useState("personal")
  const [simulation, setSimulation] = useState<PricingSimulation>({
    guests: {
      adult: 2,
      adult_leader: 0,
      student: 0,
      child: 1,
      infant: 0,
      baby: 0
    },
    rooms: [
      { roomType: "large", count: 1 }
    ],
    dateRange: {
      startDate: "2024-06-01",
      endDate: "2024-06-03",
      nights: 2
    }
  })

  const calculateSimulation = () => {
    try {
      // TODO: 実際の計算を実装
      const roomUsage = simulation.rooms.map(room => ({
        roomId: `sim_${room.roomType}`,
        roomType: room.roomType as any,
        usageType: room.roomType.startsWith('small') ? 'private' as const : 'shared' as const,
        roomRate: 10000, // デフォルト値
        assignedGuests: Object.values(simulation.guests).reduce((sum, count) => sum + count, 0),
        capacity: 20 // デフォルト値
      }))

      const result = PriceCalculator.calculateTotalPrice(
        roomUsage,
        simulation.guests,
        simulation.dateRange,
        [] // no addons for simulation
      )

      return result
    } catch (error) {
      console.error("Calculation error:", error)
      return null
    }
  }

  const simulationResult = calculateSimulation()

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            料金設定管理
          </CardTitle>
          <CardDescription>
            Rebase369の料金体系を管理します。個人料金・部屋料金・季節期間を個別に設定できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">個別値方式</div>
              <div className="text-sm text-muted-foreground">係数計算ではなく絶対値で設定</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">柔軟な季節設定</div>
              <div className="text-sm text-muted-foreground">期間を自由に設定可能</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">見積明細対応</div>
              <div className="text-sm text-muted-foreground">項目別の詳細保存</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メインタブ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">個人料金</TabsTrigger>
          <TabsTrigger value="room">部屋料金</TabsTrigger>
          <TabsTrigger value="season">季節期間</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <PersonalPricingMatrix />
        </TabsContent>

        <TabsContent value="room" className="space-y-6">
          <RoomPricingManager />
        </TabsContent>

        <TabsContent value="season" className="space-y-6">
          <SeasonPeriodManager />
        </TabsContent>
      </Tabs>

      {/* 料金シミュレーション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            料金シミュレーション
          </CardTitle>
          <CardDescription>
            設定した料金での実際の計算結果をプレビューできます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* シミュレーション設定 */}
            <div className="space-y-4">
              <h4 className="font-semibold">シミュレーション条件</h4>
              
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="text-sm">
                  <strong>人数構成:</strong>
                  <ul className="mt-1 space-y-1">
                    {Object.entries(simulation.guests).map(([type, count]) => {
                      if (count > 0) {
                        const labels = {
                          adult: "大人",
                          adult_leader: "大人（付添）",
                          student: "学生",
                          child: "小学生",
                          infant: "幼児",
                          baby: "乳児"
                        }
                        return (
                          <li key={type}>
                            {labels[type as keyof typeof labels]}: {count}名
                          </li>
                        )
                      }
                      return null
                    })}
                  </ul>
                </div>
                
                <div className="text-sm">
                  <strong>宿泊期間:</strong> {simulation.dateRange.startDate} ～ {simulation.dateRange.endDate} ({simulation.dateRange.nights}泊)
                </div>
                
                <div className="text-sm">
                  <strong>部屋利用:</strong>
                  <ul className="mt-1">
                    {simulation.rooms.map((room, index) => (
                      <li key={index}>
                        {room.roomType}: {room.count}室
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* シミュレーション結果 */}
            <div className="space-y-4">
              <h4 className="font-semibold">計算結果</h4>
              
              {simulationResult ? (
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-center">
                    ¥{simulationResult.total.toLocaleString()}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>室料:</span>
                      <span>¥{simulationResult.roomAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>個人料金:</span>
                      <span>¥{simulationResult.guestAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>オプション:</span>
                      <span>¥{simulationResult.addonAmount.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>合計:</span>
                      <span>¥{simulationResult.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {simulationResult.lineItems && simulationResult.lineItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">明細項目:</div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {simulationResult.lineItems.slice(0, 5).map((item, index) => (
                          <div key={index} className="text-xs flex justify-between">
                            <span className="truncate">{item.description}</span>
                            <span>¥{item.subtotal.toLocaleString()}</span>
                          </div>
                        ))}
                        {simulationResult.lineItems.length > 5 && (
                          <div className="text-xs text-muted-foreground text-center">
                            他 {simulationResult.lineItems.length - 5} 項目...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-800">
                    計算エラーが発生しました。設定を確認してください。
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* システム情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">システム情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <strong>計算方式:</strong>
              <Badge variant="outline" className="ml-2">個別値方式</Badge>
            </div>
            <div>
              <strong>実装状況:</strong>
              <Badge variant="default" className="ml-2">新システム対応済み</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}