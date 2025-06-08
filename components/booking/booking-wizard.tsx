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
import { useAvailability } from "@/lib/hooks/use-availability"
import { usePricing } from "@/lib/hooks/use-pricing"
import { useDoubleBookingPrevention } from "@/lib/hooks/use-double-booking-prevention"
import { useToast } from "@/hooks/use-toast"
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
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([])
  const [hasActiveConflicts, setHasActiveConflicts] = useState(false)

  const { checkAvailability, suggestAlternativeRooms } = useAvailability()
  const { calculateBookingPrice, validateGuestCapacity, optimizeRoomSelection } = usePricing()
  const {
    checkForConflicts,
    validateExclusively,
    finalValidation,
    acquireLock,
    detectAndResolveConflicts,
    hasConflicts,
    hasLock,
    isLockExpiring,
    otherActiveSessions,
    conflicts,
    getConflictSummary,
    reset: resetConflictState
  } = useDoubleBookingPrevention({ autoCheck: true, checkInterval: 30000 })
  const { toast } = useToast()

  const [priceBreakdown, setPriceBreakdown] = useState<any>(null)
  const [availabilityResults, setAvailabilityResults] = useState<any[]>([])

  // リアルタイム料金計算と競合チェック
  useEffect(() => {
    if (formData.selectedRooms.length > 0 && formData.dateRange.nights > 0) {
      calculatePrice()
      performRealtimeConflictCheck()
    }
  }, [formData.selectedRooms, formData.guests, formData.dateRange, formData.selectedAddons])

  // 競合状態の監視とユーザー通知
  useEffect(() => {
    if (hasConflicts) {
      const summary = getConflictSummary()
      setHasActiveConflicts(true)
      setConflictWarnings([
        `${summary?.totalConflicts}件の予約競合が検出されました`,
        `影響部屋: ${summary?.roomNames}`,
        '別の部屋または日程をご検討ください'
      ])
      
      toast({
        title: "⚠️ 予約競合が検出されました",
        description: `${summary?.affectedRooms}室で重複が発生しています`,
        variant: "destructive"
      })
    } else {
      setHasActiveConflicts(false)
      setConflictWarnings([])
    }
  }, [hasConflicts, conflicts, toast])

  // 他ユーザーのアクティブセッション監視
  useEffect(() => {
    if (otherActiveSessions > 0) {
      toast({
        title: "👥 他のユーザーが同じ期間を検討中です",
        description: `${otherActiveSessions}名のユーザーが同時に予約を検討しています`,
        variant: "default"
      })
    }
  }, [otherActiveSessions, toast])

  // ロック期限切れ警告
  useEffect(() => {
    if (isLockExpiring && hasLock) {
      toast({
        title: "⏰ 予約ロックの期限が近づいています",
        description: "1分以内にロックが解除されます。お早めに完了してください",
        variant: "destructive"
      })
    }
  }, [isLockExpiring, hasLock, toast])

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

  // リアルタイム競合チェック
  const performRealtimeConflictCheck = async () => {
    if (!formData.dateRange.startDate || !formData.dateRange.endDate || formData.selectedRooms.length === 0) {
      return
    }

    try {
      const result = await checkForConflicts(
        formData.selectedRooms,
        formData.dateRange.startDate,
        formData.dateRange.endDate
      )

      if (!result.success && result.conflicts.length > 0) {
        // 代替案の検出と提案
        const resolutionResult = await detectAndResolveConflicts(
          '',  // 新規予約なので既存ID無し
          formData.selectedRooms,
          formData.dateRange.startDate,
          formData.dateRange.endDate
        )

        if (resolutionResult.resolutionOptions.length > 0) {
          toast({
            title: "💡 代替案が見つかりました",
            description: `${resolutionResult.resolutionOptions.length}件の代替案があります`,
            variant: "default"
          })
        }
      }
    } catch (error) {
      console.error("リアルタイム競合チェックエラー:", error)
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

    // 重複があれば進行を阻止
    if (hasActiveConflicts) {
      toast({
        title: "❌ 予約競合のため進行できません",
        description: "競合を解決してから次のステップに進んでください",
        variant: "destructive"
      })
      return
    }

    // Step 1完了時: 空室チェック
    if (currentStep === 1) {
      await checkRoomAvailability()
    }

    // Step 2完了時: 部屋の最適化提案
    if (currentStep === 2) {
      await suggestOptimalRooms()
    }

    // Step 3完了時: 予約ロック取得
    if (currentStep === 3 && formData.selectedRooms.length > 0) {
      const lockAcquired = await acquireLock(
        formData.selectedRooms,
        formData.dateRange.startDate,
        formData.dateRange.endDate
      )

      if (!lockAcquired) {
        toast({
          title: "🔒 予約ロックの取得に失敗しました",
          description: "他のユーザーが同じ部屋・期間を予約中です。しばらく待ってからお試しください",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "🔐 予約ロックを取得しました",
        description: "10分間この予約をキープします",
        variant: "default"
      })
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
      // 最終検証（排他制御付き）
      const finalValidationResult = await finalValidation({
        roomIds: formData.selectedRooms,
        startDate: formData.dateRange.startDate,
        endDate: formData.dateRange.endDate,
        guestCount: Object.values(formData.guests).reduce((sum, count) => sum + count, 0),
        guestName: formData.guestName
      })

      if (!finalValidationResult.isValid) {
        setValidationErrors(finalValidationResult.errors)
        if (finalValidationResult.conflicts.length > 0) {
          toast({
            title: "❌ 予約確定に失敗しました",
            description: "最終確認で競合が検出されました",
            variant: "destructive"
          })
        }
        return
      }

      // 予約データを作成
      const bookingData = {
        ...formData,
        priceBreakdown,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      }


      // 競合状態をリセット
      resetConflictState()

      toast({
        title: "✅ 予約が完了しました",
        description: "予約内容を確認してください",
        variant: "default"
      })

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
      
      toast({
        title: "❌ 予約作成エラー",
        description: "システムエラーが発生しました。お時間をおいてお試しください",
        variant: "destructive"
      })
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

      {/* 競合警告 */}
      {conflictWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">予約競合が検出されました</div>
              <ul className="list-disc list-inside space-y-1">
                {conflictWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ロック状態とセッション情報 */}
      {(hasLock || otherActiveSessions > 0) && (
        <Alert variant={hasLock ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {hasLock && <div>🔐 予約ロック取得済み（他のユーザーによる変更をブロック中）</div>}
              {isLockExpiring && <div>⏰ ロック期限切れまで1分を切りました</div>}
              {otherActiveSessions > 0 && (
                <div>👥 {otherActiveSessions}名のユーザーが同じ期間を検討中です</div>
              )}
            </div>
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
                <div className="font-semibold">¥{(priceBreakdown.roomAmount || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">個人料金</div>
                <div className="font-semibold">¥{(priceBreakdown.guestAmount || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">オプション</div>
                <div className="font-semibold">¥{(priceBreakdown.addonAmount || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>合計金額（税込）</span>
                <span>¥{(priceBreakdown.total || 0).toLocaleString()}</span>
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