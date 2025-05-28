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
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  RefreshCw,
  Loader2,
  ExternalLink
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SyncConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  type: "new" | "update"
  booking: any
  customer: any
  room: any
  selectedBoardCustomer?: any
  selectedProject?: any
  existingEstimate?: any
  newEstimate?: any
}

export function SyncConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  booking,
  customer,
  room,
  selectedBoardCustomer,
  selectedProject,
  existingEstimate,
  newEstimate
}: SyncConfirmationDialogProps) {
  const [syncStatus, setSyncStatus] = useState<'pending' | 'syncing' | 'success' | 'error'>('pending')
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncError, setSyncError] = useState<string>("")
  const [boardEstimateId, setBoardEstimateId] = useState<string>("")

  const handleConfirmSync = async () => {
    setSyncStatus('syncing')
    setSyncProgress(0)

    try {
      // ステップ1: 認証確認
      setSyncProgress(25)
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (type === 'new') {
        // ステップ2: 案件作成
        setSyncProgress(50)
        await new Promise(resolve => setTimeout(resolve, 1000))

        // ステップ3: 見積書作成
        setSyncProgress(75)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } else {
        // ステップ2: 既存見積書更新
        setSyncProgress(50)
        await new Promise(resolve => setTimeout(resolve, 1000))

        setSyncProgress(75)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // ステップ4: 完了
      setSyncProgress(100)
      await new Promise(resolve => setTimeout(resolve, 500))

      setBoardEstimateId(`EST-${Date.now()}`)
      setSyncStatus('success')

    } catch (error) {
      setSyncStatus('error')
      setSyncError("Board APIとの通信に失敗しました。しばらく後にもう一度お試しください。")
    }
  }

  const handleComplete = () => {
    onConfirm()
  }

  const calculateNights = () => {
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  }

  const nights = calculateNights()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'new' ? (
              <>
                <Upload className="h-5 w-5" />
                Board新規見積書作成の最終確認
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Board見積書更新の最終確認
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {syncStatus === 'pending' && (
            <>
              {/* 同期対象の概要 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">同期内容の確認</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">予約情報</p>
                        <div className="space-y-1">
                          <p className="font-medium">予約ID: {booking.id}</p>
                          <p className="text-sm">{customer.name}様</p>
                          <p className="text-sm">{new Date(booking.checkIn).toLocaleDateString('ja-JP')} 〜 {new Date(booking.checkOut).toLocaleDateString('ja-JP')} ({nights}泊)</p>
                          <p className="text-sm">{room.name} / {booking.guestCount}名</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {type === 'new' ? 'Board連携先' : '更新対象案件'}
                        </p>
                        <div className="space-y-1">
                          {type === 'new' ? (
                            <>
                              <p className="font-medium">顧客: {selectedBoardCustomer?.name}</p>
                              {selectedBoardCustomer?.company && (
                                <p className="text-sm">{selectedBoardCustomer.company}</p>
                              )}
                              <p className="text-sm">{selectedBoardCustomer?.email}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium">{selectedProject?.project_number}</p>
                              <p className="text-sm">{selectedProject?.title}</p>
                              <p className="text-sm">顧客: {selectedProject?.client_name}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 送信内容の詳細 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">送信する見積書内容</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b pb-2">
                        <span>項目名</span>
                        <span className="text-center">数量</span>
                        <span className="text-right">単価</span>
                        <span className="text-right">金額</span>
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <span>{room.name} 宿泊費</span>
                          <span className="text-center">{nights}泊</span>
                          <span className="text-right">¥{room.basePrice.toLocaleString()}</span>
                          <span className="text-right">¥{(room.basePrice * nights).toLocaleString()}</span>
                        </div>
                        
                        {Math.max(0, booking.guestCount - room.baseCapacity) > 0 && (
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <span>追加人数料金</span>
                            <span className="text-center">{Math.max(0, booking.guestCount - room.baseCapacity)}名</span>
                            <span className="text-right">¥{((room.additionalGuestFee || 0) * nights).toLocaleString()}</span>
                            <span className="text-right">¥{(Math.max(0, booking.guestCount - room.baseCapacity) * (room.additionalGuestFee || 0) * nights).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-48 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>合計金額:</span>
                          <span className="font-bold">¥{booking.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  この操作により、上記の内容でBoard APIに見積書が{type === 'new' ? '新規作成' : '更新'}されます。
                  実行後の取り消しはできませんのでご注意ください。
                </AlertDescription>
              </Alert>
            </>
          )}

          {syncStatus === 'syncing' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Board APIと同期中...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={syncProgress} className="w-full" />
                <div className="text-sm text-muted-foreground">
                  {syncProgress === 25 && "認証情報を確認しています..."}
                  {syncProgress === 50 && (type === 'new' ? "Board案件を作成しています..." : "既存案件を取得しています...")}
                  {syncProgress === 75 && (type === 'new' ? "見積書を作成しています..." : "見積書を更新しています...")}
                  {syncProgress === 100 && "同期を完了しています..."}
                </div>
              </CardContent>
            </Card>
          )}

          {syncStatus === 'success' && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  同期が完了しました
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-green-700">
                    見積書がBoard APIに正常に{type === 'new' ? '作成' : '更新'}されました。
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">見積書ID</p>
                      <p className="font-medium">{boardEstimateId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">同期日時</p>
                      <p className="font-medium">{new Date().toLocaleString('ja-JP')}</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => window.open('https://the-board.jp/estimates/' + boardEstimateId, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Boardで見積書を確認
                </Button>
              </CardContent>
            </Card>
          )}

          {syncStatus === 'error' && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  同期に失敗しました
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{syncError}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {syncStatus === 'pending' && (
            <>
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button onClick={handleConfirmSync}>
                実行する
              </Button>
            </>
          )}

          {syncStatus === 'syncing' && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              同期中...
            </Button>
          )}

          {(syncStatus === 'success' || syncStatus === 'error') && (
            <Button onClick={handleComplete}>
              完了
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}