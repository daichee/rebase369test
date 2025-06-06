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
import { useRooms } from "@/lib/hooks/use-rooms"
import type { SimpleBookingFormData } from "./SimpleBookingWizard"

interface RoomAndOptionsStepProps {
  formData: SimpleBookingFormData
  onChange: (data: Partial<SimpleBookingFormData>) => void
  availabilityResults?: any[]
  priceBreakdown?: any
}

// Room data is now fetched from Supabase via useRooms hook

// Option data structure for display
interface OptionData {
  id: string
  category: string
  name: string
  description: string
  price: number
  unit: string
  icon: any
}

export function RoomAndOptionsStep({ formData, onChange, availabilityResults, priceBreakdown }: RoomAndOptionsStepProps) {
  const [selectedFloor, setSelectedFloor] = useState<string>("all")
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const [options, setOptions] = useState<OptionData[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const { rooms, loading: roomsLoading } = useRooms()

  // Load options from API (same as admin settings)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/booking/options')
        const result = await response.json()
        
        if (result.success) {
          // Transform API data to display format with simplified pricing
          const transformedOptions = result.data.map((option: any) => {
            let price = 0
            let unit = option.unit
            let description = option.description || option.name
            
            // For meal options, use adult price as the base price
            if (option.category === 'meal' && option.rates) {
              price = option.rates.adult || 0
              unit = "人/日" // Simplified unit for display
              description = getOptionDescription(option.id)
            }
            // For facility options, use a simplified price (room fee for guests on weekdays)
            else if (option.category === 'facility' && option.roomFees) {
              price = option.roomFees.weekdayGuest || option.personalFees?.under5h || 0
              unit = "日"
              description = getOptionDescription(option.id)
            }
            // For equipment options, use the rate
            else if (option.category === 'equipment' && option.rate) {
              price = option.rate
              unit = option.unit
              description = getOptionDescription(option.id)
            }
            
            return {
              id: option.id,
              category: getCategoryLabel(option.category),
              name: option.name,
              description,
              price,
              unit,
              icon: getOptionIcon(option.category, option.id)
            }
          }).filter((option: OptionData) => option.price > 0) // Only show options with pricing
          
          setOptions(transformedOptions)
        } else {
          console.error('Failed to fetch options:', result.error)
        }
      } catch (error) {
        console.error('Error fetching options:', error)
      } finally {
        setOptionsLoading(false)
      }
    }

    fetchOptions()
  }, [])

  // Helper functions for option display
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'meal': return '食事'
      case 'facility': return '施設' 
      case 'equipment': return '備品'
      default: return category
    }
  }

  const getOptionIcon = (category: string, optionId: string) => {
    if (category === 'meal') return Utensils
    if (category === 'facility') {
      if (optionId.includes('meeting')) return Briefcase
      if (optionId.includes('parking')) return Home
      return Briefcase
    }
    if (category === 'equipment') {
      if (optionId.includes('futon')) return Bed
      return Briefcase
    }
    return Briefcase
  }

  const getOptionDescription = (optionId: string) => {
    // Provide user-friendly descriptions
    switch (optionId) {
      case 'breakfast': return '和洋バイキング'
      case 'dinner': return 'BBQまたは和食'
      case 'bbq': return '屋外バーベキュー（食材・機材込み）'
      case 'meeting_room_weekday': return 'プロジェクター・ホワイトボード付き'
      case 'gymnasium_weekday': return '体育館利用（1台あたり）'
      case 'parking': return '駐車場（1台あたり）'
      default: return optionId
    }
  }

  const totalGuests = Object.values(formData.guests).reduce((sum, count) => sum + count, 0)

  // 利用可能な部屋を計算
  const getAvailableRooms = () => {
    if (roomsLoading || !rooms.length) {
      return []
    }

    if (!availabilityResults || availabilityResults.length === 0) {
      return rooms.map(room => ({ ...room, isAvailable: true }))
    }

    return rooms.map(room => {
      const availability = availabilityResults.find(result => result.roomId === room.roomId)
      return {
        ...room,
        isAvailable: availability ? availability.isAvailable : true
      }
    })
  }

  const availableRooms = getAvailableRooms()
  console.log('Available rooms data:', availableRooms.map(r => ({ roomId: r.roomId, name: r.name })))
  
  const filteredRooms = selectedFloor === "all" 
    ? availableRooms 
    : availableRooms.filter(room => room.floor === selectedFloor)
    
  console.log('Filtered rooms data:', filteredRooms.map(r => ({ roomId: r.roomId, name: r.name })))

  // Check for room ID uniqueness to detect potential duplication issues
  const roomIds = filteredRooms.map(room => room.roomId)
  const uniqueRoomIds = new Set(roomIds)
  if (roomIds.length !== uniqueRoomIds.size) {
    console.error('❌ [RoomAndOptionsStep] DUPLICATE ROOM IDs DETECTED!')
    console.error('❌ [RoomAndOptionsStep] Room IDs:', roomIds)
    console.error('❌ [RoomAndOptionsStep] This may cause selection issues')
  }

  // 定員チェック
  const getCapacityStatus = () => {
    console.log('getCapacityStatus - formData.selectedRooms:', formData.selectedRooms)
    console.log('getCapacityStatus - available rooms for matching:', rooms.map(r => ({ roomId: r.roomId, name: r.name })))
    
    const selectedRoomData = rooms.filter(room => formData.selectedRooms.includes(room.roomId))
    console.log('getCapacityStatus - selectedRoomData:', selectedRoomData.map(r => ({ roomId: r.roomId, name: r.name, capacity: r.capacity })))
    
    const totalCapacity = selectedRoomData.reduce((sum, room) => sum + room.capacity, 0)
    
    return {
      totalCapacity,
      isValid: totalCapacity >= totalGuests,
      isOptimal: totalCapacity >= totalGuests && totalCapacity <= totalGuests + 2
    }
  }

  const capacityStatus = getCapacityStatus()

  const toggleRoom = (roomId: string) => {
    console.log('toggleRoom called with roomId:', roomId)
    console.log('Current selectedRooms:', formData.selectedRooms)
    console.log('Type of roomId:', typeof roomId)
    console.log('Type of selectedRooms items:', formData.selectedRooms.map(id => ({ id, type: typeof id })))
    
    // More robust selection check using explicit comparison
    const currentSelection = [...formData.selectedRooms]
    const roomIndex = currentSelection.findIndex(id => String(id) === String(roomId))
    const isCurrentlySelected = roomIndex >= 0
    
    console.log('Room index in selection:', roomIndex)
    console.log('Is currently selected:', isCurrentlySelected)
    
    let newSelectedRooms: string[]
    if (isCurrentlySelected) {
      // Remove the room
      newSelectedRooms = currentSelection.filter(id => String(id) !== String(roomId))
      console.log('Removing room from selection')
    } else {
      // Add the room
      newSelectedRooms = [...currentSelection, roomId]
      console.log('Adding room to selection')
    }
    
    console.log('Old selectedRooms:', formData.selectedRooms)
    console.log('New selectedRooms:', newSelectedRooms)
    console.log('Selection changed:', JSON.stringify(formData.selectedRooms) !== JSON.stringify(newSelectedRooms))
    
    onChange({ selectedRooms: newSelectedRooms })
  }

  const handleRoomClick = (roomId: string, roomName: string) => {
    const now = Date.now()
    console.log(`handleRoomClick called for ${roomName} (${roomId}) at ${now}`)
    
    // Prevent rapid double-clicks (debounce)
    if (now - lastClickTime < 300) {
      console.log('Ignoring rapid click - too soon after last click')
      return
    }
    setLastClickTime(now)
    
    // Validate roomId before proceeding
    if (!roomId || typeof roomId !== 'string') {
      console.error('Invalid roomId:', roomId)
      return
    }
    
    // Verify room exists in our data
    const roomExists = rooms.find(r => r.roomId === roomId)
    if (!roomExists) {
      console.error('Room not found in rooms data:', roomId)
      return
    }
    
    toggleRoom(roomId)
  }

  const toggleOption = (optionId: string) => {
    console.log('🔧 [RoomAndOptionsStep] toggleOption called with optionId:', optionId)
    
    const optionData = options.find(opt => opt.id === optionId)
    if (!optionData) {
      console.error('🔧 [RoomAndOptionsStep] Option not found:', optionId)
      return
    }
    
    const isCurrentlySelected = formData.selectedAddons.some(addon => addon.addonId === optionId)
    console.log('🔧 [RoomAndOptionsStep] Is currently selected:', isCurrentlySelected)
    
    let newSelectedOptions
    if (isCurrentlySelected) {
      // Remove the option
      newSelectedOptions = formData.selectedAddons.filter(addon => addon.addonId !== optionId)
      console.log('🔧 [RoomAndOptionsStep] Removing option from selection')
    } else {
      // Add the option with proper AddonItem structure
      const newAddon = {
        addonId: optionData.id,
        category: mapCategoryToType(optionData.category),
        name: optionData.name,
        quantity: 1,
        unitPrice: optionData.price,
        totalPrice: optionData.price * 1, // quantity is 1 initially
      }
      
      newSelectedOptions = [...formData.selectedAddons, newAddon]
      console.log('🔧 [RoomAndOptionsStep] Adding option to selection:', newAddon)
    }
    
    console.log('🔧 [RoomAndOptionsStep] New selectedAddons:', newSelectedOptions)
    onChange({ selectedAddons: newSelectedOptions })
  }

  // Map display category to type
  const mapCategoryToType = (category: string): "meal" | "facility" | "equipment" => {
    switch (category) {
      case '食事': return 'meal'
      case '施設': return 'facility'
      case '備品': return 'equipment'
      default: return 'meal'
    }
  }

  const updateOptionQuantity = (optionId: string, quantity: number) => {
    console.log('🔧 [RoomAndOptionsStep] updateOptionQuantity called:', { optionId, quantity })
    
    const newSelectedOptions = formData.selectedAddons.map(addon => {
      if (addon.addonId === optionId) {
        const newQuantity = Math.max(0, quantity)
        const updatedAddon = { 
          ...addon, 
          quantity: newQuantity,
          totalPrice: addon.unitPrice * newQuantity
        }
        console.log('🔧 [RoomAndOptionsStep] Updated addon:', updatedAddon)
        return updatedAddon
      }
      return addon
    }).filter(addon => addon.quantity > 0)
    
    console.log('🔧 [RoomAndOptionsStep] New selectedAddons after quantity update:', newSelectedOptions)
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

  // Debug: Check if room IDs are unique
  useEffect(() => {
    if (rooms.length > 0) {
      const roomIds = rooms.map(r => r.roomId)
      const uniqueIds = new Set(roomIds)
      console.log('Total rooms:', rooms.length)
      console.log('Unique room IDs:', uniqueIds.size)
      console.log('Room IDs:', roomIds)
      console.log('Are all IDs unique?', roomIds.length === uniqueIds.size)
      
      if (roomIds.length !== uniqueIds.size) {
        console.error('DUPLICATE ROOM IDS DETECTED!', roomIds)
      }
    }
  }, [rooms])

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

          {/* Debug: Test buttons */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-800">Debug: Test Room Selection</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {filteredRooms.slice(0, 3).map((room) => (
                <button
                  key={`debug-${room.roomId}`}
                  onClick={() => {
                    console.log(`Debug button clicked for ${room.name} (${room.roomId})`)
                    toggleRoom(room.roomId)
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Test {room.name}
                </button>
              ))}
            </div>
          </div>

          {/* 部屋一覧 */}
          {roomsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">部屋情報を読み込み中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room, index) => {
              console.log(`Room ${index}:`, { roomId: room.roomId, name: room.name, isSelected: formData.selectedRooms.includes(room.roomId) })
              
              const isSelected = formData.selectedRooms.includes(room.roomId)
              const isAvailable = room.isAvailable

              return (
                <Card
                  key={`${room.roomId}-${index}`}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected && "ring-2 ring-primary",
                    !isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (isAvailable) {
                      handleRoomClick(room.roomId, room.name)
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{room.name}</div>
                      <Badge variant="outline" className={getRoomTypeColor(room.roomType)}>
                        {getRoomTypeLabel(room.roomType)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>定員</span>
                        <span>{room.capacity}名</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>基本料金</span>
                        <span>¥{(room.roomRate || 0).toLocaleString()}</span>
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
          )}
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
          {optionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">オプション情報を読み込み中...</p>
            </div>
          ) : (
            ["食事", "施設", "備品"].map((category) => {
              const categoryOptions = options.filter(option => option.category === category)
              
              if (categoryOptions.length === 0) return null
              
              return (
                <div key={category}>
                  <h4 className="font-medium mb-3">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryOptions.map((option) => {
                  const selectedOption = formData.selectedAddons.find(addon => addon.addonId === option.id)
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
                                ¥{(option.price || 0).toLocaleString()} / {option.unit}
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
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions for room type display
function getRoomTypeLabel(roomType: string) {
  const labels = {
    large: "大部屋",
    medium_a: "中部屋A",
    medium_b: "中部屋B", 
    small_a: "小部屋A",
    small_b: "小部屋B",
    small_c: "小部屋C"
  }
  return labels[roomType as keyof typeof labels] || roomType
}

function getRoomTypeColor(roomType: string) {
  const colors = {
    large: "bg-blue-100 text-blue-800",
    medium_a: "bg-green-100 text-green-800",
    medium_b: "bg-green-100 text-green-800",
    small_a: "bg-purple-100 text-purple-800",
    small_b: "bg-purple-100 text-purple-800", 
    small_c: "bg-purple-100 text-purple-800"
  }
  return colors[roomType as keyof typeof colors] || "bg-gray-100 text-gray-800"
}