"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Users, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { GuestCount } from "@/lib/pricing/types"

interface GuestSelectorProps {
  value: GuestCount
  onChange: (guests: GuestCount) => void
  priceBreakdown?: any
}

const AGE_GROUPS = [
  {
    key: "adult" as keyof GuestCount,
    label: "大人",
    description: "18歳以上",
    icon: "👨‍💼",
  },
  {
    key: "student" as keyof GuestCount,
    label: "中高大学生",
    description: "13歳〜17歳（学生証必要）",
    icon: "🎓",
  },
  {
    key: "child" as keyof GuestCount,
    label: "小学生",
    description: "6歳〜12歳",
    icon: "🧒",
  },
  {
    key: "infant" as keyof GuestCount,
    label: "未就学児",
    description: "3歳〜5歳",
    icon: "👶",
  },
  {
    key: "baby" as keyof GuestCount,
    label: "乳幼児",
    description: "0歳〜2歳（無料）",
    icon: "🍼",
  },
]

export function GuestSelector({ value, onChange, priceBreakdown }: GuestSelectorProps) {
  const updateGuestCount = (ageGroup: keyof GuestCount, delta: number) => {
    const newCount = Math.max(0, (value[ageGroup] || 0) + delta)
    onChange({
      ...value,
      [ageGroup]: newCount,
    })
  }

  const setGuestCount = (ageGroup: keyof GuestCount, count: number) => {
    const newCount = Math.max(0, count)
    onChange({
      ...value,
      [ageGroup]: newCount,
    })
  }

  const totalGuests = Object.values(value).reduce((sum, count) => sum + count, 0)

  const getAgeGroupRate = (ageGroup: keyof GuestCount) => {
    if (!priceBreakdown?.dailyBreakdown?.[0]) return null

    const breakdown = priceBreakdown.dailyBreakdown[0]
    
    // 基本料金から年齢区分別料金を逆算（概算）
    const baseRates = {
      adult: 4800,
      student: 4000,
      child: 3200,
      infant: 2500,
      baby: 0,
    }

    const rate = baseRates[ageGroup]
    if (rate === 0) return 0

    // 曜日・シーズン係数を適用
    const dayMultiplier = breakdown.dayType === "weekend" ? 1.22 : 1.0
    const seasonMultiplier = breakdown.season === "peak" ? 1.15 : 1.0

    return Math.round(rate * dayMultiplier * seasonMultiplier)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            宿泊者数を入力
          </CardTitle>
          <CardDescription>
            年齢区分別に宿泊者数を入力してください。料金は年齢区分によって異なります。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 年齢区分別入力 */}
          <div className="grid gap-4">
            {AGE_GROUPS.map((ageGroup) => {
              const count = value[ageGroup.key] || 0
              const rate = getAgeGroupRate(ageGroup.key)

              return (
                <Card key={ageGroup.key} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ageGroup.icon}</span>
                        <div>
                          <Label className="text-base font-medium">
                            {ageGroup.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {ageGroup.description}
                          </p>
                          {rate !== null && (
                            <Badge variant="outline" className="mt-1">
                              ¥{(rate || 0).toLocaleString()}/泊
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateGuestCount(ageGroup.key, -1)}
                        disabled={count === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <Input
                        type="number"
                        value={count}
                        onChange={(e) => setGuestCount(ageGroup.key, parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                        min="0"
                        max="50"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateGuestCount(ageGroup.key, 1)}
                        disabled={count >= 50}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* 合計人数表示 */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">合計宿泊者数</span>
                <Badge variant="default" className="text-lg px-4 py-2">
                  {totalGuests}名
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 料金体系の説明 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="font-medium">料金体系について</div>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>大部屋・中部屋利用時と個室利用時で料金が異なります</li>
                <li>金・土・日・祝日は22%割増となります</li>
                <li>繁忙期（3,4,5,7,8,9,12月）は15%割増となります</li>
                <li>乳幼児（0〜2歳）は完全無料です</li>
                <li>料金はすべて税込み表示です</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* 人数制限の警告 */}
          {totalGuests > 50 && (
            <Alert variant="destructive">
              <AlertDescription>
                宿泊者数が多すぎます。最大50名までとなります。
              </AlertDescription>
            </Alert>
          )}

          {totalGuests === 0 && (
            <Alert>
              <AlertDescription>
                宿泊者数を入力してください。最低1名から予約可能です。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}