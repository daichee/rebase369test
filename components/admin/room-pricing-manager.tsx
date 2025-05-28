"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Save, RefreshCw } from "lucide-react"
import type { RoomRate } from "@/lib/pricing/types"

const DEFAULT_ROOM_RATES: RoomRate[] = [
  {
    rateId: "room_large",
    roomType: "large",
    roomName: "大部屋（作法室・被服室）",
    baseRate: 20000,
    effectiveFrom: "2024-01-01",
    isActive: true
  },
  {
    rateId: "room_medium_a", 
    roomType: "medium_a",
    roomName: "中部屋（視聴覚室）",
    baseRate: 13000,
    effectiveFrom: "2024-01-01",
    isActive: true
  },
  {
    rateId: "room_medium_b",
    roomType: "medium_b", 
    roomName: "中部屋（図書室）",
    baseRate: 8000,
    effectiveFrom: "2024-01-01",
    isActive: true
  },
  {
    rateId: "room_small_a",
    roomType: "small_a",
    roomName: "個室（1年1組・1年2組）", 
    baseRate: 7000,
    effectiveFrom: "2024-01-01",
    isActive: true
  },
  {
    rateId: "room_small_b",
    roomType: "small_b",
    roomName: "個室（理科室）",
    baseRate: 6000,
    effectiveFrom: "2024-01-01", 
    isActive: true
  },
  {
    rateId: "room_small_c",
    roomType: "small_c",
    roomName: "個室（2年組・3年組）",
    baseRate: 5000,
    effectiveFrom: "2024-01-01",
    isActive: true
  }
]

const roomTypeLabels = {
  large: "大部屋",
  medium_a: "中部屋A",
  medium_b: "中部屋B",
  small_a: "個室A",
  small_b: "個室B",
  small_c: "個室C"
}

export function RoomPricingManager() {
  const [roomRates, setRoomRates] = useState<RoomRate[]>(DEFAULT_ROOM_RATES)
  const [hasChanges, setHasChanges] = useState(false)

  const updateRate = (roomType: string, newRate: number) => {
    setRoomRates(roomRates.map(room => 
      room.roomType === roomType 
        ? { ...room, baseRate: newRate }
        : room
    ))
    setHasChanges(true)
  }

  const handleSave = () => {
    // TODO: APIに保存
    console.log("Saving room rates:", roomRates)
    setHasChanges(false)
  }

  const handleReset = () => {
    setRoomRates(DEFAULT_ROOM_RATES)
    setHasChanges(false)
  }

  const renderRateInput = (roomRate: RoomRate) => (
    <div className="flex items-center space-x-1">
      <span className="text-sm">¥</span>
      <Input
        type="number"
        value={roomRate.baseRate}
        onChange={(e) => updateRate(roomRate.roomType, parseInt(e.target.value) || 0)}
        className="w-32 text-right"
      />
      <span className="text-sm text-muted-foreground">/泊</span>
    </div>
  )

  const getTotalCapacity = () => {
    // TODO: 実際の部屋データから取得
    const capacities = {
      large: 30,
      medium_a: 20,
      medium_b: 15,
      small_a: 8,
      small_b: 6,
      small_c: 4
    }
    return roomRates.reduce((total, room) => {
      return total + (capacities[room.roomType as keyof typeof capacities] || 0)
    }, 0)
  }

  const getAverageRate = () => {
    const totalRate = roomRates.reduce((sum, room) => sum + room.baseRate, 0)
    return Math.round(totalRate / roomRates.length)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Home className="mr-2 h-5 w-5" />
              部屋料金設定
            </CardTitle>
            <CardDescription>
              部屋タイプ別の基本室料を設定します。季節や曜日による変動はありません。
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              <RefreshCw className="mr-2 h-4 w-4" />
              リセット
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="mr-2 h-4 w-4" />
              保存
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 部屋料金テーブル */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部屋タイプ</TableHead>
                <TableHead>部屋名</TableHead>
                <TableHead>分類</TableHead>
                <TableHead className="text-center">室料</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomRates.map((roomRate) => (
                <TableRow key={roomRate.roomType}>
                  <TableCell className="font-medium">
                    {roomTypeLabels[roomRate.roomType as keyof typeof roomTypeLabels]}
                  </TableCell>
                  <TableCell>{roomRate.roomName}</TableCell>
                  <TableCell>
                    <Badge variant={roomRate.roomType.startsWith('small') ? "default" : "secondary"}>
                      {roomRate.roomType.startsWith('small') ? "個室" : "共同利用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {renderRateInput(roomRate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={roomRate.isActive ? "default" : "secondary"}>
                      {roomRate.isActive ? "有効" : "無効"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 統計情報 */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  ¥{getAverageRate().toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  平均室料
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  ¥{roomRates.reduce((min, room) => Math.min(min, room.baseRate), Infinity).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  最低室料
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  ¥{roomRates.reduce((max, room) => Math.max(max, room.baseRate), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  最高室料
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 注意事項 */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm">
              <strong>料金設定のポイント:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                <li>部屋料金は宿泊数に応じて自動計算されます</li>
                <li>季節や曜日による変動は個人料金のみに適用されます</li>
                <li>個室と共同利用の料金差は個人料金で調整されます</li>
                <li>料金変更は即座に新規予約に反映されます</li>
              </ul>
            </div>
          </div>

          {hasChanges && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                室料に変更があります。忘れずに保存してください。
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}