"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Calendar, Users, DollarSign } from "lucide-react"
import { EstimateSyncButton } from "@/components/board/estimate-sync-button"

// Mock booking data
const MOCK_BOOKING = {
  id: "1",
  guestName: "山田太郎",
  email: "yamada@example.com",
  phone: "090-1234-5678",
  address: "東京都渋谷区...",
  startDate: "2024-01-15",
  endDate: "2024-01-17",
  nights: 2,
  status: "confirmed",
  totalAmount: 125000,
  rooms: [
    {
      roomId: "2f-saho",
      roomName: "2F作法室",
      guests: 8,
      roomRate: 20000,
    },
  ],
  guests: [
    { ageGroup: "adult", count: 6, rate: 4800 },
    { ageGroup: "student", count: 2, rate: 4320 },
  ],
  addons: [
    { name: "朝食", quantity: 16, unitPrice: 700, total: 11200 },
    { name: "夕食", quantity: 16, unitPrice: 1200, total: 19200 },
  ],
  notes: "アレルギー対応：卵アレルギーの方が1名います。",
  createdAt: "2024-01-10",
  updatedAt: "2024-01-12",
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [booking] = useState(MOCK_BOOKING)

  const getStatusBadge = (status: string) => {
    const statusMap = {
      confirmed: { label: "確定", variant: "default" as const },
      pending: { label: "保留", variant: "secondary" as const },
      cancelled: { label: "キャンセル", variant: "destructive" as const },
      checked_in: { label: "チェックイン済", variant: "default" as const },
      checked_out: { label: "チェックアウト済", variant: "secondary" as const },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const }
  }

  const getAgeGroupLabel = (ageGroup: string) => {
    const labels = {
      adult: "大人",
      student: "学生",
      child: "小学生",
      infant: "未就学児",
    }
    return labels[ageGroup as keyof typeof labels] || ageGroup
  }

  const handleEdit = () => {
    router.push(`/booking/${params.id}/edit`)
  }

  const handleDelete = () => {
    if (confirm("この予約を削除しますか？")) {
      // Delete logic here
      router.push("/booking")
    }
  }

  const status = getStatusBadge(booking.status)

  return (
    <div className="container p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">予約詳細</h1>
            <p className="text-muted-foreground">予約ID: #{booking.id}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {/* Board見積もり同期ボタン */}
          <EstimateSyncButton bookingId={booking.id} />

          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* メイン情報 */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>予約情報</CardTitle>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">概要</TabsTrigger>
                  <TabsTrigger value="rooms">部屋・料金</TabsTrigger>
                  <TabsTrigger value="addons">オプション</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">宿泊期間</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.startDate} ～ {booking.endDate} ({booking.nights}泊)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">宿泊人数</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.guests.reduce((sum, g) => sum + g.count, 0)}名
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">人数内訳</h4>
                    <div className="space-y-1">
                      {booking.guests.map((guest, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{getAgeGroupLabel(guest.ageGroup)}</span>
                          <span>
                            {guest.count}名 × ¥{guest.rate.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {booking.notes && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">備考</h4>
                        <p className="text-sm text-muted-foreground">{booking.notes}</p>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="rooms" className="space-y-4">
                  {booking.rooms.map((room, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{room.roomName}</h4>
                            <p className="text-sm text-muted-foreground">{room.guests}名利用</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">¥{room.roomRate.toLocaleString()}/泊</p>
                            <p className="text-sm text-muted-foreground">
                              ¥{(room.roomRate * booking.nights).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="addons" className="space-y-4">
                  {booking.addons.length > 0 ? (
                    booking.addons.map((addon, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <div>
                          <span className="font-medium">{addon.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {addon.quantity}個 × ¥{addon.unitPrice.toLocaleString()}
                          </span>
                        </div>
                        <span className="font-medium">¥{addon.total.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">オプションはありません</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 顧客情報 */}
          <Card>
            <CardHeader>
              <CardTitle>顧客情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">{booking.guestName}</h4>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{booking.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{booking.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{booking.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 料金サマリー */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>料金サマリー</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>室料</span>
                  <span>
                    ¥{(booking.rooms.reduce((sum, r) => sum + r.roomRate, 0) * booking.nights).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>個人料金</span>
                  <span>
                    ¥{booking.guests.reduce((sum, g) => sum + g.count * g.rate * booking.nights, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>オプション</span>
                  <span>¥{booking.addons.reduce((sum, a) => sum + a.total, 0).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>合計</span>
                  <span>¥{booking.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 履歴 */}
          <Card>
            <CardHeader>
              <CardTitle>更新履歴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <p className="font-medium">作成日時</p>
                <p className="text-muted-foreground">{booking.createdAt}</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">最終更新</p>
                <p className="text-muted-foreground">{booking.updatedAt}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
