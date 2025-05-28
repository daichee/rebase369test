"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Save, RefreshCw } from "lucide-react"
import type { GuestRateMatrix } from "@/lib/pricing/types"

// デフォルト個人料金マトリクス（実際の料金表から）
const DEFAULT_RATES: GuestRateMatrix[] = [
  // 大部屋・中部屋（共同利用）
  { matrixId: "shared_adult_weekday_off", ageGroup: "adult", usageType: "shared", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 4800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_adult_weekday_on", ageGroup: "adult", usageType: "shared", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 5800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_adult_weekend_off", ageGroup: "adult", usageType: "shared", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 5800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_adult_weekend_on", ageGroup: "adult", usageType: "shared", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 7000, effectiveFrom: "2024-01-01", isActive: true },
  
  { matrixId: "shared_student_weekday_off", ageGroup: "student", usageType: "shared", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 4000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_student_weekday_on", ageGroup: "student", usageType: "shared", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 4800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_student_weekend_off", ageGroup: "student", usageType: "shared", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 4800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_student_weekend_on", ageGroup: "student", usageType: "shared", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 5800, effectiveFrom: "2024-01-01", isActive: true },

  { matrixId: "shared_child_weekday_off", ageGroup: "child", usageType: "shared", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 3200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_child_weekday_on", ageGroup: "child", usageType: "shared", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 3800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_child_weekend_off", ageGroup: "child", usageType: "shared", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 3800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_child_weekend_on", ageGroup: "child", usageType: "shared", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 4600, effectiveFrom: "2024-01-01", isActive: true },

  { matrixId: "shared_infant_weekday_off", ageGroup: "infant", usageType: "shared", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 2500, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_infant_weekday_on", ageGroup: "infant", usageType: "shared", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 3000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_infant_weekend_off", ageGroup: "infant", usageType: "shared", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 3000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_infant_weekend_on", ageGroup: "infant", usageType: "shared", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 3600, effectiveFrom: "2024-01-01", isActive: true },

  // 個室利用
  { matrixId: "private_adult_weekday_off", ageGroup: "adult", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 8500, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_adult_weekday_on", ageGroup: "adult", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 10200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_adult_weekend_off", ageGroup: "adult", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 10200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_adult_weekend_on", ageGroup: "adult", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 12200, effectiveFrom: "2024-01-01", isActive: true },

  // 個室利用（付添）
  { matrixId: "private_adult_leader_weekday_off", ageGroup: "adult", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: true, price: 6800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_adult_leader_weekday_on", ageGroup: "adult", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: true, price: 8200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_adult_leader_weekend_off", ageGroup: "adult", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: true, price: 8200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_adult_leader_weekend_on", ageGroup: "adult", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: true, price: 9800, effectiveFrom: "2024-01-01", isActive: true },

  { matrixId: "private_student_weekday_off", ageGroup: "student", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 5900, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_student_weekday_on", ageGroup: "student", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 7100, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_student_weekend_off", ageGroup: "student", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 7100, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_student_weekend_on", ageGroup: "student", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 8500, effectiveFrom: "2024-01-01", isActive: true },

  { matrixId: "private_child_weekday_off", ageGroup: "child", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 5000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_child_weekday_on", ageGroup: "child", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 6000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_child_weekend_off", ageGroup: "child", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 6000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_child_weekend_on", ageGroup: "child", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 7200, effectiveFrom: "2024-01-01", isActive: true },

  { matrixId: "private_infant_weekday_off", ageGroup: "infant", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 4200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_infant_weekday_on", ageGroup: "infant", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 5000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_infant_weekend_off", ageGroup: "infant", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 5000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_infant_weekend_on", ageGroup: "infant", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 6000, effectiveFrom: "2024-01-01", isActive: true },

  // 乳児は常に0円
  { matrixId: "shared_baby_weekday_off", ageGroup: "baby", usageType: "shared", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_baby_weekday_on", ageGroup: "baby", usageType: "shared", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_baby_weekend_off", ageGroup: "baby", usageType: "shared", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "shared_baby_weekend_on", ageGroup: "baby", usageType: "shared", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_baby_weekday_off", ageGroup: "baby", usageType: "private", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_baby_weekday_on", ageGroup: "baby", usageType: "private", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_baby_weekend_off", ageGroup: "baby", usageType: "private", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "private_baby_weekend_on", ageGroup: "baby", usageType: "private", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
]

const ageGroupLabels = {
  adult: "大人",
  student: "学生",
  child: "小学生",
  infant: "幼児",
  baby: "乳児"
}

const dayTypeLabels = {
  weekday: "平日",
  weekend: "週末・祝日"
}

const seasonTypeLabels = {
  off_season: "オフシーズン",
  on_season: "オンシーズン"
}

export function PersonalPricingMatrix() {
  const [rates, setRates] = useState<GuestRateMatrix[]>(DEFAULT_RATES)
  const [selectedUsageType, setSelectedUsageType] = useState<"shared" | "private">("shared")
  const [hasChanges, setHasChanges] = useState(false)

  const getRate = (
    ageGroup: string,
    dayType: string,
    seasonType: string,
    isLeader: boolean = false
  ) => {
    return rates.find(r => 
      r.ageGroup === ageGroup &&
      r.usageType === selectedUsageType &&
      r.dayType === dayType &&
      r.seasonType === seasonType &&
      r.isLeader === isLeader &&
      r.isActive
    )
  }

  const updateRate = (
    ageGroup: string,
    dayType: string,
    seasonType: string,
    newPrice: number,
    isLeader: boolean = false
  ) => {
    setRates(rates.map(rate => {
      if (
        rate.ageGroup === ageGroup &&
        rate.usageType === selectedUsageType &&
        rate.dayType === dayType &&
        rate.seasonType === seasonType &&
        rate.isLeader === isLeader
      ) {
        return { ...rate, price: newPrice }
      }
      return rate
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    // TODO: APIに保存
    console.log("Saving rates:", rates)
    setHasChanges(false)
  }

  const handleReset = () => {
    setRates(DEFAULT_RATES)
    setHasChanges(false)
  }

  const renderPriceInput = (
    ageGroup: string,
    dayType: string,
    seasonType: string,
    isLeader: boolean = false
  ) => {
    const rate = getRate(ageGroup, dayType, seasonType, isLeader)
    const price = rate?.price || 0

    return (
      <Input
        type="number"
        value={price}
        onChange={(e) => updateRate(ageGroup, dayType, seasonType, parseInt(e.target.value) || 0, isLeader)}
        className="w-24 text-right"
        disabled={ageGroup === "baby"} // 乳児は常に0円
      />
    )
  }

  const ageGroups = ["adult", "student", "child", "infant", "baby"]
  const dayTypes = ["weekday", "weekend"]
  const seasonTypes = ["off_season", "on_season"]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              個人料金マトリクス
            </CardTitle>
            <CardDescription>
              年齢区分・曜日・シーズン別の個人料金を設定します
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              <RefreshCw className="mr-2 h-4 w-4" />
              リセット
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="mr-2 h-4 w-4" />
              保存
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedUsageType} onValueChange={(value) => setSelectedUsageType(value as "shared" | "private")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shared">大部屋・中部屋（共同利用）</TabsTrigger>
            <TabsTrigger value="private">個室</TabsTrigger>
          </TabsList>

          <TabsContent value="shared" className="space-y-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                大部屋・中部屋を利用する場合の個人料金です。
              </div>
              
              {seasonTypes.map((seasonType) => (
                <div key={seasonType} className="space-y-2">
                  <h4 className="font-semibold flex items-center">
                    {seasonTypeLabels[seasonType]}
                    <Badge variant={seasonType === "on_season" ? "default" : "secondary"} className="ml-2">
                      {seasonType === "on_season" ? "ハイシーズン" : "通常シーズン"}
                    </Badge>
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>年齢区分</TableHead>
                        {dayTypes.map((dayType) => (
                          <TableHead key={dayType} className="text-center">
                            {dayTypeLabels[dayType]}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ageGroups.map((ageGroup) => (
                        <TableRow key={ageGroup}>
                          <TableCell className="font-medium">
                            {ageGroupLabels[ageGroup as keyof typeof ageGroupLabels]}
                          </TableCell>
                          {dayTypes.map((dayType) => (
                            <TableCell key={dayType} className="text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <span className="text-sm">¥</span>
                                {renderPriceInput(ageGroup, dayType, seasonType)}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="private" className="space-y-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                個室を利用する場合の個人料金です。大人は通常料金と付添料金があります。
              </div>
              
              {seasonTypes.map((seasonType) => (
                <div key={seasonType} className="space-y-2">
                  <h4 className="font-semibold flex items-center">
                    {seasonTypeLabels[seasonType]}
                    <Badge variant={seasonType === "on_season" ? "default" : "secondary"} className="ml-2">
                      {seasonType === "on_season" ? "ハイシーズン" : "通常シーズン"}
                    </Badge>
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>年齢区分</TableHead>
                        {dayTypes.map((dayType) => (
                          <TableHead key={dayType} className="text-center">
                            {dayTypeLabels[dayType]}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* 大人（通常） */}
                      <TableRow>
                        <TableCell className="font-medium">
                          {ageGroupLabels.adult}
                        </TableCell>
                        {dayTypes.map((dayType) => (
                          <TableCell key={dayType} className="text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="text-sm">¥</span>
                              {renderPriceInput("adult", dayType, seasonType, false)}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                      
                      {/* 大人（付添） */}
                      <TableRow>
                        <TableCell className="font-medium">
                          {ageGroupLabels.adult}（付添）
                        </TableCell>
                        {dayTypes.map((dayType) => (
                          <TableCell key={dayType} className="text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="text-sm">¥</span>
                              {renderPriceInput("adult", dayType, seasonType, true)}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* その他の年齢区分 */}
                      {ageGroups.filter(age => age !== "adult").map((ageGroup) => (
                        <TableRow key={ageGroup}>
                          <TableCell className="font-medium">
                            {ageGroupLabels[ageGroup as keyof typeof ageGroupLabels]}
                          </TableCell>
                          {dayTypes.map((dayType) => (
                            <TableCell key={dayType} className="text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <span className="text-sm">¥</span>
                                {renderPriceInput(ageGroup, dayType, seasonType)}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {hasChanges && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              料金に変更があります。忘れずに保存してください。
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}