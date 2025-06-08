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
import { EstimateDisplay } from "@/components/booking/estimate-display"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/types"

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  project_rooms?: (Database["public"]["Tables"]["project_rooms"]["Row"] & {
    rooms: Database["public"]["Tables"]["rooms"]["Row"]
  })[]
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const { toast } = useToast()

  const [booking, setBooking] = useState<Project | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Project>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchBooking()
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/booking/${bookingId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('予約が見つかりません')
        }
        throw new Error('予約データの取得に失敗しました')
      }
      
      const data = await response.json()
      setBooking(data)
      setEditForm(data)
    } catch (err) {
      console.error('Error fetching booking:', err)
      setError(err instanceof Error ? err.message : '予約データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Validate PAX constraint before sending to server
      const paxTotal = editForm.pax_total || 0
      const paxSum = (editForm.pax_adults || 0) + 
                    (editForm.pax_adult_leaders || 0) + 
                    (editForm.pax_students || 0) + 
                    (editForm.pax_children || 0) + 
                    (editForm.pax_infants || 0) + 
                    (editForm.pax_babies || 0)
      
      if (paxTotal <= 0) {
        toast({
          title: "入力エラー",
          description: "宿泊人数は1名以上である必要があります",
          variant: "destructive"
        })
        return
      }
      
      if (paxTotal !== paxSum) {
        toast({
          title: "人数内訳エラー",
          description: `人数内訳の合計(${paxSum}名)が宿泊人数(${paxTotal}名)と一致していません。内訳を確認してください。`,
          variant: "destructive"
        })
        return
      }
      
      // Clean the data to only include database-valid updatable fields
      const updateData: Record<string, any> = {}
      
      // Only add fields that exist in the database schema and have valid values
      const validFields = [
        'start_date', 'end_date', 'pax_total', 'pax_adults', 'pax_adult_leaders',
        'pax_students', 'pax_children', 'pax_infants', 'pax_babies',
        'guest_name', 'guest_email', 'guest_phone', 'guest_org', 'purpose',
        'room_amount', 'pax_amount', 'addon_amount', 'subtotal_amount',
        'total_amount', 'notes', 'status'
      ]
      
      validFields.forEach(field => {
        const value = editForm[field as keyof typeof editForm]
        if (value !== undefined && value !== null) {
          updateData[field] = value
        }
      })
      
      // Note: Room assignment changes are not supported in edit mode
      // Users should delete and recreate the booking to change room assignments
      
      const response = await fetch(`/api/booking/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        // Parse error response for more specific error messages
        let errorMessage = '予約の更新に失敗しました'
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
          if (errorData.details) {
            errorMessage += ` (${errorData.details})`
          }
        } catch {
          // If we can't parse the error response, use default message
        }
        throw new Error(errorMessage)
      }
      
      const updatedBooking = await response.json()
      setBooking(updatedBooking)
      setEditForm(updatedBooking)
      setIsEditing(false)
      
      // Show success notification
      toast({
        title: "保存完了",
        description: "予約情報が正常に更新されました",
        variant: "default"
      })
    } catch (err) {
      console.error('Error updating booking:', err)
      toast({
        title: "保存エラー",
        description: err instanceof Error ? err.message : '予約の更新に失敗しました',
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditForm(booking)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm("この予約を削除してもよろしいですか？")) {
      return
    }
    
    try {
      const response = await fetch(`/api/booking/${bookingId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '予約の削除に失敗しました')
      }
      
      toast({
        title: "削除完了",
        description: "予約が正常に削除されました",
        variant: "default"
      })
      router.push("/booking")
    } catch (err) {
      console.error('Error deleting booking:', err)
      toast({
        title: "削除エラー",
        description: err instanceof Error ? err.message : '予約の削除に失敗しました',
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    } as const

    const labels = {
      draft: "下書き",
      confirmed: "確定",
      cancelled: "キャンセル",
      completed: "完了",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">予約データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-red-500">{error || "予約が見つかりません"}</p>
          <div className="mt-4 space-x-2">
            <Button onClick={fetchBooking} variant="outline">
              再試行
            </Button>
            <Button onClick={() => router.push("/booking")}>
              予約一覧に戻る
            </Button>
          </div>
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
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "保存中..." : "保存"}
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="mr-2 h-4 w-4" />
                キャンセル
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
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
              <TabsTrigger value="estimate">
                <CreditCard className="mr-2 h-4 w-4" />
                見積書
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
                          value={editForm.start_date || ""}
                          onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{new Date(booking.start_date).toLocaleDateString("ja-JP")}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>チェックアウト</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editForm.end_date || ""}
                          onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{new Date(booking.end_date).toLocaleDateString("ja-JP")}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>宿泊人数</Label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            type="number"
                            min="1"
                            value={editForm.pax_total || 0}
                            onChange={(e) => {
                              const newTotal = Number.parseInt(e.target.value) || 0
                              // When pax_total changes, adjust the breakdown to maintain constraint
                              // Keep existing breakdown proportions but adjust to match new total
                              const currentSum = (editForm.pax_adults || 0) + 
                                                (editForm.pax_adult_leaders || 0) + 
                                                (editForm.pax_students || 0) + 
                                                (editForm.pax_children || 0) + 
                                                (editForm.pax_infants || 0) + 
                                                (editForm.pax_babies || 0)
                              
                              if (currentSum > 0 && newTotal !== currentSum) {
                                // Simple adjustment: put the difference in students field
                                const difference = newTotal - currentSum
                                setEditForm({ 
                                  ...editForm, 
                                  pax_total: newTotal,
                                  pax_students: Math.max(0, (editForm.pax_students || 0) + difference)
                                })
                              } else {
                                setEditForm({ ...editForm, pax_total: newTotal })
                              }
                            }}
                          />
                          <div className="text-xs text-muted-foreground">
                            内訳合計: {((editForm.pax_adults || 0) + (editForm.pax_adult_leaders || 0) + (editForm.pax_students || 0) + (editForm.pax_children || 0) + (editForm.pax_infants || 0) + (editForm.pax_babies || 0))}名
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{booking.pax_total}名</p>
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
                            <SelectItem value="draft">下書き</SelectItem>
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

                  {/* PAX Breakdown Details (only shown in edit mode) */}
                  {isEditing && (
                    <div className="space-y-2">
                      <Label>人数内訳詳細</Label>
                      <div className="grid grid-cols-2 gap-4 p-3 border rounded-lg bg-muted/20">
                        <div className="space-y-2">
                          <Label className="text-xs">大人</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editForm.pax_adults || 0}
                            onChange={(e) => setEditForm({ ...editForm, pax_adults: Number.parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">引率者</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editForm.pax_adult_leaders || 0}
                            onChange={(e) => setEditForm({ ...editForm, pax_adult_leaders: Number.parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">学生</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editForm.pax_students || 0}
                            onChange={(e) => setEditForm({ ...editForm, pax_students: Number.parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">子供</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editForm.pax_children || 0}
                            onChange={(e) => setEditForm({ ...editForm, pax_children: Number.parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">幼児</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editForm.pax_infants || 0}
                            onChange={(e) => setEditForm({ ...editForm, pax_infants: Number.parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">乳児</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editForm.pax_babies || 0}
                            onChange={(e) => setEditForm({ ...editForm, pax_babies: Number.parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ※ 内訳合計が宿泊人数と一致する必要があります
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>割り当て部屋</Label>
                    <div className="text-sm">
                      {booking.project_rooms && booking.project_rooms.length > 0 ? (
                        booking.project_rooms.map((pr, index) => (
                          <div key={index} className="mb-1">
                            {pr.rooms.name} ({pr.assigned_pax}名)
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">部屋が割り当てられていません</p>
                      )}
                    </div>
                    {isEditing && booking.project_rooms && booking.project_rooms.length > 0 && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                        💡 部屋の割り当てを変更したい場合は、この予約を一旦削除して新規作成してください。
                      </div>
                    )}
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

              {/* 予約履歴・金額情報 */}
              <Card>
                <CardHeader>
                  <CardTitle>予約履歴・金額情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>作成日時</Label>
                      <p className="text-sm">{new Date(booking.created_at).toLocaleString("ja-JP")}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>更新日時</Label>
                      <p className="text-sm">{new Date(booking.updated_at).toLocaleString("ja-JP")}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>合計金額</Label>
                    <p className="text-2xl font-bold text-primary">¥{(booking.total_amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>内訳</Label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>部屋料金: ¥{(booking.room_amount || 0).toLocaleString()}</div>
                      <div>人数料金: ¥{(booking.pax_amount || 0).toLocaleString()}</div>
                      <div>オプション: ¥{(booking.addon_amount || 0).toLocaleString()}</div>
                      <div>小計: ¥{(booking.subtotal_amount || 0).toLocaleString()}</div>
                    </div>
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
                      <p className="text-sm">{booking.guest_name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>メールアドレス</Label>
                      <p className="text-sm">{booking.guest_email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>電話番号</Label>
                      <p className="text-sm">{booking.guest_phone || "未登録"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>組織名</Label>
                      <p className="text-sm">{booking.guest_org || "未登録"}</p>
                    </div>
                  </div>
                  {booking.purpose && (
                    <div className="space-y-2">
                      <Label>利用目的</Label>
                      <p className="text-sm">{booking.purpose}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="estimate" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>見積もり詳細</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      見積もり機能は準備中です。予約詳細は他のタブでご確認ください。
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
