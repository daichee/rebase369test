"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useBookingStore } from "@/store/booking-store"
import type { Database } from "@/lib/supabase/types"

type BookingRow = Database["public"]["Tables"]["projects"]["Row"]

export function useRealtimeBookings() {
  const { setBookings, addBooking, updateBooking, deleteBooking } = useBookingStore()
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // 初期データ取得
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

        if (error) throw error

        const bookings = data.map(mapSupabaseToBooking)
        setBookings(bookings)
        setIsConnected(true)
      } catch (error) {
        console.error("予約データの取得に失敗:", error)
        setIsConnected(false)
      }
    }

    fetchBookings()

    // リアルタイム購読
    const channel = supabase
      .channel("projects_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "projects",
        },
        (payload) => {
          const newBooking = mapSupabaseToBooking(payload.new as BookingRow)
          addBooking(newBooking)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
        },
        (payload) => {
          const updatedBooking = mapSupabaseToBooking(payload.new as BookingRow)
          updateBooking(updatedBooking.id, updatedBooking)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "projects",
        },
        (payload) => {
          deleteBooking((payload.old as BookingRow).id)
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, setBookings, addBooking, updateBooking, deleteBooking])

  return { isConnected }
}

// Supabaseの行データを予約オブジェクトにマッピング
function mapSupabaseToBooking(row: BookingRow) {
  return {
    id: row.id,
    customerId: row.created_by || "unknown",
    roomId: "R201", // 実際の部屋割り当てから取得
    checkIn: row.start_date,
    checkOut: row.end_date,
    guestCount: row.pax_total,
    totalAmount: row.total_amount,
    status: row.status as "pending" | "confirmed" | "cancelled" | "completed",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    boardEstimateId: row.board_project_id?.toString(),
    notes: row.notes || undefined,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone || undefined,
  }
}
