"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar, 
  Users, 
  Home, 
  UtensilsCrossed, 
  CreditCard, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Building2,
  Search
} from "lucide-react"
import { useRooms } from "@/lib/hooks/use-rooms"
import { useAvailability } from "@/lib/hooks/use-availability"
import { usePricing } from "@/lib/hooks/use-pricing"
import { useBoardProjects } from "@/lib/hooks/use-board-projects"
import { useBookingStore } from "@/store/booking-store"
import type { GuestCount, DateRange, RoomUsage, AddonItem } from "@/lib/pricing/types"

interface BookingFormData {
  // 基本情報
  guestName: string
  guestEmail: string
  guestPhone: string
  guestOrg: string
  purpose: string
  
  // 宿泊情報
  startDate: string
  endDate: string
  nights: number
  
  // 人数情報（READMEスキーマに準拠）
  guests: GuestCount
  
  // 部屋情報
  selectedRooms: RoomUsage[]
  
  // オプション
  addons: AddonItem[]
  
  // Board連携
  boardProjectId?: number
  
  // その他
  notes: string
}

export function EnhancedBookingWizard() {
  const router = useRouter()
  const { addBooking } = useBookingStore()
  
  // カスタムフックを使用
  const { rooms, isLoading: roomsLoading, error: roomsError } = useRooms()
  const { 
    checkAvailability, 
    preventDoubleBooking, 
    isLoading: availabilityLoading 
  } = useAvailability()
  const { 
    calculatePrice, 
    validateGuests, 
    validateDateRange, 
    validateRooms,
    createRoomUsage,
    createMealAddon,
    isCalculating 
  } = usePricing()
  const { 
    projects: boardProjects, 
    searchProjects,
    isLoading: boardLoading 
  } = useBoardProjects()

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<BookingFormData>({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestOrg: "",
    purpose: "",
    startDate: "",
    endDate: "",
    nights: 0,
    guests: {
      adult: 1,
      student: 0,
      child: 0,
      infant: 0,
      baby: 0
    },
    selectedRooms: [],
    addons: [],
    notes: ""
  })

  const [availabilityResults, setAvailabilityResults] = useState<any[]>([])
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = [
    { id: 0, name: "日程・人数", icon: Calendar },
    { id: 1, name: "部屋選択", icon: Home },
    { id: 2, name: "オプション", icon: UtensilsCrossed },
    { id: 3, name: "顧客情報", icon: Users },
    { id: 4, name: "Board連携", icon: Building2 },
    { id: 5, name: "確認", icon: FileText }
  ]

  // 日程変更時の処理
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      
      setFormData(prev => ({ ...prev, nights }))
      
      // 空室チェック
      checkRoomAvailability()
    }
  }, [formData.startDate, formData.endDate])

  // 料金計算の更新
  useEffect(() => {
    if (formData.selectedRooms.length > 0 && formData.nights > 0) {
      calculateBookingPrice()
    }
  }, [formData.selectedRooms, formData.guests, formData.addons, formData.nights])

  const checkRoomAvailability = async () => {
    if (!formData.startDate || !formData.endDate || rooms.length === 0) return

    try {
      const checks = rooms.map(room => ({
        roomId: room.id,
        dateRange: {
          start: formData.startDate,
          end: formData.endDate
        }
      }))
      
      const results = await checkAvailability(checks)
      setAvailabilityResults(results)
    } catch (error) {
      console.error("空室チェックに失敗:", error)
    }
  }

  const calculateBookingPrice = async () => {
    try {
      const dateRange: DateRange = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        nights: formData.nights
      }

      const breakdown = await calculatePrice({
        guests: formData.guests,
        dateRange,
        rooms: formData.selectedRooms,
        addons: formData.addons
      })
      
      setPriceBreakdown(breakdown)
    } catch (error) {
      console.error("料金計算に失敗:", error)
    }
  }

  const handleRoomSelect = (roomId: string, selected: boolean) => {
    if (selected) {
      const room = rooms.find(r => r.id === roomId)
      if (room) {
        const roomUsage = createRoomUsage(
          room.id,
          room.roomType,
          room.usageType,
          Math.min(room.capacity, Object.values(formData.guests).reduce((sum, count) => sum + count, 0))
        )
        
        setFormData(prev => ({
          ...prev,
          selectedRooms: [...prev.selectedRooms, roomUsage]
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        selectedRooms: prev.selectedRooms.filter(r => r.roomId !== roomId)
      }))
    }
  }

  const handleAddMeal = (mealType: "breakfast" | "dinner" | "bbq", selected: boolean) => {
    if (selected) {
      const mealAddon = createMealAddon(mealType, {
        adult: formData.guests.adult,
        student: formData.guests.student,
        child: formData.guests.child,
        infant: formData.guests.infant
      })
      
      setFormData(prev => ({
        ...prev,
        addons: [...prev.addons, mealAddon]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        addons: prev.addons.filter(a => a.addonId !== mealType)
      }))
    }
  }

  const validateCurrentStep = (): boolean => {
    const errors: string[] = []
    
    switch (currentStep) {
      case 0: // 日程・人数
        const dateValidation = validateDateRange({
          startDate: formData.startDate,
          endDate: formData.endDate,
          nights: formData.nights
        })
        if (!dateValidation.isValid) errors.push(...dateValidation.errors)
        
        const guestValidation = validateGuests(formData.guests)
        if (!guestValidation.isValid) errors.push(...guestValidation.errors)
        break
        
      case 1: // 部屋選択
        const roomValidation = validateRooms(formData.selectedRooms, formData.guests)
        if (!roomValidation.isValid) errors.push(...roomValidation.errors)
        break
        
      case 3: // 顧客情報
        if (!formData.guestName) errors.push("ゲスト名を入力してください")
        if (!formData.guestEmail) errors.push("メールアドレスを入力してください")
        if (!formData.guestPhone) errors.push("電話番号を入力してください")
        break
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return
    
    setIsSubmitting(true)
    
    try {
      // ダブルブッキングチェック
      for (const room of formData.selectedRooms) {
        const doubleBookingCheck = await preventDoubleBooking(
          room.roomId,
          formData.startDate,
          formData.endDate
        )
        
        if (!doubleBookingCheck.isValid) {
          setValidationErrors(doubleBookingCheck.conflicts)
          return
        }
      }

      // 予約作成（実際のSupabase操作は別途実装）
      const newBooking = {
        id: Math.random().toString(36).substr(2, 9),
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,
        checkIn: formData.startDate,
        checkOut: formData.endDate,
        guestCount: Object.values(formData.guests).reduce((sum, count) => sum + count, 0),
        totalAmount: priceBreakdown?.total || 0,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: formData.notes,
        boardEstimateId: formData.boardProjectId?.toString()
      }
      
      addBooking(newBooking)
      router.push(`/booking/${newBooking.id}`)
      
    } catch (error) {
      console.error("予約作成に失敗:", error)
      setValidationErrors(["予約作成に失敗しました"])
    } finally {
      setIsSubmitting(false)
    }
  }

  if (roomsLoading) {
    return <div className="p-8">部屋データを読み込み中...</div>
  }

  if (roomsError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>{roomsError}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">新規予約作成</h1>
        <p className="text-muted-foreground">READMEに基づく完全料金計算システム</p>
      </div>

      {/* プログレスバー */}
      <div className="mb-8">
        <Progress value={(currentStep / (steps.length - 1)) * 100} className="mb-4" />
        <div className="flex justify-between text-sm text-muted-foreground">
          {steps.map((step, index) => (
            <div key={step.id} className={`flex items-center ${index <= currentStep ? 'text-primary' : ''}`}>
              <step.icon className="h-4 w-4 mr-1" />
              {step.name}
            </div>
          ))}
        </div>
      </div>

      {/* エラー表示 */}
      {validationErrors.length > 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>入力エラー</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Step 0: 日程・人数 */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              日程・人数選択
            </CardTitle>
            <CardDescription>
              チェックイン・チェックアウト日と宿泊人数を選択してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">チェックイン *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">チェックアウト *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={formData.startDate}
                />
              </div>
              <div className="space-y-2">
                <Label>宿泊数</Label>
                <div className="p-2 bg-muted rounded-md">
                  {formData.nights}泊
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">宿泊人数（年齢区分別）</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adult">大人 *</Label>
                  <Input
                    id="adult"
                    type="number"
                    min="0"
                    value={formData.guests.adult}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      guests: { ...prev.guests, adult: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student">中高大学生</Label>
                  <Input
                    id="student"
                    type="number"
                    min="0"
                    value={formData.guests.student}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      guests: { ...prev.guests, student: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="child">小学生</Label>
                  <Input
                    id="child"
                    type="number"
                    min="0"
                    value={formData.guests.child}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      guests: { ...prev.guests, child: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="infant">未就学児(3歳～)</Label>
                  <Input
                    id="infant"
                    type="number"
                    min="0"
                    value={formData.guests.infant}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      guests: { ...prev.guests, infant: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baby">乳幼児(0-2歳)</Label>
                  <Input
                    id="baby"
                    type="number"
                    min="0"
                    value={formData.guests.baby}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      guests: { ...prev.guests, baby: parseInt(e.target.value) || 0 }
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">0-2歳は無料</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">合計人数:</span>
                  <span className="text-lg font-bold">
                    {Object.values(formData.guests).reduce((sum, count) => sum + count, 0)}名
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: 部屋選択 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="mr-2 h-5 w-5" />
              部屋選択
            </CardTitle>
            <CardDescription>
              空室状況を確認して部屋を選択してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availabilityLoading ? (
              <div>空室チェック中...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => {
                  const availability = availabilityResults.find(r => r.roomId === room.id)
                  const isSelected = formData.selectedRooms.some(r => r.roomId === room.id)
                  const isAvailable = availability?.isAvailable !== false
                  
                  return (
                    <Card key={room.id} className={`${isSelected ? 'ring-2 ring-primary' : ''} ${!isAvailable ? 'opacity-50' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{room.name}</CardTitle>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleRoomSelect(room.id, checked as boolean)}
                            disabled={!isAvailable}
                          />
                        </div>
                        <CardDescription>
                          {room.floor} • 定員{room.capacity}名
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>室料:</span>
                            <span>¥{room.basePrice.toLocaleString()}/泊</span>
                          </div>
                          <div className="flex justify-between">
                            <span>利用形態:</span>
                            <span>{room.usageType === 'shared' ? '大部屋・中部屋' : '個室'}</span>
                          </div>
                          {!isAvailable && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                この期間は予約済みです
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 料金表示（部屋選択後） */}
      {currentStep >= 1 && priceBreakdown && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              料金計算（リアルタイム）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">室料</h4>
                <p className="text-2xl font-bold text-blue-600">
                  ¥{priceBreakdown.roomAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">個人料金</h4>
                <p className="text-2xl font-bold text-green-600">
                  ¥{priceBreakdown.guestAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">オプション</h4>
                <p className="text-2xl font-bold text-purple-600">
                  ¥{priceBreakdown.addonAmount.toLocaleString()}
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">合計金額（税込）:</span>
              <span className="text-3xl font-bold text-primary">
                ¥{priceBreakdown.total.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex justify-between mt-8">
        <Button 
          onClick={handlePrevious} 
          variant="outline"
          disabled={currentStep === 0}
        >
          戻る
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button 
            onClick={handleNext}
            disabled={!validateCurrentStep()}
          >
            次へ
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !validateCurrentStep()}
          >
            {isSubmitting ? "作成中..." : "予約を作成"}
          </Button>
        )}
      </div>
    </div>
  )
}