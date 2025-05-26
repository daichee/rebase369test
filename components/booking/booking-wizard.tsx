"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Users, Home, ShoppingCart, CheckCircle, AlertCircle } from "lucide-react"
import { DateRangePicker } from "./date-range-picker"
import { GuestSelector } from "./guest-selector"
import { RoomSelector } from "./room-selector"
import { AddonSelector } from "./addon-selector"
import { BookingConfirmation } from "./booking-confirmation"
import { BoardProjectSelector } from "./board-project-selector"
import { useAvailability } from "@/lib/hooks/use-availability"
import { usePricing } from "@/lib/hooks/use-pricing"
import { useBoardProjects } from "@/lib/hooks/use-board-projects"
import type { GuestCount } from "@/lib/pricing/types"

interface BookingWizardProps {
  onComplete?: (bookingData: any) => void
  initialData?: Partial<BookingFormData>
}

export interface BookingFormData {
  // Step 1: 日程選択
  dateRange: {
    startDate: string
    endDate: string
    nights: number
  }
  
  // Step 2: 人数選択
  guests: GuestCount
  
  // Step 3: 部屋選択
  selectedRooms: string[]
  
  // Step 4: オプション選択
  selectedAddons: any[]
  
  // Step 5: Board案件選択
  boardProjectId?: number
  
  // 顧客情報
  guestName: string
  guestEmail: string
  guestPhone: string
  guestOrg: string
  purpose: string
  notes: string
}

const STEPS = [
  { id: 1, title: "日程選択", icon: Calendar, description: "宿泊期間を選択してください" },
  { id: 2, title: "人数選択", icon: Users, description: "年齢区分別の人数を入力してください" },
  { id: 3, title: "部屋選択", icon: Home, description: "利用する部屋を選択してください" },
  { id: 4, title: "オプション", icon: ShoppingCart, description: "追加サービスを選択してください" },
  { id: 5, title: "確認・完了", icon: CheckCircle, description: "予約内容を確認して完了してください" },
]

