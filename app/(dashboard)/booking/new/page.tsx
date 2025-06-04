"use client"

import { useRouter } from "next/navigation"
import { SimpleBookingWizard } from "@/components/booking/simple/SimpleBookingWizard"
import { createClient } from "@/lib/supabase/client"

export default function NewBookingPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleBookingComplete = async (bookingData: any) => {
    try {
      // Supabaseに予約を保存
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          status: "confirmed",
          start_date: bookingData.dateRange.startDate,
          end_date: bookingData.dateRange.endDate,
          pax_total: Object.values(bookingData.guests).reduce((sum, count) => sum + count, 0),
          pax_adults: bookingData.guests.adult,
          pax_students: bookingData.guests.student,
          pax_children: bookingData.guests.child,
          pax_infants: bookingData.guests.infant,
          pax_babies: bookingData.guests.baby,
          guest_name: bookingData.guestName,
          guest_email: bookingData.guestEmail,
          guest_phone: bookingData.guestPhone,
          guest_org: bookingData.guestOrg,
          purpose: bookingData.purpose,
          room_amount: bookingData.priceBreakdown?.roomAmount || 0,
          pax_amount: bookingData.priceBreakdown?.guestAmount || 0,
          addon_amount: bookingData.priceBreakdown?.addonAmount || 0,
          subtotal_amount: bookingData.priceBreakdown?.subtotal || 0,
          total_amount: bookingData.priceBreakdown?.total || 0,
          notes: bookingData.notes,
        })
        .select()
        .single()

      if (projectError) throw projectError

      // 料金計算結果を保存
      if (project && bookingData.priceBreakdown) {
        try {
          const { error: priceError } = await supabase
            .from("booking_price_details")
            .insert({
              booking_id: project.id,
              rooms_used: bookingData.selectedRooms.map((roomId: string) => ({
                roomId,
                roomType: 'unknown', // TODO: 部屋タイプマッピングが必要
                usageType: 'shared',
                roomRate: bookingData.priceBreakdown.roomAmount / bookingData.selectedRooms.length || 0,
                assignedGuests: Object.values(bookingData.guests).reduce((sum, count) => sum + count, 0),
                capacity: 20
              })),
              guest_breakdown: bookingData.guests,
              date_range: bookingData.dateRange,
              addons_selected: bookingData.addons || [],
              season_config: bookingData.priceBreakdown.seasonConfig || {},
              room_amount: bookingData.priceBreakdown.roomAmount || 0,
              guest_amount: bookingData.priceBreakdown.guestAmount || 0,
              addon_amount: bookingData.priceBreakdown.addonAmount || 0,
              subtotal: bookingData.priceBreakdown.subtotal || 0,
              total_amount: bookingData.priceBreakdown.total || 0,
              daily_breakdown: bookingData.priceBreakdown.dailyBreakdown || [],
              calculation_method: 'unified_calculator'
            })

          if (priceError) {
            console.warn("Failed to save price details:", priceError)
            // 非致命的エラーとして継続
          }
        } catch (error) {
          console.warn("Error saving price details:", error)
          // 非致命的エラーとして継続
        }
      }

      // 部屋割り当てを保存
      if (project && bookingData.selectedRooms.length > 0) {
        const roomAssignments = bookingData.selectedRooms.map((roomId: string) => ({
          project_id: project.id,
          room_id: roomId,
          assigned_pax: Math.ceil(Object.values(bookingData.guests).reduce((sum, count) => sum + count, 0) / bookingData.selectedRooms.length),
          room_rate: bookingData.priceBreakdown?.roomAmount / bookingData.dateRange.nights / bookingData.selectedRooms.length || 0,
          nights: bookingData.dateRange.nights,
        }))

        const { error: roomError } = await supabase
          .from("project_rooms")
          .insert(roomAssignments)

        if (roomError) throw roomError
      }

      // 予約一覧ページにリダイレクト
      router.push("/booking")
    } catch (error) {
      console.error("予約保存エラー:", error)
      // エラーハンドリング（トースト通知など）
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
