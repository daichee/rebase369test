"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, X } from "lucide-react"

// Mock booking data
const MOCK_BOOKING = {
  id: "1",
  guestName: "山田太郎",
  email: "yamada@example.com",
  phone: "090-1234-5678",
  address: "東京都渋谷区...",
  startDate: "2024-01-15",
  endDate: "2024-01-17",
  status: "confirmed",
  notes: "アレルギー対応：卵アレルギーの方が1名います。",
  guests: [
    { ageGroup: "adult", count: 6 },
    { ageGroup: "student", count: 2 },
  ],
  rooms: ["2f-saho"],
  addons: ["breakfast", "dinner"],
}

export default function EditBookingPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState(MOCK_BOOKING)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save logic here
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push(`/booking/${params.id}`)
    } catch (error) {
      console.error("Error saving booking:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/booking/${params.id}`)
  }

  const updateBooking = (field: string, value: any) => {
    setBooking((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">予約編集</h1>
            <p className="text-muted-foreground">予約ID: #{booking.id}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">チェックイン</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={booking.startDate}
                  onChange={(e) => updateBooking("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">チェックアウト</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={booking.endDate}
                  onChange={(e) => updateBooking("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select value={booking.status} onValueChange={(value) => updateBooking("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="confirmed">確定</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                  <SelectItem value="checked_in">チェックイン済</SelectItem>
                  <SelectItem value="checked_out">チェックアウト済</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={booking.notes}
                onChange={(e) => updateBooking("notes", e.target.value)}
                placeholder="特記事項があれば入力してください"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 顧客情報 */}
        <Card>
          <CardHeader>
            <CardTitle>顧客情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">代表者名</Label>
              <Input
                id="guestName"
                value={booking.guestName}
                onChange={(e) => updateBooking("guestName", e.target.value)}
                placeholder="山田太郎"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={booking.email}
                onChange={(e) => updateBooking("email", e.target.value)}
                placeholder="yamada@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={booking.phone}
                onChange={(e) => updateBooking("phone", e.target.value)}
                placeholder="090-1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">住所</Label>
              <Textarea
                id="address"
                value={booking.address}
                onChange={(e) => updateBooking("address", e.target.value)}
                placeholder="東京都渋谷区..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* 宿泊人数 */}
        <Card>
          <CardHeader>
            <CardTitle>宿泊人数</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.guests.map((guest, index) => (
              <div key={index} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>年齢区分</Label>
                  <Select
                    value={guest.ageGroup}
                    onValueChange={(value) => {
                      const newGuests = [...booking.guests]
                      newGuests[index].ageGroup = value
                      updateBooking("guests", newGuests)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adult">大人</SelectItem>
                      <SelectItem value="student">学生</SelectItem>
                      <SelectItem value="child">小学生</SelectItem>
                      <SelectItem value="infant">未就学児</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>人数</Label>
                  <Input
                    type="number"
                    min="0"
                    value={guest.count}
                    onChange={(e) => {
                      const newGuests = [...booking.guests]
                      newGuests[index].count = Number.parseInt(e.target.value) || 0
                      updateBooking("guests", newGuests)
                    }}
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                const newGuests = [...booking.guests, { ageGroup: "adult", count: 1 }]
                updateBooking("guests", newGuests)
              }}
            >
              年齢区分を追加
            </Button>
          </CardContent>
        </Card>

        {/* 部屋・オプション */}
        <Card>
          <CardHeader>
            <CardTitle>部屋・オプション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>利用部屋</Label>
              <div className="space-y-2">
                {["2f-saho", "3f-hifuku", "3f-shichoukaku"].map((room) => (
                  <label key={room} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={booking.rooms.includes(room)}
                      onChange={(e) => {
                        const newRooms = e.target.checked
                          ? [...booking.rooms, room]
                          : booking.rooms.filter((r) => r !== room)
                        updateBooking("rooms", newRooms)
                      }}
                    />
                    <span className="text-sm">
                      {room === "2f-saho" && "2F作法室"}
                      {room === "3f-hifuku" && "3F被服室"}
                      {room === "3f-shichoukaku" && "3F視聴覚室"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>オプション</Label>
              <div className="space-y-2">
                {["breakfast", "dinner", "aircon"].map((addon) => (
                  <label key={addon} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={booking.addons.includes(addon)}
                      onChange={(e) => {
                        const newAddons = e.target.checked
                          ? [...booking.addons, addon]
                          : booking.addons.filter((a) => a !== addon)
                        updateBooking("addons", newAddons)
                      }}
                    />
                    <span className="text-sm">
                      {addon === "breakfast" && "朝食"}
                      {addon === "dinner" && "夕食"}
                      {addon === "aircon" && "エアコン"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
