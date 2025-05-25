"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Simple inline step components
function DateSelectionStep() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">宿泊日程を選択してください</h3>
        <p className="text-sm text-muted-foreground">チェックイン日とチェックアウト日を選択してください。</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">カレンダーコンポーネント（実装予定）</p>
      </div>
    </div>
  )
}

function GuestCountStep() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">宿泊人数を入力してください</h3>
        <p className="text-sm text-muted-foreground">年齢区分別に宿泊人数を入力してください。</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">人数入力コンポーネント（実装予定）</p>
      </div>
    </div>
  )
}

function RoomSelectionStep() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">利用する部屋を選択してください</h3>
        <p className="text-sm text-muted-foreground">宿泊人数に応じて部屋を選択してください。</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">部屋選択コンポーネント（実装予定）</p>
      </div>
    </div>
  )
}

function AddonSelectionStep() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">オプションを選択してください</h3>
        <p className="text-sm text-muted-foreground">食事、施設利用、備品などのオプションを選択できます。</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">オプション選択コンポーネント（実装予定）</p>
      </div>
    </div>
  )
}

function GuestInfoStep() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">顧客情報を入力してください</h3>
        <p className="text-sm text-muted-foreground">予約者の連絡先情報を入力してください。</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">顧客情報入力コンポーネント（実装予定）</p>
      </div>
    </div>
  )
}

function BoardProjectStep() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Board案件との連携（任意）</h3>
        <p className="text-sm text-muted-foreground">既存のBoard案件と連携する場合は選択してください。</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">Board連携コンポーネント（実装予定）</p>
      </div>
    </div>
  )
}

function ConfirmationStep() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">予約内容の確認</h3>
        <p className="text-sm text-muted-foreground">入力された内容を確認してください。</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">確認画面コンポーネント（実装予定）</p>
      </div>
    </div>
  )
}

const STEPS = [
  { id: "date", title: "日程選択", component: DateSelectionStep },
  { id: "guests", title: "人数入力", component: GuestCountStep },
  { id: "rooms", title: "部屋選択", component: RoomSelectionStep },
  { id: "addons", title: "オプション", component: AddonSelectionStep },
  { id: "guest-info", title: "顧客情報", component: GuestInfoStep },
  { id: "board", title: "Board連携", component: BoardProjectStep },
  { id: "confirm", title: "確認", component: ConfirmationStep },
]

export default function NewBookingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentStepData = STEPS[currentStep]
  const CurrentStepComponent = currentStepData.component
  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      router.push("/booking")
    } catch (error) {
      console.error("Error submitting booking:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/booking")
  }

  return (
    <div className="container max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">新規予約作成</h1>
          <p className="text-muted-foreground">ステップバイステップで予約を作成します</p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          キャンセル
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              ステップ {currentStep + 1}: {currentStepData.title}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <CurrentStepComponent />

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              前へ
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "作成中..." : "予約を作成"}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                次へ
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
