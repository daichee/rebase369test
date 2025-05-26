"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRoomStore } from "@/store/room-store"
import type { Database } from "@/lib/supabase/types"

type RoomRow = Database["public"]["Tables"]["rooms"]["Row"]

export function useRooms() {
  const { 
    setRooms, 
    rooms, 
    setLoading, 
    setError,
    isLoading,
    error 
  } = useRoomStore()
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("*")
          .eq("is_active", true)
          .order("floor", { ascending: true })
          .order("name", { ascending: true })

        if (error) throw error

        const mappedRooms = data.map(mapSupabaseToRoom)
        setRooms(mappedRooms)
        setIsConnected(true)
      } catch (error) {
        console.error("部屋データの取得に失敗:", error)
        setError("部屋データの取得に失敗しました")
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()

    // リアルタイム購読
    const channel = supabase
      .channel("rooms_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
        },
        () => {
          // 部屋データが変更された時は全て再取得
          fetchRooms()
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, setRooms, setLoading, setError])

  const createRoom = async (roomData: Database["public"]["Tables"]["rooms"]["Insert"]) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert(roomData)
        .select()
        .single()

      if (error) throw error
      
      return mapSupabaseToRoom(data)
    } catch (error) {
      console.error("部屋の作成に失敗:", error)
      setError("部屋の作成に失敗しました")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateRoom = async (roomId: string, updates: Database["public"]["Tables"]["rooms"]["Update"]) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from("rooms")
        .update(updates)
        .eq("room_id", roomId)
        .select()
        .single()

      if (error) throw error
      
      return mapSupabaseToRoom(data)
    } catch (error) {
      console.error("部屋の更新に失敗:", error)
      setError("部屋の更新に失敗しました")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteRoom = async (roomId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ is_active: false })
        .eq("room_id", roomId)

      if (error) throw error
    } catch (error) {
      console.error("部屋の削除に失敗:", error)
      setError("部屋の削除に失敗しました")
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { 
    rooms,
    isConnected,
    isLoading,
    error,
    createRoom,
    updateRoom,
    deleteRoom,
    refetch: () => {
      // Re-run the effect to fetch fresh data
      window.location.reload()
    }
  }
}

// Supabaseの行データを部屋オブジェクトにマッピング
function mapSupabaseToRoom(row: RoomRow) {
  // READMEの仕様に合わせた部屋タイプマッピング
  const typeMapping: Record<string, "single" | "double" | "suite" | "family"> = {
    "small_a": "double",    // 個室（5名）- ダブル扱い
    "small_b": "double",    // 個室（10名）- ダブル扱い  
    "small_c": "single",    // 個室（5名）- シングル扱い
    "medium_a": "suite",    // 中部屋（21名）- スイート扱い
    "medium_b": "family",   // 中部屋（10名）- ファミリー扱い
    "large": "suite"        // 大部屋（25名, 35名）- スイート扱い
  }

  return {
    id: row.room_id,
    name: row.name,
    type: typeMapping[row.room_type] || "double",
    capacity: row.capacity,
    basePrice: row.room_rate,
    amenities: row.amenities || [],
    description: row.description || undefined,
    images: [], // 今後実装
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // READMEスキーマの追加フィールド
    floor: row.floor,
    roomType: row.room_type,
    usageType: row.usage_type,
  }
}