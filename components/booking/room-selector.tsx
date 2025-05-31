"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, Users, MapPin, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useRooms } from "@/lib/hooks/use-rooms"
import { usePricing } from "@/lib/hooks/use-pricing"
import type { GuestCount } from "@/lib/pricing/types"

interface RoomSelectorProps {
  selectedRooms: string[]
  onChange: (selectedRooms: string[]) => void
  availabilityResults: any[]
  guests: GuestCount
  dateRange: {
    startDate: string
    endDate: string
    nights: number
  }
}

export function RoomSelector({
  selectedRooms,
  onChange,
  availabilityResults,
  guests,
  dateRange,
}: RoomSelectorProps) {
  const { rooms, loading } = useRooms()
  const { validateGuestCapacity, optimizeRoomSelection, calculateRoomPriceOnly } = usePricing()
  const [showOptimization, setShowOptimization] = useState(false)

  const totalGuests = Object.values(guests).reduce((sum, count) => sum + count, 0)

  useEffect(() => {
    // 人数が変更された時に最適化提案を表示
    if (totalGuests > 0 && selectedRooms.length === 0) {
      setShowOptimization(true)
    }
  }, [totalGuests, selectedRooms.length])

  const getRoomAvailability = (roomId: string) => {
    return availabilityResults.find((result) => result.roomId === roomId)
  }

  const handleRoomToggle = (roomId: string) => {
    const newSelection = selectedRooms.includes(roomId)
      ? selectedRooms.filter((id) => id !== roomId)
      : [...selectedRooms, roomId]

    onChange(newSelection)
  }

  const handleOptimizedSelection = () => {
    const availableRoomIds = availabilityResults
      .filter((result) => result.isAvailable)
      .map((result) => result.roomId)

    const optimization = optimizeRoomSelection(totalGuests, availableRoomIds)
    onChange(optimization.recommendedRooms)
    setShowOptimization(false)
  }

  const validation = validateGuestCapacity(selectedRooms, guests)
  const roomPrice = calculateRoomPriceOnly(selectedRooms, dateRange.nights)

  const floorGroups = {
    "2F": rooms.filter((room) => room.floor === "2F"),
    "3F": rooms.filter((room) => room.floor === "3F"),
  }

  if (loading) {
    return <div>部屋情報を読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            部屋を選択
          </CardTitle>
          <CardDescription>
            宿泊する部屋を選択してください。複数の部屋を選択できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 最適化提案 */}
          {showOptimization && totalGuests > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    {totalGuests}名に最適な部屋を自動選択しますか？
                  </span>
                  <div className="space-x-2">
                    <Button size="sm" onClick={handleOptimizedSelection}>
                      自動選択
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowOptimization(false)}>
                      手動選択
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 定員チェック結果 */}
          {selectedRooms.length > 0 && (
            <Alert variant={validation.isValid ? "default" : "destructive"}>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>
                    総定員: {validation.totalCapacity}名 / 宿泊者: {validation.totalGuests}名
                  </span>
                  {validation.isValid ? (
                    <Badge className="bg-green-100 text-green-800">定員内</Badge>
                  ) : (
                    <Badge variant="destructive">定員超過</Badge>
                  )}
                </div>
                {!validation.isValid && (
                  <p className="text-sm mt-2">{validation.message}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 室料表示 */}
          {selectedRooms.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">室料合計</span>
                  <span className="font-semibold">
                    ¥{roomPrice.toLocaleString()} ({dateRange.nights}泊)
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* フロア別部屋一覧 */}
          {Object.entries(floorGroups).map(([floor, floorRooms]) => (
            <div key={floor}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {floor} ({floorRooms.length}室)
              </h3>

              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {floorRooms.map((room) => {
                  const availability = getRoomAvailability(room.roomId)
                  const isSelected = selectedRooms.includes(room.roomId)
                  const isAvailable = availability?.isAvailable ?? true

                  return (
                    <Card
                      key={room.roomId}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-primary border-primary"
                          : isAvailable
                          ? "hover:shadow-md"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => isAvailable && handleRoomToggle(room.roomId)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isSelected}
                                onChange={() => isAvailable && handleRoomToggle(room.roomId)}
                                disabled={!isAvailable}
                              />
                              
                              <div>
                                <h4 className="font-medium">{room.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {room.roomId} • {room.description}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                {room.capacity}名
                              </Badge>
                              
                              <Badge variant={room.usageType === "private" ? "secondary" : "default"}>
                                {room.usageType === "private" ? "個室" : "大部屋・中部屋"}
                              </Badge>
                              
                              <Badge variant="outline">
                                ¥{room.roomRate.toLocaleString()}/泊
                              </Badge>
                            </div>

                            {room.amenities && room.amenities.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">
                                  設備: {room.amenities.join(", ")}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="ml-3">
                            {isAvailable ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </div>

                        {!isAvailable && availability?.conflictingBookings && (
                          <Alert variant="destructive" className="mt-3">
                            <AlertDescription className="text-xs">
                              この期間は予約済みです: {availability.conflictingBookings.join(", ")}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}

          {/* 部屋選択のヒント */}
          <Alert>
            <Home className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="font-medium">部屋選択のヒント</div>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>大部屋・中部屋: 共用スペースを楽しめ、料金もお得</li>
                <li>個室: プライベート重視だが、個人料金が高額</li>
                <li>複数部屋: グループ分けや用途別利用が可能</li>
                <li>2F: アクセスしやすく、作法室（和室）あり</li>
                <li>3F: 眺望良好、理科室・図書室など特色ある部屋</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}