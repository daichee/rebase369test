"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface EstimateDisplayProps {
  booking: any
  customer: any
  room: any
}

export function EstimateDisplay({ booking, customer, room }: EstimateDisplayProps) {
  // 宿泊日数を計算
  const calculateNights = () => {
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  }

  const nights = calculateNights()
  const baseAmount = room.basePrice * nights
  const additionalGuestFee = Math.max(0, booking.guestCount - room.baseCapacity) * (room.additionalGuestFee || 0) * nights
  const subtotal = baseAmount + additionalGuestFee
  const taxAmount = Math.round(subtotal * 0.1)
  const totalAmount = subtotal + taxAmount

  return (
    <div className="space-y-6">
      {/* 見積書ヘッダー */}
      <Card>
        <CardHeader className="text-center border-b">
          <div className="flex justify-between items-start">
            <div className="text-left">
              <h3 className="text-sm font-medium text-muted-foreground">株式会社Reベース369</h3>
              <p className="text-xs text-muted-foreground">〒000-0000 住所情報</p>
              <p className="text-xs text-muted-foreground">TEL: 000-000-0000</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">ご宿泊御見積書</h2>
              <p className="text-sm text-muted-foreground">見積番号: EST-{booking.id.slice(-6)}</p>
              <p className="text-sm text-muted-foreground">発行日: {new Date().toLocaleDateString('ja-JP')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* 宛先情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-2">宛先</h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{customer.name} 様</p>
                {customer.company && <p>{customer.company}</p>}
                {customer.address && <p>{customer.address}</p>}
                <p>{customer.email}</p>
                <p>{customer.phone}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">ご宿泊概要</h4>
              <div className="space-y-1 text-sm">
                <p>チェックイン: {new Date(booking.checkIn).toLocaleDateString('ja-JP')}</p>
                <p>チェックアウト: {new Date(booking.checkOut).toLocaleDateString('ja-JP')}</p>
                <p>宿泊日数: {nights}泊</p>
                <p>ご利用人数: {booking.guestCount}名</p>
                <p>お部屋: {room.name}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* 明細表 */}
          <div className="space-y-4">
            <h4 className="font-medium">明細</h4>
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">項目</th>
                    <th className="text-center p-3 font-medium w-20">数量</th>
                    <th className="text-center p-3 font-medium w-20">単位</th>
                    <th className="text-right p-3 font-medium w-24">単価</th>
                    <th className="text-right p-3 font-medium w-24">金額</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">{room.name} 宿泊費</td>
                    <td className="text-center p-3">{nights}</td>
                    <td className="text-center p-3">泊</td>
                    <td className="text-right p-3">¥{room.basePrice.toLocaleString()}</td>
                    <td className="text-right p-3">¥{baseAmount.toLocaleString()}</td>
                  </tr>
                  {additionalGuestFee > 0 && (
                    <tr className="border-t">
                      <td className="p-3">追加人数料金</td>
                      <td className="text-center p-3">{Math.max(0, booking.guestCount - room.baseCapacity)}</td>
                      <td className="text-center p-3">名</td>
                      <td className="text-right p-3">¥{((room.additionalGuestFee || 0) * nights).toLocaleString()}</td>
                      <td className="text-right p-3">¥{additionalGuestFee.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 合計金額 */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>小計:</span>
                  <span>¥{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>消費税 (10%):</span>
                  <span>¥{taxAmount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>合計:</span>
                  <span>¥{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* 備考・条件 */}
          <div className="space-y-4">
            <h4 className="font-medium">備考・条件</h4>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>・チェックイン時間: 15:00～</p>
              <p>・チェックアウト時間: ～11:00</p>
              <p>・お支払い方法: 現金、クレジットカード</p>
              <p>・キャンセル料: 前日50%、当日100%</p>
              {booking.notes && <p>・特記事項: {booking.notes}</p>}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}