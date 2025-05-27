"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator, RefreshCw } from "lucide-react"
import { useRoomStore } from "@/store/room-store"

// 年齢区分別基本料金
const basePricing = {
  largeRoom: {
    adult: 4800,
    student: 4000,
    child: 3200,
    preschool: 2500,
    infant: 0,
  },
  mediumRoom: {
    adult: 4800,
    student: 4000,
    child: 3200,
    preschool: 2500,
    infant: 0,
  },
  smallRoom: {
    adult: 8500,
    student: 5900,
    child: 5000,
    preschool: 4200,
    infant: 0,
  },
  accompaniedAdult: {
    adult: 6800,
    student: 5900,
    child: 5000,
    preschool: 4200,
    infant: 0,
  },
}

// シーズン・曜日係数
const multipliers = {
  weekday: 1.0,
  weekend: 1.22,
  peak: 1.15,
  peakWeekend: 1.37, // 1.22 * 1.15
}

const ageGroups = [
  { key: "adult", label: "大人" },
  { key: "student", label: "中高大学生" },
  { key: "child", label: "小学生" },
  { key: "preschool", label: "未就学児(3歳~)" },
  { key: "infant", label: "乳幼児(0~2歳)" },
]

const roomTypes = [
  { key: "largeRoom", label: "大部屋・中部屋", rooms: ["作法室", "被服室", "視聴覚室", "図書室"] },
  { key: "smallRoom", label: "個室", rooms: ["1年1組", "1年2組", "2年1組", "2年2組", "3年1組", "3年2組", "3年3組", "理科室"] },
  { key: "accompaniedAdult", label: "個室(合宿付添)", rooms: ["個室利用時の大人付添料金"] },
]

const scenarios = [
  { key: "weekday", label: "平日・通常期", multiplier: multipliers.weekday },
  { key: "weekend", label: "休日・通常期", multiplier: multipliers.weekend },
  { key: "peak", label: "平日・繁忙期", multiplier: multipliers.peak },
  { key: "peakWeekend", label: "休日・繁忙期", multiplier: multipliers.peakWeekend },
]

export function PricingMatrix() {
  const { rooms } = useRoomStore()
  const [selectedScenario, setSelectedScenario] = useState("weekday")
  const [simulationGuests, setSimulationGuests] = useState({
    adult: 2,
    student: 0,
    child: 0,
    preschool: 0,
    infant: 0,
  })
  const [selectedRoomType, setSelectedRoomType] = useState("largeRoom")
  const [nights, setNights] = useState(1)

  const calculatePrice = (roomType: string, ageGroup: string, scenario: string) => {
    const basePrice = basePricing[roomType as keyof typeof basePricing][ageGroup as keyof typeof basePricing.largeRoom]
    const multiplier = scenarios.find(s => s.key === scenario)?.multiplier || 1.0
    return Math.round(basePrice * multiplier)
  }

  const calculateTotalSimulation = () => {
    const pricing = basePricing[selectedRoomType as keyof typeof basePricing]
    const multiplier = scenarios.find(s => s.key === selectedScenario)?.multiplier || 1.0
    
    let total = 0
    Object.entries(simulationGuests).forEach(([ageGroup, count]) => {
      const basePrice = pricing[ageGroup as keyof typeof pricing]
      total += basePrice * multiplier * count * nights
    })
    
    return Math.round(total)
  }

  const getTotalGuests = () => {
    return Object.values(simulationGuests).reduce((sum, count) => sum + count, 0)
  }

  return (
    <div className="space-y-6">
      {/* 料金マトリクス表示 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>料金マトリクス</CardTitle>
              <CardDescription>年齢区分・部屋タイプ・シーズン別料金一覧</CardDescription>
            </div>
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.key} value={scenario.key}>
                    {scenario.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部屋タイプ</TableHead>
                {ageGroups.map((group) => (
                  <TableHead key={group.key} className="text-center">
                    {group.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes.map((roomType) => (
                <TableRow key={roomType.key}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{roomType.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {roomType.rooms.slice(0, 2).join(", ")}
                        {roomType.rooms.length > 2 && "..."}
                      </div>
                    </div>
                  </TableCell>
                  {ageGroups.map((group) => (
                    <TableCell key={group.key} className="text-center">
                      <div className="font-medium">
                        ¥{calculatePrice(roomType.key, group.key, selectedScenario).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        /人/泊
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm">
              <strong>料金計算式:</strong> 基本料金 × {scenarios.find(s => s.key === selectedScenario)?.multiplier} 
              ({scenarios.find(s => s.key === selectedScenario)?.label})
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 料金シミュレーション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            料金シミュレーション
          </CardTitle>
          <CardDescription>具体的な条件での料金計算</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* シミュレーション条件 */}
            <div className="space-y-4">
              <h4 className="font-semibold">シミュレーション条件</h4>
              
              <div className="space-y-2">
                <Label>部屋タイプ</Label>
                <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.key} value={type.key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>宿泊日数</Label>
                <Input
                  type="number"
                  value={nights}
                  onChange={(e) => setNights(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>

              <div className="space-y-3">
                <Label>人数構成</Label>
                {ageGroups.map((group) => (
                  <div key={group.key} className="flex items-center justify-between">
                    <Label className="text-sm">{group.label}:</Label>
                    <Input
                      type="number"
                      value={simulationGuests[group.key as keyof typeof simulationGuests]}
                      onChange={(e) =>
                        setSimulationGuests({
                          ...simulationGuests,
                          [group.key]: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      className="w-20"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* シミュレーション結果 */}
            <div className="space-y-4">
              <h4 className="font-semibold">計算結果</h4>
              
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-center">
                  ¥{calculateTotalSimulation().toLocaleString()}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {getTotalGuests()}名 × {nights}泊 ({scenarios.find(s => s.key === selectedScenario)?.label})
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium">内訳</h5>
                {Object.entries(simulationGuests).map(([ageGroup, count]) => {
                  if (count === 0) return null
                  const group = ageGroups.find(g => g.key === ageGroup)
                  const price = calculatePrice(selectedRoomType, ageGroup, selectedScenario)
                  const subtotal = price * count * nights
                  
                  return (
                    <div key={ageGroup} className="flex justify-between text-sm">
                      <span>{group?.label} × {count}名 × {nights}泊:</span>
                      <span>¥{subtotal.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>

              <div className="pt-3 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      ¥{Math.round(calculateTotalSimulation() / getTotalGuests() / nights).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">1人1泊あたり</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      ¥{Math.round(calculateTotalSimulation() / nights).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">1泊あたり</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 部屋別料金設定 */}
      <Card>
        <CardHeader>
          <CardTitle>部屋別料金設定</CardTitle>
          <CardDescription>登録済み部屋の室料一覧</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部屋名</TableHead>
                <TableHead>フロア</TableHead>
                <TableHead>定員</TableHead>
                <TableHead>室料</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{room.floor || room.type}</TableCell>
                  <TableCell>{room.capacity}名</TableCell>
                  <TableCell>¥{room.basePrice?.toLocaleString()}/泊</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {room.capacity <= 5 ? "個室" : room.capacity <= 10 ? "中部屋" : "大部屋"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={room.isActive ? "default" : "secondary"}>
                      {room.isActive ? "アクティブ" : "非アクティブ"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}