"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, Users, Home, ShoppingCart, User, Mail, Phone, Building } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import type { SimpleBookingFormData } from "./SimpleBookingWizard"

interface ConfirmationStepProps {
  formData: SimpleBookingFormData
  priceBreakdown?: any
  onChange: (data: Partial<SimpleBookingFormData>) => void
}

// モックルームデータ - 実際はAPIから取得
const ROOMS = [
  { id: "R201", name: "201号室", floor: "2F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R202", name: "202号室", floor: "2F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R203", name: "203号室", floor: "2F", type: "large", capacity: 6, basePrice: 18000 },
  { id: "R204", name: "204号室", floor: "2F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R205", name: "205号室", floor: "2F", type: "suite", capacity: 8, basePrice: 22000 },
  { id: "R301", name: "301号室", floor: "3F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R302", name: "302号室", floor: "3F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R303", name: "303号室", floor: "3F", type: "large", capacity: 6, basePrice: 18000 },
  { id: "R304", name: "304号室", floor: "3F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R305", name: "305号室", floor: "3F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R306", name: "306号室", floor: "3F", type: "large", capacity: 6, basePrice: 18000 },
  { id: "R307", name: "307号室", floor: "3F", type: "suite", capacity: 8, basePrice: 22000 },
]

// モックオプションデータ
const OPTIONS = [
  { id: "meal_breakfast", name: "朝食", price: 800, unit: "人/日" },
  { id: "meal_lunch", name: "昼食", price: 1200, unit: "人/日" },
  { id: "meal_dinner", name: "夕食", price: 2000, unit: "人/日" },
  { id: "facility_meeting", name: "会議室利用", price: 3000, unit: "日" },
  { id: "facility_parking", name: "駐車場", price: 500, unit: "台/日" },
  { id: "equipment_futon", name: "追加布団", price: 1000, unit: "組/日" },
]

export function ConfirmationStep({ formData, priceBreakdown, onChange }: ConfirmationStepProps) {
  const totalGuests = Object.values(formData.guests).reduce((sum, count) => sum + count, 0)
  const selectedRoomData = ROOMS.filter(room => formData.selectedRooms.includes(room.id))
  const totalCapacity = selectedRoomData.reduce((sum, room) => sum + room.capacity, 0)

  const startDate = formData.dateRange.startDate ? new Date(formData.dateRange.startDate) : null
  const endDate = formData.dateRange.endDate ? new Date(formData.dateRange.endDate) : null

  const guestTypes = [
    { key: "adult" as const, label: "大人" },
    { key: "student" as const, label: "学生" },
    { key: "child" as const, label: "小学生" },
    { key: "infant" as const, label: "幼児" },
    { key: "baby" as const, label: "乳児" },
  ]

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case "standard": return "スタンダード"
      case "large": return "ラージ"
      case "suite": return "スイート"
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      {/* 宿泊情報確認 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            宿泊情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">宿泊期間</div>
              <div className="font-medium">
                {startDate && endDate && (
                  <>
                    {format(startDate, "yyyy年MM月dd日", { locale: ja })} ～ {format(endDate, "yyyy年MM月dd日", { locale: ja })}
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {formData.dateRange.nights}泊{formData.dateRange.nights + 1}日
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">宿泊者数</div>
              <div className="font-medium flex items-center">
                <Users className="mr-1 h-4 w-4" />
                合計 {totalGuests}名
              </div>
              <div className="text-sm text-muted-foreground">
                {guestTypes.map(type => 
                  formData.guests[type.key] > 0 && (
                    <span key={type.key} className="mr-2">
                      {type.label}: {formData.guests[type.key]}名
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 代表者情報確認 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            代表者情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formData.guestName}</span>
            </div>
            {formData.guestOrg && (
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{formData.guestOrg}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{formData.guestEmail}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{formData.guestPhone}</span>
            </div>
          </div>
          {formData.purpose && (
            <div>
              <div className="text-sm text-muted-foreground">利用目的</div>
              <div>{formData.purpose}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 選択部屋確認 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Home className="mr-2 h-5 w-5" />
            選択部屋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedRoomData.map((room) => (
              <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{room.floor}</Badge>
                  <span className="font-medium">{room.name}</span>
                  <Badge variant="secondary">{getRoomTypeLabel(room.type)}</Badge>
                </div>
                <div className="text-right">
                  <div className="font-medium">¥{(room.basePrice || 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">定員{room.capacity}名</div>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>合計定員</span>
                <span>{totalCapacity}名</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* オプション確認 */}
      {formData.selectedAddons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              選択オプション
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.selectedAddons.map((addon) => {
                const optionData = OPTIONS.find(opt => opt.id === addon.id)
                if (!optionData) return null

                return (
                  <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{optionData.name}</span>
                      <Badge variant="outline">数量: {addon.quantity}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ¥{((optionData.price || 0) * (addon.quantity || 1)).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ¥{(optionData.price || 0).toLocaleString()} × {addon.quantity || 1}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 料金詳細 */}
      {priceBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>料金詳細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>室料</span>
                <span>¥{(priceBreakdown.roomAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>個人料金</span>
                <span>¥{(priceBreakdown.guestAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>オプション</span>
                <span>¥{(priceBreakdown.addonAmount || 0).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>合計金額（税込）</span>
                <span>¥{(priceBreakdown.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 備考 */}
      <Card>
        <CardHeader>
          <CardTitle>備考・特記事項</CardTitle>
          <CardDescription>
            その他ご要望や特記事項がございましたらご記入ください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="アレルギー情報、アクセス方法、その他ご要望など"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}