"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EstimateComparisonProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  project: any
  booking: any
  customer: any
  room: any
}

export function EstimateComparison({
  isOpen,
  onClose,
  onConfirm,
  project,
  booking,
  customer,
  room
}: EstimateComparisonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)

  // 現在の見積データ（既存）
  const calculateNights = () => {
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  }

  const nights = calculateNights()
  const baseAmount = room.basePrice * nights
  const additionalGuestFee = Math.max(0, booking.guestCount - room.baseCapacity) * (room.additionalGuestFee || 0) * nights
  const newSubtotal = baseAmount + additionalGuestFee
  const newTaxAmount = Math.round(newSubtotal * 0.1)
  const newTotalAmount = newSubtotal + newTaxAmount

  // 既存の見積データ（モック）
  const existingEstimate = {
    items: [
      {
        name: "デラックス和室 宿泊費",
        quantity: 2,
        unit: "泊",
        unit_price: 20000,
        amount: 40000
      },
      {
        name: "追加人数料金",
        quantity: 1,
        unit: "名",
        unit_price: 5000,
        amount: 5000
      }
    ],
    subtotal: 45000,
    tax_amount: 4500,
    total_amount: 49500
  }

  // 新しい見積データ
  const newEstimate = {
    items: [
      {
        name: `${room.name} 宿泊費`,
        quantity: nights,
        unit: "泊",
        unit_price: room.basePrice,
        amount: baseAmount
      },
      ...(additionalGuestFee > 0 ? [{
        name: "追加人数料金",
        quantity: Math.max(0, booking.guestCount - room.baseCapacity),
        unit: "名",
        unit_price: (room.additionalGuestFee || 0) * nights,
        amount: additionalGuestFee
      }] : [])
    ],
    subtotal: newSubtotal,
    tax_amount: newTaxAmount,
    total_amount: newTotalAmount
  }

  // 変更点の分析
  const changes = {
    total_diff: newEstimate.total_amount - existingEstimate.total_amount,
    items_changed: existingEstimate.items.length !== newEstimate.items.length ||
      existingEstimate.items.some((item, index) => 
        !newEstimate.items[index] || 
        item.amount !== newEstimate.items[index]?.amount
      )
  }

  const handleProceedToConfirmation = () => {
    setShowConfirmation(true)
  }

  const handleConfirmationComplete = () => {
    setShowConfirmation(false)
    onConfirm()
  }

  if (showConfirmation) {
    // Direct confirmation - no Board sync needed
    handleConfirmationComplete()
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            見積書更新の確認
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 案件情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">更新対象案件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">案件番号</p>
                  <p className="font-medium">{project.project_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">案件名</p>
                  <p className="font-medium">{project.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">顧客名</p>
                  <p className="font-medium">{project.client_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">現在の状況</p>
                  <Badge variant="secondary">{project.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 変更点の概要 */}
          <Alert className={changes.total_diff === 0 ? "border-green-200 bg-green-50" : changes.total_diff > 0 ? "border-orange-200 bg-orange-50" : "border-red-200 bg-red-50"}>
            {changes.total_diff === 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            )}
            <AlertDescription>
              {changes.total_diff === 0 ? (
                "合計金額に変更はありません"
              ) : changes.total_diff > 0 ? (
                `合計金額が ¥${changes.total_diff.toLocaleString()} 増加します`
              ) : (
                `合計金額が ¥${Math.abs(changes.total_diff).toLocaleString()} 減少します`
              )}
              {changes.items_changed && " （明細項目にも変更があります）"}
            </AlertDescription>
          </Alert>

          {/* 見積比較 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 既存見積 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline">既存</Badge>
                  現在の見積書
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {existingEstimate.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">
                          {item.quantity}{item.unit} × ¥{item.unit_price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-medium">¥{item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>小計:</span>
                    <span>¥{existingEstimate.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>消費税:</span>
                    <span>¥{existingEstimate.tax_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>合計:</span>
                    <span>¥{existingEstimate.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 矢印 */}
            <div className="flex items-center justify-center lg:flex-col">
              <ArrowRight className="h-8 w-8 text-muted-foreground lg:rotate-90" />
              <p className="text-sm text-muted-foreground mt-2 hidden lg:block">更新</p>
            </div>

            {/* 新しい見積 */}
            <Card className="ring-2 ring-blue-500">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="default">新規</Badge>
                  更新後の見積書
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {newEstimate.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">
                          {item.quantity}{item.unit} × ¥{item.unit_price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-medium">¥{item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>小計:</span>
                    <span>¥{newEstimate.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>消費税:</span>
                    <span>¥{newEstimate.tax_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>合計:</span>
                    <span className={changes.total_diff !== 0 ? (changes.total_diff > 0 ? 'text-red-600' : 'text-green-600') : ''}>
                      ¥{newEstimate.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 詳細な変更情報 */}
          {changes.items_changed && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">変更詳細</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• 宿泊日数: {nights}泊</p>
                  <p>• 利用人数: {booking.guestCount}名</p>
                  <p>• 部屋タイプ: {room.name}</p>
                  {additionalGuestFee > 0 && (
                    <p>• 追加人数料金: {Math.max(0, booking.guestCount - room.baseCapacity)}名分</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleProceedToConfirmation}>
            この内容で見積書を更新
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}