"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, CreditCard, FileText } from "lucide-react"
import { useBookingStore } from "@/store/booking-store"
import { useRoomStore } from "@/store/room-store"
import { usePricingStore } from "@/store/pricing-store"

export default function NewBookingPage() {
  const router = useRouter()
  const { addBooking, addCustomer } = useBookingStore()
  const { rooms } = useRoomStore()
  const { calculatePrice } = usePricingStore()

  const [currentStep, setCurrentStep] = useState("customer")
  const [formData, setFormData] = useState({
    // 顧客情報
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",

    // 予約情報
    checkIn: "",
    checkOut: "",
    guestCount: 1,
    roomId: "",

    // 追加情報
    notes: "",
    specialRequests: "",
  })

  const [priceCalculation, setPriceCalculation] = useState<any>(null)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // 料金計算の更新
    if (["checkIn", "checkOut", "guestCount", "roomId"].includes(field)) {
      updatePriceCalculation({ ...formData, [field]: value })
    }
  }

  const updatePriceCalculation = (data: typeof formData) => {
    if (data.checkIn && data.checkOut && data.roomId && data.guestCount) {
      const room = rooms.find((r) => r.id === data.roomId)
      if (room) {
        const calculation = calculatePrice(
          room.id,
          room.type,
          room.basePrice,
          data.checkIn,
          data.checkOut,
          data.guestCount,
        )
        setPriceCalculation(calculation)
      }
    }
  }

  const handleSubmit = async () => {
    try {
      // 顧客を作成
      const customerId = Math.random().toString(36).substr(2, 9)
      const newCustomer = {
        id: customerId,
        name: formData.customerName,
        email: formData.customerEmail,
        phone: formData.customerPhone,
        address: formData.customerAddress,
        createdAt: new Date().toISOString(),
      }
      addCustomer(newCustomer)

      // 予約を作成
      const bookingId = Math.random().toString(36).substr(2, 9)
      const newBooking = {
        id: bookingId,
        customerId,
        roomId: formData.roomId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guestCount: formData.guestCount,
        totalAmount: priceCalculation?.totalPrice || 0,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: formData.notes,
      }
      addBooking(newBooking)

      router.push(`/booking/${bookingId}`)
    } catch (error) {
      console.error("予約作成エラー:", error)
    }
  }

  const isStepValid = (step: string) => {
    switch (step) {
      case "customer":
        return formData.customerName && formData.customerEmail && formData.customerPhone
      case "booking":
        return formData.checkIn && formData.checkOut && formData.roomId && formData.guestCount
      case "review":
        return true
      default:
        return false
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">新規予約作成</h1>
        <p className="text-muted-foreground">新しい宿泊予約を作成します</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs value={currentStep} onValueChange={setCurrentStep}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer" disabled={false}>
              <Users className="mr-2 h-4 w-4" />
              顧客情報
            </TabsTrigger>
            <TabsTrigger value="booking" disabled={!isStepValid("customer")}>
              <Calendar className="mr-2 h-4 w-4" />
              予約詳細
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!isStepValid("booking")}>
              <FileText className="mr-2 h-4 w-4" />
              確認
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>顧客情報</CardTitle>
                <CardDescription>予約者の基本情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">氏名 *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      placeholder="田中太郎"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">メールアドレス *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                      placeholder="tanaka@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">電話番号 *</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                      placeholder="090-1234-5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress">住所</Label>
                    <Input
                      id="customerAddress"
                      value={formData.customerAddress}
                      onChange={(e) => handleInputChange("customerAddress", e.target.value)}
                      placeholder="東京都渋谷区1-1-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="booking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>予約詳細</CardTitle>
                <CardDescription>宿泊日程と部屋を選択してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">チェックイン *</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => handleInputChange("checkIn", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">チェックアウト *</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => handleInputChange("checkOut", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestCount">宿泊人数 *</Label>
                    <Select
                      value={formData.guestCount.toString()}
                      onValueChange={(value) => handleInputChange("guestCount", Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}名
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomId">部屋タイプ *</Label>
                  <Select value={formData.roomId} onValueChange={(value) => handleInputChange("roomId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="部屋を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms
                        .filter((room) => room.isActive)
                        .map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} - ¥{room.basePrice.toLocaleString()}/泊 (最大{room.capacity}名)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">備考</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="特別なリクエストや注意事項"
                  />
                </div>

                {priceCalculation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        料金計算
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>基本料金:</span>
                          <span>¥{priceCalculation.breakdown.base.toLocaleString()}</span>
                        </div>
                        {priceCalculation.breakdown.seasonal > 0 && (
                          <div className="flex justify-between">
                            <span>シーズン料金:</span>
                            <span>¥{priceCalculation.breakdown.seasonal.toLocaleString()}</span>
                          </div>
                        )}
                        {priceCalculation.breakdown.weekday > 0 && (
                          <div className="flex justify-between">
                            <span>週末料金:</span>
                            <span>¥{priceCalculation.breakdown.weekday.toLocaleString()}</span>
                          </div>
                        )}
                        {priceCalculation.breakdown.special > 0 && (
                          <div className="flex justify-between">
                            <span>特別料金:</span>
                            <span>¥{priceCalculation.breakdown.special.toLocaleString()}</span>
                          </div>
                        )}
                        <hr />
                        <div className="flex justify-between font-bold text-lg">
                          <span>合計:</span>
                          <span>¥{priceCalculation.totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>予約内容確認</CardTitle>
                <CardDescription>以下の内容で予約を作成します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">顧客情報</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>氏名:</strong> {formData.customerName}
                      </p>
                      <p>
                        <strong>メール:</strong> {formData.customerEmail}
                      </p>
                      <p>
                        <strong>電話:</strong> {formData.customerPhone}
                      </p>
                      {formData.customerAddress && (
                        <p>
                          <strong>住所:</strong> {formData.customerAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">予約情報</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>チェックイン:</strong> {new Date(formData.checkIn).toLocaleDateString("ja-JP")}
                      </p>
                      <p>
                        <strong>チェックアウト:</strong> {new Date(formData.checkOut).toLocaleDateString("ja-JP")}
                      </p>
                      <p>
                        <strong>宿泊人数:</strong> {formData.guestCount}名
                      </p>
                      <p>
                        <strong>部屋:</strong> {rooms.find((r) => r.id === formData.roomId)?.name}
                      </p>
                      {formData.notes && (
                        <p>
                          <strong>備考:</strong> {formData.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {priceCalculation && (
                  <Card>
                    <CardHeader>
                      <CardTitle>料金詳細</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>基本料金:</span>
                          <span>¥{priceCalculation.breakdown.base.toLocaleString()}</span>
                        </div>
                        {priceCalculation.appliedRules.map((rule, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{rule.ruleName}:</span>
                            <span>¥{rule.amount.toLocaleString()}</span>
                          </div>
                        ))}
                        <hr />
                        <div className="flex justify-between font-bold text-lg">
                          <span>合計金額:</span>
                          <span>¥{priceCalculation.totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-4">
                  <Button onClick={() => setCurrentStep("booking")} variant="outline">
                    戻る
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1">
                    予約を作成
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
