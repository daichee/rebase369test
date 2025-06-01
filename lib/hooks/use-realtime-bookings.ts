"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useBookingStore } from "@/store/booking-store"
import type { Database } from "@/lib/supabase/types"

type BookingRow = Database["public"]["Tables"]["projects"]["Row"]

export function useRealtimeBookings() {
  const { setProjects, addProject, updateProject, deleteProject } = useBookingStore()
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // 初期データ取得
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select(`
            *,
            project_rooms (
              rooms (*)
            )
          `)
          .order("created_at", { ascending: false })

        if (error) throw error

        setProjects(data || [])
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
          addProject(payload.new as BookingRow)
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
          const updatedProject = payload.new as BookingRow
          updateProject(updatedProject.id, updatedProject)
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
          deleteProject((payload.old as BookingRow).id)
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, setProjects, addProject, updateProject, deleteProject])

  return { isConnected }
}

