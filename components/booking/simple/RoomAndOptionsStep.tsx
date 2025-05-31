"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, ShoppingCart, Users, CheckCircle, AlertCircle, Bed, Utensils, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SimpleBookingFormData } from "./SimpleBookingWizard"

interface RoomAndOptionsStepProps {
  formData: SimpleBookingFormData
  onChange: (data: Partial<SimpleBookingFormData>) => void
  availabilityResults?: any[]
  priceBreakdown?: any
}

// モックルームデータ - 実際はAPIから取得
const ROOMS = [
  { id: "R201", name: "201号室", floor: "2F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R202", name: "202号室", floor: "2F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R203", name: "203号室", floor: "2F", type: "large", capacity: 6, basePrice: 18000 },
  { id: "R204", name: "204号室", floor: "2F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R205", name: "205号室", floor: "2F", type: "suite", capacity: 8, basePrice: 22000 },
  { id: "R301", name: "301号室", floor: "3F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R302", name: "302号室", floor: "3F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R303", name: "303号室", floor: "3F", type: "large", capacity: 6, basePrice: 18000 },
  { id: "R304", name: "304号室", floor: "3F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R305", name: "305号室", floor: "3F", type: "standard", capacity: 4, basePrice: 15000 },
  { id: "R306", name: "306号室", floor: "3F", type: "large", capacity: 6, basePrice: 18000 },
  { id: "R307", name: "307号室", floor: "3F", type: "suite", capacity: 8, basePrice: 22000 },
]

// モックオプションデータ
const OPTIONS = [
  {
    id: "meal_breakfast",
    category: "食事",
    name: "朝食",
    description: "和洋バイキング",
    price: 800,
    unit: "人/日",
    icon: Utensils
  },
  {
    id: "meal_lunch",
    category: "食事", 
    name: "昼食",
    description: "お弁当またはバイキング",
    price: 1200,
    unit: "人/日",
    icon: Utensils
  },
  {
    id: "meal_dinner",
    category: "食事",
    name: "夕食",
    description: "BBQまたは和食",
    price: 2000,
    unit: "人/日",
    icon: Utensils
  },
  {
    id: "facility_meeting",
    category: "施設",
    name: "会議室利用",
    description: "プロジェクター・ホワイトボード付き",
    price: 3000,
    unit: "日",
    icon: Briefcase
  },
  {
    id: "facility_parking",
    category: "施設",
    name: "駐車場",
    description: "1台あたり",
    price: 500,
    unit: "台/日",
    icon: Home
  },
  {
    id: "equipment_futon",
    category: "備品",
    name: "追加布団",
    description: "1組あたり",
    price: 1000,
    unit: "組/日",
    icon: Bed
  },
]

