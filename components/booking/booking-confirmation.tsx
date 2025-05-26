"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, User, Mail, Phone, Building2 } from "lucide-react"
import { BoardProjectSelector } from "./board-project-selector"
import { useRooms } from "@/lib/hooks/use-rooms"
import type { BookingFormData } from "./booking-wizard"

interface BookingConfirmationProps {
  formData: BookingFormData
  priceBreakdown: any
  onChange: (updates: Partial<BookingFormData>) => void
  onBoardProjectSelect: (boardProjectId?: number) => void
}

export function BookingConfirmation({
  formData,
  priceBreakdown,
  onChange,
  onBoardProjectSelect,
}: BookingConfirmationProps) {
  const { getRoomById } = useRooms()
  const [showBoardSelector, setShowBoardSelector] = useState(false)

  const totalGuests = Object.values(formData.guests).reduce((sum, count) => sum + count, 0)

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
                    <span className="text-sm">¥{room?.rate.toLocaleString()}/泊</span>
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
                <div className="space-y-2">
                  {formData.selectedAddons.map((addon, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{addon.name}</span>
                      <span className="text-sm">数量: {addon.quantity}</span>
                    </div>
                  ))}
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
                  <span>¥{priceBreakdown.roomAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">個人料金</span>
                  <span>¥{priceBreakdown.guestAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">オプション</span>
                  <span>¥{priceBreakdown.addonAmount?.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center text-lg font-bold">
                  <span>合計金額（税込）</span>
                  <span className="text-green-600">¥{priceBreakdown.total?.toLocaleString()}</span>
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

      {/* Board案件選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Board案件連携（任意）
          </CardTitle>
          <CardDescription>
            既存のBoard案件に見積データを同期する場合は選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.boardProjectId ? (
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-2">案件選択済み</Badge>
                <p className="text-sm text-muted-foreground">
                  案件ID: {formData.boardProjectId}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  onBoardProjectSelect(undefined)
                  setShowBoardSelector(true)
                }}
              >
                変更
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setShowBoardSelector(true)}
            >
              Board案件を選択
            </Button>
          )}

          {showBoardSelector && (
            <div className="mt-4">
              <BoardProjectSelector
                onSelect={(projectId) => {
                  onBoardProjectSelect(projectId)
                  setShowBoardSelector(false)
                }}
                onCancel={() => setShowBoardSelector(false)}
              />
            </div>
          )}
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
            <li>Board案件を選択した場合、見積データが自動同期されます</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}