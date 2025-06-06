"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, User, Mail, Phone } from "lucide-react"
import { ConflictNotification } from "./conflict-notification"
import { RealtimeBookingStatus } from "./realtime-booking-status"
import { useRooms } from "@/lib/hooks/use-rooms"
import type { BookingFormData } from "./booking-wizard"

// オプションマスターデータ（AddonSelectorと同期）
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
    description: "スクリーンとセット",
    rate: 2000,
    unit: "台・日",
  },
  {
    id: "sound_system",
    category: "equipment",
    name: "音響機器",
    description: "マイク・アンプセット",
    rate: 3000,
    unit: "台・日",
  },
  {
    id: "additional_futon",
    category: "equipment",
    name: "追加布団",
    description: "1組（敷布団・掛布団・枕）",
    rate: 1000,
    unit: "組・日",
  },
]

interface BookingConfirmationProps {
  formData: BookingFormData
  priceBreakdown: any
  onChange: (updates: Partial<BookingFormData>) => void
}

export function BookingConfirmation({
  formData,
  priceBreakdown,
  onChange,
}: BookingConfirmationProps) {
  const { getRoomById } = useRooms()

  const totalGuests = Object.values(formData.guests).reduce((sum, count) => sum + count, 0)

  // オプション価格計算（AddonSelectorと同じロジック）
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
      return config.rate * addon.quantity * formData.dateRange.nights
    }

    if (config.category === "facility" && addon.facilityUsage) {
      const personalFee = config.personalFees?.all || 400
      const roomFee = 2000 // 平均的な室料
      const airconFee = config.airconFee * addon.facilityUsage.hours
      
      return personalFee * totalGuests + roomFee * addon.facilityUsage.hours + airconFee
    }

    return 0
  }

  // 年齢区分ラベル
  const getAgeGroupLabel = (ageGroup: string) => {
    const labels = {
      adult: "大人",
      student: "学生", 
      child: "小学生",
      infant: "未就学児",
      baby: "乳幼児",
    }
    return labels[ageGroup as keyof typeof labels] || ageGroup
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    })
  }

  const getSelectedRoomsInfo = () => {
    return formData.selectedRooms.map((roomId) => {
      const room = getRoomById(roomId)
      return room ? { id: roomId, name: room.name, capacity: room.capacity, rate: room.roomRate } : null
    }).filter(Boolean)
  }

  return (
    <div className="space-y-6">
      {/* リアルタイム予約ステータス */}
      <RealtimeBookingStatus
        roomIds={formData.selectedRooms}
        startDate={formData.dateRange.startDate}
        endDate={formData.dateRange.endDate}
        isActive={true}
      />

      {/* 競合通知 */}
      <ConflictNotification
        roomIds={formData.selectedRooms}
        startDate={formData.dateRange.startDate}
        endDate={formData.dateRange.endDate}
        onResolve={(resolutionType) => {
          console.log("解決方法選択:", resolutionType)
          // 親コンポーネントに通知
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            予約内容の確認
          </CardTitle>
          <CardDescription>
            予約内容を確認し、代表者情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 宿泊情報サマリー */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">宿泊期間</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">チェックイン</span>
                  <span className="font-medium">{formatDate(formData.dateRange.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">チェックアウト</span>
                  <span className="font-medium">{formatDate(formData.dateRange.endDate)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm text-muted-foreground">宿泊日数</span>
                  <span className="font-bold">{formData.dateRange.nights}泊</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">宿泊者情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">総人数</span>
                  <span className="font-bold">{totalGuests}名</span>
                </div>
                {Object.entries(formData.guests).map(([ageGroup, count]) => {
                  if (count === 0) return null
                  const labels = {
                    adult: "大人",
                    student: "学生",
                    child: "小学生",
                    infant: "未就学児",
                    baby: "乳幼児",
                  }
                  return (
                    <div key={ageGroup} className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {labels[ageGroup as keyof typeof labels]}
                      </span>
                      <span>{count}名</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* 選択部屋 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">選択部屋</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getSelectedRoomsInfo().map((room) => (
                  <div key={room?.id} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{room?.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        (定員{room?.capacity}名)
                      </span>
                    </div>
                    <span className="text-sm">¥{(room?.rate || 0).toLocaleString()}/泊</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* オプション */}
          {formData.selectedAddons.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">選択オプション</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.selectedAddons.map((addon, index) => {
                    const config = AVAILABLE_ADDONS.find((a) => a.id === addon.addonId)
                    const addonPrice = calculateAddonPrice(addon)
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{addon.name}</span>
                            <Badge variant="outline">数量: {addon.quantity}</Badge>
                          </div>
                          
                          {/* 食事の場合：年齢別内訳 */}
                          {config?.category === "meal" && addon.ageBreakdown && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              {Object.entries(addon.ageBreakdown)
                                .filter(([_, count]) => count > 0)
                                .map(([ageGroup, count]) => {
                                  const rate = config.rates?.[ageGroup as keyof typeof config.rates] || 0
                                  return (
                                    <span key={ageGroup} className="mr-3">
                                      {getAgeGroupLabel(ageGroup)}: {count}名 (¥{rate.toLocaleString()})
                                    </span>
                                  )
                                })}
                            </div>
                          )}
                          
                          {/* 施設の場合：利用時間 */}
                          {config?.category === "facility" && addon.facilityUsage && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              利用時間: {addon.facilityUsage.hours}時間
                            </div>
                          )}
                          
                          {/* 備品の場合：単価表示 */}
                          {config?.category === "equipment" && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              ¥{(config.rate || 0).toLocaleString()} × {addon.quantity} × {formData.dateRange.nights}泊
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium">¥{addonPrice.toLocaleString()}</div>
                          {config?.unit && (
                            <div className="text-xs text-muted-foreground">{config.unit}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 料金明細 */}
          {priceBreakdown && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">料金明細</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">室料</span>
                  <span>¥{(priceBreakdown.roomAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">個人料金</span>
                  <span>¥{(priceBreakdown.guestAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">オプション</span>
                  <span>¥{(priceBreakdown.addonAmount || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center text-lg font-bold">
                  <span>合計金額（税込）</span>
                  <span className="text-green-600">¥{(priceBreakdown.total || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* 代表者情報入力 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            代表者情報
          </CardTitle>
          <CardDescription>
            予約代表者の連絡先を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">代表者名 *</Label>
              <Input
                id="guestName"
                value={formData.guestName}
                onChange={(e) => onChange({ guestName: e.target.value })}
                placeholder="山田太郎"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestEmail">メールアドレス *</Label>
              <Input
                id="guestEmail"
                type="email"
                value={formData.guestEmail}
                onChange={(e) => onChange({ guestEmail: e.target.value })}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestPhone">電話番号 *</Label>
              <Input
                id="guestPhone"
                type="tel"
                value={formData.guestPhone}
                onChange={(e) => onChange({ guestPhone: e.target.value })}
                placeholder="090-1234-5678"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestOrg">団体・組織名</Label>
              <Input
                id="guestOrg"
                value={formData.guestOrg}
                onChange={(e) => onChange({ guestOrg: e.target.value })}
                placeholder="○○大学サークル"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">利用目的</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => onChange({ purpose: e.target.value })}
              placeholder="合宿・研修・旅行など"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備考・要望</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="アレルギー情報、特別な要望など"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>


      {/* 注意事項 */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <div className="font-medium">予約完了について</div>
          <ul className="text-sm space-y-1 ml-4 list-disc">
            <li>予約完了後、確認メールをお送りします</li>
            <li>料金のお支払いは現地決済となります</li>
            <li>キャンセルは3日前まで無料です</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}