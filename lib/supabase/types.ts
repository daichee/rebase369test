export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          board_project_id: number | null
          status: "draft" | "confirmed" | "cancelled" | "completed"
          start_date: string
          end_date: string
          nights: number
          pax_total: number
          pax_adults: number
          pax_adult_leaders: number
          pax_students: number
          pax_children: number
          pax_infants: number
          pax_babies: number
          guest_name: string
          guest_email: string
          guest_phone: string | null
          guest_org: string | null
          purpose: string | null
          room_amount: number
          pax_amount: number
          addon_amount: number
          subtotal_amount: number
          total_amount: number
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          board_project_id?: number | null
          status?: "draft" | "confirmed" | "cancelled" | "completed"
          start_date: string
          end_date: string
          pax_total: number
          pax_adults?: number
          pax_adult_leaders?: number
          pax_students?: number
          pax_children?: number
          pax_infants?: number
          pax_babies?: number
          guest_name: string
          guest_email: string
          guest_phone?: string | null
          guest_org?: string | null
          purpose?: string | null
          room_amount?: number
          pax_amount?: number
          addon_amount?: number
          subtotal_amount?: number
          total_amount?: number
          notes?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          board_project_id?: number | null
          status?: "draft" | "confirmed" | "cancelled" | "completed"
          start_date?: string
          end_date?: string
          pax_total?: number
          pax_adults?: number
          pax_adult_leaders?: number
          pax_students?: number
          pax_children?: number
          pax_infants?: number
          pax_babies?: number
          guest_name?: string
          guest_email?: string
          guest_phone?: string | null
          guest_org?: string | null
          purpose?: string | null
          room_amount?: number
          pax_amount?: number
          addon_amount?: number
          subtotal_amount?: number
          total_amount?: number
          notes?: string | null
          created_by?: string | null
        }
      }
      rooms: {
        Row: {
          room_id: string
          name: string
          floor: string
          capacity: number
          room_type: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c"
          room_rate: number
          usage_type: "shared" | "private"
          is_active: boolean
          amenities: string[] | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          room_id: string
          name: string
          floor: string
          capacity: number
          room_type: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c"
          room_rate: number
          usage_type: "shared" | "private"
          is_active?: boolean
          amenities?: string[] | null
          description?: string | null
        }
        Update: {
          room_id?: string
          name?: string
          floor?: string
          capacity?: number
          room_type?: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c"
          room_rate?: number
          usage_type?: "shared" | "private"
          is_active?: boolean
          amenities?: string[] | null
          description?: string | null
        }
      }
      project_rooms: {
        Row: {
          id: string
          project_id: string
          room_id: string
          assigned_pax: number
          room_rate: number
          nights: number
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          room_id: string
          assigned_pax: number
          room_rate: number
          nights: number
        }
        Update: {
          id?: string
          project_id?: string
          room_id?: string
          assigned_pax?: number
          room_rate?: number
          nights?: number
        }
      }
      board_projects: {
        Row: {
          board_project_id: number
          project_no: number
          client_name: string
          title: string | null
          status: string
          last_synced_at: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          board_project_id: number
          project_no: number
          client_name: string
          title?: string | null
          status: string
          last_synced_at?: string
          is_active?: boolean
        }
        Update: {
          board_project_id?: number
          project_no?: number
          client_name?: string
          title?: string | null
          status?: string
          last_synced_at?: string
          is_active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: "draft" | "confirmed" | "cancelled" | "completed"
      room_type: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c"
      usage_type: "shared" | "private"
      season_type: "regular" | "peak"
      day_type: "weekday" | "weekend"
      addon_category: "meal" | "facility" | "equipment"
      sync_status: "pending" | "success" | "error"
    }
  }
}