export function BookingWizard({ onComplete, initialData }: BookingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>({
    dateRange: { startDate: "", endDate: "", nights: 0 },
    guests: { adult: 0, student: 0, child: 0, infant: 0, baby: 0 },
    selectedRooms: [],
    selectedAddons: [],
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestOrg: "",
    purpose: "",
    notes: "",
    ...initialData,
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { checkAvailability, suggestAlternativeRooms } = useAvailability()
  const { calculateBookingPrice, validateGuestCapacity, optimizeRoomSelection } = usePricing()
  const { syncEstimateToBoard } = useBoardProjects()

  const [priceBreakdown, setPriceBreakdown] = useState<any>(null)
  const [availabilityResults, setAvailabilityResults] = useState<any[]>([])

  // リアルタイム料金計算
  useEffect(() => {
    if (formData.selectedRooms.length > 0 && formData.dateRange.nights > 0) {
      calculatePrice()
    }
  }, [formData.selectedRooms, formData.guests, formData.dateRange, formData.selectedAddons])

  const calculatePrice = async () => {
    try {
      const totalGuests = Object.values(formData.guests).reduce((sum, count) => sum + count, 0)
      if (totalGuests === 0) return

      const breakdown = await calculateBookingPrice({
        rooms: formData.selectedRooms,
        guests: formData.guests,
        dateRange: formData.dateRange,
        addons: formData.selectedAddons,
      })

      setPriceBreakdown(breakdown)
    } catch (error) {
      console.error("料金計算エラー:", error)
    }
  }

  const validateCurrentStep = (): boolean => {
    const errors: string[] = []

    switch (currentStep) {
      case 1:
        if (!formData.dateRange.startDate || !formData.dateRange.endDate) {
          errors.push("宿泊期間を選択してください")
        }
        if (formData.dateRange.nights <= 0) {
          errors.push("宿泊日数が正しくありません")
        }
        break

      case 2:
        const totalGuests = Object.values(formData.guests).reduce((sum, count) => sum + count, 0)
        if (totalGuests === 0) {
          errors.push("宿泊者数を入力してください")
        }
        if (totalGuests > 100) {
          errors.push("宿泊者数が上限を超えています（最大100名）")
        }
        break

      case 3:
        if (formData.selectedRooms.length === 0) {
          errors.push("部屋を選択してください")
        }
        
        const validation = validateGuestCapacity(formData.selectedRooms, formData.guests)
        if (!validation.isValid) {
          errors.push(validation.message || "定員超過です")
        }
        break

      case 4:
        // オプションは任意なので特に検証なし
        break

      case 5:
        if (!formData.guestName) errors.push("代表者名を入力してください")
        if (!formData.guestEmail) errors.push("メールアドレスを入力してください")
        if (!formData.guestPhone) errors.push("電話番号を入力してください")
        break
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleNext = async () => {
    if (!validateCurrentStep()) return

    // Step 1完了時: 空室チェック
    if (currentStep === 1) {
      await checkRoomAvailability()
    }

    // Step 2完了時: 部屋の最適化提案
    if (currentStep === 2) {
      await suggestOptimalRooms()
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const checkRoomAvailability = async () => {
    try {
      // すべての部屋の空室状況をチェック
      const allRoomIds = ["R201", "R202", "R203", "R204", "R205", "R301", "R302", "R303", "R304", "R305", "R306", "R307"]
      const results = await checkAvailability(allRoomIds, formData.dateRange)
      setAvailabilityResults(results)
    } catch (error) {
      console.error("空室チェックエラー:", error)
    }
  }

  const suggestOptimalRooms = async () => {
    try {
      const totalGuests = Object.values(formData.guests).reduce((sum, count) => sum + count, 0)
      const availableRoomIds = availabilityResults
        .filter((result) => result.isAvailable)
        .map((result) => result.roomId)

      const suggestion = optimizeRoomSelection(totalGuests, availableRoomIds)
      
      // 提案された部屋を自動選択（ユーザーが変更可能）
      setFormData((prev) => ({
        ...prev,
        selectedRooms: suggestion.recommendedRooms,
      }))
    } catch (error) {
      console.error("部屋最適化エラー:", error)
    }
  }

  const handleComplete = async () => {
    if (!validateCurrentStep()) return

    setIsSubmitting(true)
    try {
      // 予約データを作成
      const bookingData = {
        ...formData,
        priceBreakdown,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      }

      // Board案件が選択されている場合は見積同期
      if (formData.boardProjectId && priceBreakdown) {
        const syncResult = await syncEstimateToBoard({
          boardProjectId: formData.boardProjectId,
          priceBreakdown,
          bookingDetails: bookingData,
        })

        if (!syncResult.success) {
          console.warn("Board同期に失敗:", syncResult.message)
        }
      }

      // 完了コールバック実行
      if (onComplete) {
        onComplete(bookingData)
      } else {
        // デフォルトの完了処理
        router.push("/booking")
      }
    } catch (error) {
      console.error("予約完了エラー:", error)
      setValidationErrors(["予約の作成に失敗しました。もう一度お試しください。"])
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (stepData: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...stepData }))
    setValidationErrors([])
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <DateRangePicker
            value={formData.dateRange}
            onChange={(dateRange) => updateFormData({ dateRange })}
            availabilityResults={availabilityResults}
          />
        )

      case 2:
        return (
          <GuestSelector
            value={formData.guests}
            onChange={(guests) => updateFormData({ guests })}
            priceBreakdown={priceBreakdown}
          />
        )

      case 3:
        return (
          <RoomSelector
            selectedRooms={formData.selectedRooms}
            onChange={(selectedRooms) => updateFormData({ selectedRooms })}
            availabilityResults={availabilityResults}
            guests={formData.guests}
            dateRange={formData.dateRange}
          />
        )

      case 4:
        return (
          <AddonSelector
            selectedAddons={formData.selectedAddons}
            onChange={(selectedAddons) => updateFormData({ selectedAddons })}
            guests={formData.guests}
            dateRange={formData.dateRange}
          />
        )

      case 5:
        return (
          <BookingConfirmation
            formData={formData}
            priceBreakdown={priceBreakdown}
            onChange={updateFormData}
            onBoardProjectSelect={(boardProjectId) => updateFormData({ boardProjectId })}
          />
        )

      default:
        return null
    }
  }

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* ステップ進捗 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>予約作成 - {STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </div>
            <Badge variant="secondary">
              {currentStep} / {STEPS.length}
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* エラー表示 */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* ステップコンテンツ */}
      <Card>
        <CardContent className="pt-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* 料金表示 */}
      {priceBreakdown && currentStep >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle>料金明細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">室料</div>
                <div className="font-semibold">¥{priceBreakdown.roomAmount?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">個人料金</div>
                <div className="font-semibold">¥{priceBreakdown.guestAmount?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">オプション</div>
                <div className="font-semibold">¥{priceBreakdown.addonAmount?.toLocaleString()}</div>
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>合計金額（税込）</span>
                <span>¥{priceBreakdown.total?.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          前へ
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext}>
            次へ
          </Button>
        ) : (
          <Button 
            onClick={handleComplete} 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "作成中..." : "予約を確定する"}
          </Button>
        )}
      </div>
    </div>
  )
}