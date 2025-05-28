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

// デフォルト個人料金マトリクス（部屋タイプ別・実際の料金表から）
const DEFAULT_RATES: GuestRateMatrix[] = [
  // 大部屋（large）
  { matrixId: "large_adult_weekday_off", ageGroup: "adult", roomType: "large", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 4800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_adult_weekday_on", ageGroup: "adult", roomType: "large", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 5800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_adult_weekend_off", ageGroup: "adult", roomType: "large", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 5800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_adult_weekend_on", ageGroup: "adult", roomType: "large", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 7000, effectiveFrom: "2024-01-01", isActive: true },
  
  { matrixId: "large_student_weekday_off", ageGroup: "student", roomType: "large", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 4000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_student_weekday_on", ageGroup: "student", roomType: "large", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 4800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_student_weekend_off", ageGroup: "student", roomType: "large", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 4800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_student_weekend_on", ageGroup: "student", roomType: "large", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 5800, effectiveFrom: "2024-01-01", isActive: true },

  { matrixId: "large_child_weekday_off", ageGroup: "child", roomType: "large", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 3200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_child_weekday_on", ageGroup: "child", roomType: "large", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 3800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_child_weekend_off", ageGroup: "child", roomType: "large", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 3800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_child_weekend_on", ageGroup: "child", roomType: "large", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 4600, effectiveFrom: "2024-01-01", isActive: true },

  { matrixId: "large_infant_weekday_off", ageGroup: "infant", roomType: "large", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 2500, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_infant_weekday_on", ageGroup: "infant", roomType: "large", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 3000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_infant_weekend_off", ageGroup: "infant", roomType: "large", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 3000, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_infant_weekend_on", ageGroup: "infant", roomType: "large", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 3600, effectiveFrom: "2024-01-01", isActive: true },

  // 個室A（small_a）
  { matrixId: "small_a_adult_weekday_off", ageGroup: "adult", roomType: "small_a", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 8500, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "small_a_adult_weekday_on", ageGroup: "adult", roomType: "small_a", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 10200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "small_a_adult_weekend_off", ageGroup: "adult", roomType: "small_a", dayType: "weekend", seasonType: "off_season", isLeader: false, price: 10200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "small_a_adult_weekend_on", ageGroup: "adult", roomType: "small_a", dayType: "weekend", seasonType: "on_season", isLeader: false, price: 12200, effectiveFrom: "2024-01-01", isActive: true },

  // 個室A（付添）
  { matrixId: "small_a_adult_leader_weekday_off", ageGroup: "adult", roomType: "small_a", dayType: "weekday", seasonType: "off_season", isLeader: true, price: 6800, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "small_a_adult_leader_weekday_on", ageGroup: "adult", roomType: "small_a", dayType: "weekday", seasonType: "on_season", isLeader: true, price: 8200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "small_a_adult_leader_weekend_off", ageGroup: "adult", roomType: "small_a", dayType: "weekend", seasonType: "off_season", isLeader: true, price: 8200, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "small_a_adult_leader_weekend_on", ageGroup: "adult", roomType: "small_a", dayType: "weekend", seasonType: "on_season", isLeader: true, price: 9800, effectiveFrom: "2024-01-01", isActive: true },

  { matrixId: "small_a_student_weekday_off", ageGroup: "student", roomType: "small_a", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 5900, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "small_a_student_weekday_on", ageGroup: "student", roomType: "small_a", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 7100, effectiveFrom: "2024-01-01", isActive: true },

  // 乳児は全ての部屋タイプで0円
  { matrixId: "large_baby_weekday_off", ageGroup: "baby", roomType: "large", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "large_baby_weekday_on", ageGroup: "baby", roomType: "large", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "small_a_baby_weekday_off", ageGroup: "baby", roomType: "small_a", dayType: "weekday", seasonType: "off_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
  { matrixId: "small_a_baby_weekday_on", ageGroup: "baby", roomType: "small_a", dayType: "weekday", seasonType: "on_season", isLeader: false, price: 0, effectiveFrom: "2024-01-01", isActive: true },
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

const roomTypeLabels = {
  large: "大部屋（作法室・被服室）",
  medium_a: "中部屋A（視聴覚室）",
  medium_b: "中部屋B（図書室）",
  small_a: "個室A（1年1組・1年2組）",
  small_b: "個室B（理科室）",
  small_c: "個室C（2年組・3年組）"
}

const roomTypeGroups = {
  shared: ["large", "medium_a", "medium_b"],
  private: ["small_a", "small_b", "small_c"]
}

export function PersonalPricingMatrix() {
  const [rates, setRates] = useState<GuestRateMatrix[]>(DEFAULT_RATES)
  const [selectedRoomType, setSelectedRoomType] = useState<"large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c">("large")
  const [hasChanges, setHasChanges] = useState(false)

  const getRate = (
    ageGroup: string,
    dayType: string,
    seasonType: string,
    isLeader: boolean = false
  ) => {
    return rates.find(r => 
      r.ageGroup === ageGroup &&
      r.roomType === selectedRoomType &&
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
        rate.roomType === selectedRoomType &&
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
        <div className="space-y-6">
          {/* 部屋タイプ選択 */}
          <div className="space-y-2">
            <Label htmlFor="roomType">部屋タイプ</Label>
            <Select value={selectedRoomType} onValueChange={(value) => setSelectedRoomType(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="部屋タイプを選択" />
              </SelectTrigger>
              <SelectContent>
                <optgroup label="大部屋・中部屋（共同利用）">
                  {roomTypeGroups.shared.map((roomType) => (
                    <SelectItem key={roomType} value={roomType}>
                      {roomTypeLabels[roomType as keyof typeof roomTypeLabels]}
                    </SelectItem>
                  ))}
                </optgroup>
                <optgroup label="個室">
                  {roomTypeGroups.private.map((roomType) => (
                    <SelectItem key={roomType} value={roomType}>
                      {roomTypeLabels[roomType as keyof typeof roomTypeLabels]}
                    </SelectItem>
                  ))}
                </optgroup>
              </SelectContent>
            </Select>
          </div>

          {/* 料金マトリクス */}
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {roomTypeLabels[selectedRoomType]}での個人料金設定です。
              {roomTypeGroups.private.includes(selectedRoomType) && " 大人は通常料金と付添料金があります。"}
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
                    
                    {/* 大人（付添） - 個室のみ */}
                    {roomTypeGroups.private.includes(selectedRoomType) && (
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
                    )}

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
        </div>

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