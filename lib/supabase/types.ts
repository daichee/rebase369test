export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
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
      project_items: {
        Row: {
          id: string
          project_id: string
          item_type: string
          item_code: string
          item_name: string
          category: string | null
          quantity: number
          unit: string
          unit_price: number
          amount: number
          target_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          item_type: string
          item_code: string
          item_name: string
          category?: string | null
          quantity: number
          unit: string
          unit_price: number
          target_date?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          item_type?: string
          item_code?: string
          item_name?: string
          category?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          target_date?: string | null
        }
      }
      seasons: {
        Row: {
          season_id: string
          name: string
          season_type: "regular" | "peak"
          start_date: string
          end_date: string
          room_rate_multiplier: number
          pax_rate_multiplier: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          season_id: string
          name: string
          season_type: "regular" | "peak"
          start_date: string
          end_date: string
          room_rate_multiplier?: number
          pax_rate_multiplier?: number
          is_active?: boolean
        }
        Update: {
          season_id?: string
          name?: string
          season_type?: "regular" | "peak"
          start_date?: string
          end_date?: string
          room_rate_multiplier?: number
          pax_rate_multiplier?: number
          is_active?: boolean
        }
      }
      rates: {
        Row: {
          rate_id: number
          season_id: string | null
          day_type: "weekday" | "weekend"
          room_usage: "shared" | "private"
          age_group: string
          base_price: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          season_id?: string | null
          day_type: "weekday" | "weekend"
          room_usage: "shared" | "private"
          age_group: string
          base_price: number
          is_active?: boolean
        }
        Update: {
          rate_id?: number
          season_id?: string | null
          day_type?: "weekday" | "weekend"
          room_usage?: "shared" | "private"
          age_group?: string
          base_price?: number
          is_active?: boolean
        }
      }
      add_ons: {
        Row: {
          add_on_id: string
          category: "meal" | "facility" | "equipment"
          name: string
          unit: string
          adult_fee: number
          student_fee: number
          child_fee: number
          infant_fee: number
          personal_fee_5h: number
          personal_fee_10h: number
          personal_fee_over: number
          room_fee_weekday_guest: number
          room_fee_weekday_other: number
          room_fee_weekend_guest: number
          room_fee_weekend_other: number
          aircon_fee_per_hour: number
          min_quantity: number
          max_quantity: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          add_on_id: string
          category: "meal" | "facility" | "equipment"
          name: string
          unit: string
          adult_fee?: number
          student_fee?: number
          child_fee?: number
          infant_fee?: number
          personal_fee_5h?: number
          personal_fee_10h?: number
          personal_fee_over?: number
          room_fee_weekday_guest?: number
          room_fee_weekday_other?: number
          room_fee_weekend_guest?: number
          room_fee_weekend_other?: number
          aircon_fee_per_hour?: number
          min_quantity?: number
          max_quantity?: number | null
          is_active?: boolean
        }
        Update: {
          add_on_id?: string
          category?: "meal" | "facility" | "equipment"
          name?: string
          unit?: string
          adult_fee?: number
          student_fee?: number
          child_fee?: number
          infant_fee?: number
          personal_fee_5h?: number
          personal_fee_10h?: number
          personal_fee_over?: number
          room_fee_weekday_guest?: number
          room_fee_weekday_other?: number
          room_fee_weekend_guest?: number
          room_fee_weekend_other?: number
          aircon_fee_per_hour?: number
          min_quantity?: number
          max_quantity?: number | null
          is_active?: boolean
        }
      }
    }
    Views: {
      calculated_rates: {
        Row: {
          season_id: string | null
          day_type: "weekday" | "weekend"
          room_usage: "shared" | "private"
          age_group: string
          final_price: number
          season_name: string | null
          season_type: "regular" | "peak" | null
          season_start: string | null
          season_end: string | null
          is_active: boolean | null
        }
      }
      room_availability: {
        Row: {
          room_id: string
          name: string
          floor: string
          capacity: number
          room_type: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c"
          usage_type: "shared" | "private"
          room_rate: number
          active_bookings: number
        }
      }
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
    }
  }
}