export function RoomAndOptionsStep({ formData, onChange, availabilityResults, priceBreakdown }: RoomAndOptionsStepProps) {
  const [selectedFloor, setSelectedFloor] = useState<string>("all")

  const totalGuests = Object.values(formData.guests).reduce((sum, count) => sum + count, 0)

  // 利用可能な部屋を計算
  const getAvailableRooms = () => {
    if (!availabilityResults || availabilityResults.length === 0) {
      return ROOMS.map(room => ({ ...room, isAvailable: true }))
    }

    return ROOMS.map(room => {
      const availability = availabilityResults.find(result => result.roomId === room.id)
      return {
        ...room,
        isAvailable: availability ? availability.isAvailable : true
      }
    })
  }

  const availableRooms = getAvailableRooms()
  const filteredRooms = selectedFloor === "all" 
    ? availableRooms 
    : availableRooms.filter(room => room.floor === selectedFloor)

  // 定員チェック
  const getCapacityStatus = () => {
    const selectedRoomData = ROOMS.filter(room => formData.selectedRooms.includes(room.id))
    const totalCapacity = selectedRoomData.reduce((sum, room) => sum + room.capacity, 0)
    
    return {
      totalCapacity,
      isValid: totalCapacity >= totalGuests,
      isOptimal: totalCapacity >= totalGuests && totalCapacity <= totalGuests + 2
    }
  }

  const capacityStatus = getCapacityStatus()

  const toggleRoom = (roomId: string) => {
    const newSelectedRooms = formData.selectedRooms.includes(roomId)
      ? formData.selectedRooms.filter(id => id !== roomId)
      : [...formData.selectedRooms, roomId]
    
    onChange({ selectedRooms: newSelectedRooms })
  }

  const toggleOption = (optionId: string) => {
    const newSelectedOptions = formData.selectedAddons.some(addon => addon.id === optionId)
      ? formData.selectedAddons.filter(addon => addon.id !== optionId)
      : [...formData.selectedAddons, { id: optionId, quantity: 1 }]
    
    onChange({ selectedAddons: newSelectedOptions })
  }

  const updateOptionQuantity = (optionId: string, quantity: number) => {
    const newSelectedOptions = formData.selectedAddons.map(addon =>
      addon.id === optionId ? { ...addon, quantity: Math.max(0, quantity) } : addon
    ).filter(addon => addon.quantity > 0)
    
    onChange({ selectedAddons: newSelectedOptions })
  }

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case "standard": return "スタンダード"
      case "large": return "ラージ"
      case "suite": return "スイート"
      default: return type
    }
  }

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case "standard": return "bg-blue-100 text-blue-800"
      case "large": return "bg-green-100 text-green-800"
      case "suite": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-8">
      {/* 部屋選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Home className="mr-2 h-5 w-5" />
            部屋選択
          </CardTitle>
          <CardDescription>
            宿泊者 {totalGuests}名に適した部屋を選択してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* フロア選択 */}
          <div className="flex gap-2">
            <Button
              variant={selectedFloor === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFloor("all")}
            >
              全フロア
            </Button>
            <Button
              variant={selectedFloor === "2F" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFloor("2F")}
            >
              2階
            </Button>
            <Button
              variant={selectedFloor === "3F" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFloor("3F")}
            >
              3階
            </Button>
          </div>

          {/* 定員状況 */}
          {formData.selectedRooms.length > 0 && (
            <Alert variant={capacityStatus.isValid ? "default" : "destructive"}>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    定員: {capacityStatus.totalCapacity}名 / 宿泊者: {totalGuests}名
                  </span>
                  {capacityStatus.isValid ? (
                    <Badge variant="default" className="flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      OK
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      定員不足
                    </Badge>
                  )}
                </div>
                {!capacityStatus.isOptimal && capacityStatus.isValid && (
                  <div className="text-sm text-muted-foreground mt-1">
                    定員に余裕があります。より効率的な部屋選択をご検討ください。
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 部屋一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const isSelected = formData.selectedRooms.includes(room.id)
              const isAvailable = room.isAvailable

              return (
                <Card
                  key={room.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected && "ring-2 ring-primary",
                    !isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => isAvailable && toggleRoom(room.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{room.name}</div>
                      <Badge variant="outline" className={getRoomTypeColor(room.type)}>
                        {getRoomTypeLabel(room.type)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>定員</span>
                        <span>{room.capacity}名</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>基本料金</span>
                        <span>¥{room.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>状態</span>
                        <Badge variant={isAvailable ? "default" : "secondary"}>
                          {isAvailable ? "空室" : "満室"}
                        </Badge>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t">
                        <Badge variant="default" className="w-full justify-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          選択中
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* オプション選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            オプション
          </CardTitle>
          <CardDescription>必要なオプションサービスを選択してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {["食事", "施設", "備品"].map((category) => (
            <div key={category}>
              <h4 className="font-medium mb-3">{category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OPTIONS.filter(option => option.category === category).map((option) => {
                  const selectedOption = formData.selectedAddons.find(addon => addon.id === option.id)
                  const isSelected = !!selectedOption
                  const Icon = option.icon

                  return (
                    <Card
                      key={option.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected && "ring-2 ring-primary"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleOption(option.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Icon className="w-4 h-4" />
                                <span className="font-medium">{option.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {option.description}
                              </p>
                              <div className="text-sm font-medium mt-2">
                                ¥{option.price.toLocaleString()} / {option.unit}
                              </div>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                              <Label>数量</Label>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateOptionQuantity(option.id, (selectedOption?.quantity || 1) - 1)
                                  }}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">
                                  {selectedOption?.quantity || 1}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateOptionQuantity(option.id, (selectedOption?.quantity || 1) + 1)
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}