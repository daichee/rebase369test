"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Save, X, Calendar, User, CreditCard, Trash2 } from "lucide-react"
import { useBookingStore } from "@/store/booking-store"
import { useRoomStore } from "@/store/room-store"
import { EstimateSyncButton } from "@/components/board/estimate-sync-button"

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const { bookings, customers, updateBooking, deleteBooking } = useBookingStore()
  const { rooms } = useRoomStore()

  const [booking, setBooking] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [room, setRoom] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  useEffect(() => {
    const foundBooking = bookings.find((b) => b.id === bookingId)
    if (foundBooking) {
      setBooking(foundBooking)
      setEditForm(foundBooking)

      const foundCustomer = customers.find((c) => c.id === foundBooking.customerId)
      setCustomer(foundCustomer)

      const foundRoom = rooms.find((r) => r.id === foundBooking.roomId)
      setRoom(foundRoom)
    }
  }, [bookingId, bookings, customers, rooms])

  const handleSave = () => {
    updateBooking(bookingId, editForm)
    setBooking(editForm)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditForm(booking)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm("この予約を削除してもよろしいですか？")) {
      deleteBooking(bookingId)
      router.push("/booking")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    } as const

    const labels = {
      pending: "保留中",
      confirmed: "確定",
      cancelled: "キャンセル",
      completed: "完了",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  if (!booking || !customer || !room) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p>予約が見つかりません</p>
          <Button onClick={() => router.push("/booking")} className="mt-4">
            予約一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">予約詳細</h1>
          <p className="text-muted-foreground">予約ID: {booking.id}</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Button>
              <Button onClick={handleDelete} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="mr-2 h-4 w-4" />
                キャンセル
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="booking" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="booking">
                <Calendar className="mr-2 h-4 w-4" />
                予約情報
              </TabsTrigger>
              <TabsTrigger value="customer">
                <User className="mr-2 h-4 w-4" />
                顧客情報
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="mr-2 h-4 w-4" />
                支払い
              </TabsTrigger>
            </TabsList>

            <TabsContent value="booking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>宿泊詳細</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>チェックイン</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editForm.checkIn}
                          onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{new Date(booking.checkIn).toLocaleDateString("ja-JP")}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>チェックアウト</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editForm.checkOut}
                          onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{new Date(booking.checkOut).toLocaleDateString("ja-JP")}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>宿泊人数</Label>
                      {isEditing ? (
                        <Select
                          value={editForm.guestCount.toString()}
                          onValueChange={(value) => setEditForm({ ...editForm, guestCount: Number.parseInt(value) })}
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
                      ) : (
                        <p className="text-sm">{booking.guestCount}名</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>ステータス</Label>
                      {isEditing ? (
                        <Select
                          value={editForm.status}
                          onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">保留中</SelectItem>
                            <SelectItem value="confirmed">確定</SelectItem>
                            <SelectItem value="cancelled">キャンセル</SelectItem>
                            <SelectItem value="completed">完了</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getStatusBadge(booking.status)
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>部屋</Label>
                    <p className="text-sm">
                      {room.name} ({room.type})
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>備考</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.notes || ""}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="備考を入力"
                      />
                    ) : (
                      <p className="text-sm">{booking.notes || "なし"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customer" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>顧客情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>氏名</Label>
                      <p className="text-sm">{customer.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>メールアドレス</Label>
                      <p className="text-sm">{customer.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>電話番号</Label>
                      <p className="text-sm">{customer.phone}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>住所</Label>
                      <p className="text-sm">{customer.address || "未登録"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>支払い情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>合計金額:</span>
                      <span className="font-bold">¥{booking.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Board連携</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.boardEstimateId ? (
                <div className="space-y-2">
                  <Badge variant="outline">{booking.boardEstimateId}</Badge>
                  <p className="text-sm text-muted-foreground">見積もりが同期済みです</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <EstimateSyncButton bookingId={booking.id} />
                  <p className="text-sm text-muted-foreground">Boardと同期してください</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>予約履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>作成日時:</span>
                  <span>{new Date(booking.createdAt).toLocaleString("ja-JP")}</span>
                </div>
                <div className="flex justify-between">
                  <span>更新日時:</span>
                  <span>{new Date(booking.updatedAt).toLocaleString("ja-JP")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
