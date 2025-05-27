"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Users, RefreshCw, X } from "lucide-react"
import { useDoubleBookingPrevention } from "@/lib/hooks/use-double-booking-prevention"
import type { BookingConflict } from "@/lib/booking/double-booking-prevention"

interface ConflictNotificationProps {
  roomIds: string[]
  startDate: string
  endDate: string
  onResolve?: (resolutionType: 'alternative_rooms' | 'alternative_dates') => void
  onDismiss?: () => void
}

export function ConflictNotification({
  roomIds,
  startDate,
  endDate,
  onResolve,
  onDismiss
}: ConflictNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null)
  const [resolutionOptions, setResolutionOptions] = useState<any[]>([])
  
  const {
    checkForConflicts,
    detectAndResolveConflicts,
    conflicts,
    hasConflicts,
    otherActiveSessions
  } = useDoubleBookingPrevention({ autoCheck: true, checkInterval: 15000 })

  // 定期的な競合チェック
  useEffect(() => {
    if (roomIds.length > 0 && startDate && endDate) {
      performConflictCheck()
      
      const interval = setInterval(() => {
        performConflictCheck()
      }, 15000) // 15秒間隔

      return () => clearInterval(interval)
    }
  }, [roomIds, startDate, endDate])

  const performConflictCheck = async () => {
    try {
      const result = await checkForConflicts(roomIds, startDate, endDate)
      setLastCheckTime(new Date().toLocaleTimeString())

      if (!result.success) {
        // 代替案を検索
        const resolutionResult = await detectAndResolveConflicts(
          '', // 新規予約なのでID無し
          roomIds,
          startDate,
          endDate
        )
        setResolutionOptions(resolutionResult.resolutionOptions || [])
      } else {
        setResolutionOptions([])
      }
    } catch (error) {
      console.error("競合チェックエラー:", error)
    }
  }

  const handleResolve = (resolutionType: 'alternative_rooms' | 'alternative_dates') => {
    onResolve?.(resolutionType)
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible || (!hasConflicts && otherActiveSessions === 0)) {
    return null
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-800 text-base">
              {hasConflicts ? "予約競合を検出" : "他ユーザーがアクティブ"}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-red-700">
          {hasConflicts 
            ? `${conflicts.length}件の予約競合が発生しています` 
            : `${otherActiveSessions}名のユーザーが同時に予約を検討中です`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 競合詳細 */}
        {hasConflicts && conflicts.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium text-sm text-red-800">競合詳細:</div>
            {conflicts.map((conflict, index) => (
              <Alert key={index} variant="destructive" className="py-2">
                <AlertDescription className="text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{conflict.roomId}</span>
                      <span className="text-muted-foreground ml-2">
                        vs {conflict.conflictingGuestName}様
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {conflict.overlapNights}泊重複
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    重複期間: {conflict.overlapStart} ～ {conflict.overlapEnd}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* 代替案提示 */}
        {resolutionOptions.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium text-sm text-green-800">代替案:</div>
            <div className="grid gap-2">
              {resolutionOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve(option.type)}
                  className="justify-start h-auto py-2 px-3"
                >
                  <div className="text-left">
                    <div className="font-medium text-xs">{option.description}</div>
                    {option.type === 'alternative_rooms' && (
                      <div className="text-xs text-muted-foreground">
                        利用可能な代替部屋があります
                      </div>
                    )}
                    {option.type === 'alternative_dates' && (
                      <div className="text-xs text-muted-foreground">
                        前後の日程で空きがあります
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* ステータス情報 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>最終確認: {lastCheckTime || "確認中..."}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>アクティブユーザー: {otherActiveSessions}名</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={performConflictCheck}
            className="h-6 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}