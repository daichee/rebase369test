"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CalendarDays, Info, RefreshCw, Search } from "lucide-react"
import { useAvailability } from "@/lib/hooks/use-availability"
import { useRooms } from "@/lib/hooks/use-rooms"
import { formatLocalDate, parseLocalDate, calculateNights } from "@/lib/utils/date-utils"

interface DateRangePickerProps {
  value: {
    startDate: string
    endDate: string
    nights: number
  }
  onChange: (dateRange: { startDate: string; endDate: string; nights: number }) => void
  availabilityResults?: any[]
}

export function DateRangePicker({ value, onChange, availabilityResults = [] }: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: value.startDate ? parseLocalDate(value.startDate) : undefined,
    to: value.endDate ? parseLocalDate(value.endDate) : undefined,
  })
  
  const [realTimeAvailability, setRealTimeAvailability] = useState<any[]>([])
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  
  const { rooms } = useRooms()
  const { checkAvailability, getOccupancyStats } = useAvailability()

  // リアルタイム空室チェック
  useEffect(() => {
    if (selectedRange.from && selectedRange.to) {
      const timer = setTimeout(() => {
        performAvailabilityCheck()
      }, 1000) // 1秒のデバウンス

      return () => clearTimeout(timer)
    }
  }, [selectedRange])

  const performAvailabilityCheck = async () => {
    if (!selectedRange.from || !selectedRange.to) return

    setIsCheckingAvailability(true)
    try {
      const dateRange = {
        startDate: formatLocalDate(selectedRange.from),
        endDate: formatLocalDate(selectedRange.to),
        nights: calculateNights(selectedRange.from, selectedRange.to),
      }

      const allRoomIds = rooms.map(room => room.roomId)
      const availability = await checkAvailability(allRoomIds, dateRange)
      setRealTimeAvailability(availability)
    } catch (error) {
      console.error("空室チェックエラー:", error)
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (!range) return

    setSelectedRange(range)

    if (range.from && range.to) {
      const startDate = formatLocalDate(range.from)
      const endDate = formatLocalDate(range.to)
      const nights = calculateNights(range.from, range.to)

      onChange({
        startDate,
        endDate,
        nights,
      })
    }
  }

  const getAvailabilityInfo = () => {
    // リアルタイムデータがある場合はそれを使用、なければ既存データを使用
    const dataToUse = realTimeAvailability.length > 0 ? realTimeAvailability : availabilityResults
    
    if (dataToUse.length === 0) return null

    const availableRooms = dataToUse.filter((r) => r.isAvailable).length
    const totalRooms = dataToUse.length

    return {
      availableRooms,
      totalRooms,
      occupancyRate: totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms) * 100 : 0,
      isRealTime: realTimeAvailability.length > 0,
    }
  }

  const availabilityInfo = getAvailabilityInfo()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            宿泊期間を選択
          </CardTitle>
          <CardDescription>
            チェックイン日とチェックアウト日を選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>

            <div className="lg:w-80 space-y-4">
              {/* 選択された期間 */}
              {selectedRange.from && selectedRange.to && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">選択された期間</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">チェックイン</span>
                      <span className="font-medium">{selectedRange.from.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">チェックアウト</span>
                      <span className="font-medium">{selectedRange.to.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm text-muted-foreground">宿泊日数</span>
                      <span className="font-bold">{value.nights}泊</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 空室状況 */}
              {availabilityInfo && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      空室状況
                      {isCheckingAvailability && (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      )}
                      {availabilityInfo.isRealTime && (
                        <Badge variant="outline" className="text-xs">
                          リアルタイム
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">利用可能部屋</span>
                      <Badge variant={availabilityInfo.availableRooms > 5 ? "default" : "secondary"}>
                        {availabilityInfo.availableRooms} / {availabilityInfo.totalRooms} 室
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">稼働率</span>
                      <span className={`text-sm font-medium ${
                        availabilityInfo.occupancyRate > 80 ? "text-red-600" : 
                        availabilityInfo.occupancyRate > 50 ? "text-yellow-600" : "text-green-600"
                      }`}>
                        {availabilityInfo.occupancyRate.toFixed(1)}%
                      </span>
                    </div>

                    {/* 即座確認機能 */}
                    {selectedRange.from && selectedRange.to && (
                      <div className="pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={performAvailabilityCheck}
                          disabled={isCheckingAvailability}
                          className="w-full"
                        >
                          <Search className="h-3 w-3 mr-1" />
                          {isCheckingAvailability ? "確認中..." : "即座確認"}
                        </Button>
                      </div>
                    )}

                    {availabilityInfo.occupancyRate > 80 && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          稼働率が高い期間です。早めのご予約をお勧めします。
                        </AlertDescription>
                      </Alert>
                    )}

                    {availabilityInfo.availableRooms === 0 && selectedRange.from && selectedRange.to && (
                      <Alert variant="destructive">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          選択期間は満室です。代替日程をご検討ください。
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 利用上の注意 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">利用上の注意</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p>• チェックイン: 15:00〜</p>
                  <p>• チェックアウト: 〜10:00</p>
                  <p>• 最短宿泊: 1泊</p>
                  <p>• 最長宿泊: 7泊</p>
                  <p>• 金・土・日・祝日は休日料金（22%割増）</p>
                  <p>• 繁忙期（3,4,5,7,8,9,12月）は15%割増</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}