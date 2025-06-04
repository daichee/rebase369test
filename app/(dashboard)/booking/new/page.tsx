"use client"

import { useRouter } from "next/navigation"
import { SimpleBookingWizard } from "@/components/booking/simple/SimpleBookingWizard"
import { createClient } from "@/lib/supabase/client"

export default function NewBookingPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleBookingComplete = async (createdBooking: any) => {
    try {
      // 予約作成は既にAPIで完了しているため、
      // 予約一覧ページにリダイレクトするのみ
      console.log('✅ [NewBookingPage] Booking completed successfully:', createdBooking)
      router.push("/booking")
    } catch (error) {
      console.error("予約完了処理エラー:", error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">新規予約作成</h1>
        <p className="text-muted-foreground">
          3ステップの簡単ウィザードで宿泊予約を作成します
        </p>
      </div>

      <SimpleBookingWizard onComplete={handleBookingComplete} />
    </div>
  )
}
