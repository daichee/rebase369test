"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  Clock, 
  Users, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Unlock
} from "lucide-react"
import { useDoubleBookingPrevention } from "@/lib/hooks/use-double-booking-prevention"

interface RealtimeBookingStatusProps {
  roomIds: string[]
  startDate: string
  endDate: string
  isActive?: boolean
}

export function RealtimeBookingStatus({
  roomIds,
  startDate,
  endDate,
  isActive = true
}: RealtimeBookingStatusProps) {
  const [timeToLockExpiry, setTimeToLockExpiry] = useState(0)
  
  const {
    hasLock,
    lockExpiresAt,
    isLockExpiring,
    otherActiveSessions,
    hasConflicts,
    conflicts,
    isChecking,
    lastCheck,
    checkForConflicts,
    acquireLock,
    sessionId
  } = useDoubleBookingPrevention({ 
    autoCheck: isActive, 
    checkInterval: 20000 
  })

  // ロック期限までの時間を計算
  useEffect(() => {
    if (!lockExpiresAt) {
      setTimeToLockExpiry(0)
      return
    }

    const updateTimeToExpiry = () => {
      const now = Date.now()
      const expiry = new Date(lockExpiresAt).getTime()
      const timeLeft = Math.max(0, expiry - now)
      setTimeToLockExpiry(timeLeft)
    }

    updateTimeToExpiry()
    const interval = setInterval(updateTimeToExpiry, 1000)
    return () => clearInterval(interval)
  }, [lockExpiresAt])

  // ロック取得
  const handleAcquireLock = async () => {
    if (roomIds.length > 0 && startDate && endDate) {
      await acquireLock(roomIds, startDate, endDate)
    }
  }

  // 手動競合チェック
  const handleManualCheck = async () => {
    if (roomIds.length > 0 && startDate && endDate) {
      await checkForConflicts(roomIds, startDate, endDate)
    }
  }

  const formatTimeRemaining = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getLockProgress = () => {
    if (!lockExpiresAt) return 0
    const total = 10 * 60 * 1000 // 10分
    return Math.max(0, (timeToLockExpiry / total) * 100)
  }

  if (!isActive || (roomIds.length === 0 || !startDate || !endDate)) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800 text-base">
              リアルタイム予約ステータス
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualCheck}
            disabled={isChecking}
            className="h-6 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription className="text-blue-700">
          セッションID: {sessionId.split('_')[1]}...
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* ロック状態 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasLock ? (
                <Lock className="h-4 w-4 text-green-600" />
              ) : (
                <Unlock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">
                予約ロック
              </span>
            </div>
            <Badge 
              variant={hasLock ? "default" : "secondary"}
              className={hasLock ? "bg-green-100 text-green-800" : ""}
            >
              {hasLock ? "取得済み" : "未取得"}
            </Badge>
          </div>

          {hasLock && lockExpiresAt && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>残り時間</span>
                <span className={isLockExpiring ? "text-red-600 font-medium" : ""}>
                  {formatTimeRemaining(timeToLockExpiry)}
                </span>
              </div>
              <Progress 
                value={getLockProgress()} 
                className={`h-2 ${isLockExpiring ? "bg-red-100" : "bg-green-100"}`}
              />
              {isLockExpiring && (
                <div className="text-xs text-red-600 font-medium">
                  ⚠️ 期限が近づいています
                </div>
              )}
            </div>
          )}

          {!hasLock && roomIds.length > 0 && (
            <Button
              size="sm"
              onClick={handleAcquireLock}
              className="w-full"
              variant="outline"
            >
              ロックを取得
            </Button>
          )}
        </div>

        {/* 競合状態 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasConflicts ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm font-medium">
                競合状態
              </span>
            </div>
            <Badge 
              variant={hasConflicts ? "destructive" : "default"}
              className={!hasConflicts ? "bg-green-100 text-green-800" : ""}
            >
              {hasConflicts ? `${conflicts.length}件の競合` : "競合なし"}
            </Badge>
          </div>

          {hasConflicts && conflicts.length > 0 && (
            <div className="text-xs text-red-600 space-y-1">
              {conflicts.slice(0, 3).map((conflict, index) => (
                <div key={index} className="flex justify-between">
                  <span>{conflict.roomId}</span>
                  <span>vs {conflict.conflictingGuestName}</span>
                </div>
              ))}
              {conflicts.length > 3 && (
                <div className="text-center">
                  他 {conflicts.length - 3} 件...
                </div>
              )}
            </div>
          )}
        </div>

        {/* セッション情報 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                同時アクセス
              </span>
            </div>
            <Badge variant="secondary">
              {otherActiveSessions}名
            </Badge>
          </div>

          {otherActiveSessions > 0 && (
            <div className="text-xs text-blue-600">
              他のユーザーが同じ期間を検討中です
            </div>
          )}
        </div>

        {/* 最終チェック時刻 */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>最終チェック</span>
            </div>
            <span>
              {lastCheck 
                ? new Date(lastCheck).toLocaleTimeString()
                : "未実行"
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}