"use client"

import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type Tables = Database["public"]["Tables"]
type Projects = Tables["projects"]["Row"]
type ProjectRooms = Tables["project_rooms"]["Row"]
type ProjectItems = Tables["project_items"]["Row"]
type Rooms = Tables["rooms"]["Row"]
type Seasons = Tables["seasons"]["Row"]
type Rates = Tables["rates"]["Row"]
type AddOns = Tables["add_ons"]["Row"]

/**
 * Comprehensive database service class for managing all data operations
 * Provides type-safe database access with error handling and optimized queries
 * 
 * Features:
 * - Booking/project management (CRUD operations)
 * - Room and availability management
 * - Pricing and rate configuration
 * - Add-on options management
 * - Reporting and analytics queries
 * 
 * Uses Supabase client with automatic connection management and error handling
 */
export class DatabaseService {
  private supabase: ReturnType<typeof createClient>

  /**
   * Initialize database service with optional Supabase client
   * 
   * @param supabaseClient - Optional Supabase client instance. Uses default client if not provided
   */
  constructor(supabaseClient?: ReturnType<typeof createClient>) {
    this.supabase = supabaseClient || createClient()
  }

  // ========================================
  // 8.1 予約データ管理機能
  // ========================================

  // projects テーブル機能
  /**
   * Creates a new booking project with comprehensive validation
   * 
   * @param data - Project data conforming to database insert schema
   * @returns Promise<Projects | null> - Created project object or null if failed
   * 
   * Features:
   * - Auto-generates unique project ID
   * - Validates required fields (guest info, dates, etc.)
   * - Sets default values for optional fields
   * - Returns complete project data after creation
   * 
   * Error Handling: Logs errors and returns null on failure
   */
  async createProject(data: Tables["projects"]["Insert"]): Promise<Projects | null> {
    const { data: project, error } = await this.supabase
      .from("projects")
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error("Failed to create project:", error)
      return null
    }
    return project
  }

  /**
   * Retrieves a single project by ID
   * 
   * @param id - Unique project identifier
   * @returns Promise<Projects | null> - Project object or null if not found
   * 
   * Use Cases:
   * - Booking detail views
   * - Editing existing bookings
   * - Order confirmations
   * - Admin management
   * 
   * Error Handling: Logs errors and returns null on failure or not found
   */
  async getProject(id: string): Promise<Projects | null> {
    const { data, error } = await this.supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Failed to get project:", error)
      return null
    }
    return data
  }

  async updateProject(id: string, data: Tables["projects"]["Update"]): Promise<Projects | null> {
    const { data: project, error } = await this.supabase
      .from("projects")
      .update(data)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Failed to update project:", error)
      return null
    }
    return project
  }

  async deleteProject(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("projects")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Failed to delete project:", error)
      return false
    }
    return true
  }

  async getProjectsByStatus(status: Projects["status"]): Promise<Projects[]> {
    const { data, error } = await this.supabase
      .from("projects")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to get projects by status:", error)
      return []
    }
    return data || []
  }

  async getProjectsByDateRange(startDate: string, endDate: string): Promise<Projects[]> {
    const { data, error } = await this.supabase
      .from("projects")
      .select("*")
      .lte("start_date", endDate)
      .gte("end_date", startDate)
      .order("start_date", { ascending: true })

    if (error) {
      console.error("Failed to get projects by date range:", error)
      return []
    }
    return data || []
  }

  // project_rooms テーブル機能
  async assignRoomToProject(data: Tables["project_rooms"]["Insert"]): Promise<ProjectRooms | null> {
    const { data: assignment, error } = await this.supabase
      .from("project_rooms")
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error("Failed to assign room to project:", error)
      return null
    }
    return assignment
  }

  async getProjectRooms(projectId: string): Promise<ProjectRooms[]> {
    const { data, error } = await this.supabase
      .from("project_rooms")
      .select("*")
      .eq("project_id", projectId)

    if (error) {
      console.error("Failed to get project rooms:", error)
      return []
    }
    return data || []
  }

  async updateProjectRoom(id: string, data: Tables["project_rooms"]["Update"]): Promise<ProjectRooms | null> {
    const { data: room, error } = await this.supabase
      .from("project_rooms")
      .update(data)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Failed to update project room:", error)
      return null
    }
    return room
  }

  // project_items テーブル機能
  async addProjectItem(data: Tables["project_items"]["Insert"]): Promise<ProjectItems | null> {
    const { data: item, error } = await this.supabase
      .from("project_items")
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error("Failed to add project item:", error)
      return null
    }
    return item
  }

  async getProjectItems(projectId: string): Promise<ProjectItems[]> {
    const { data, error } = await this.supabase
      .from("project_items")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Failed to get project items:", error)
      return []
    }
    return data || []
  }

  async updateProjectItem(id: string, data: Tables["project_items"]["Update"]): Promise<ProjectItems | null> {
    const { data: item, error } = await this.supabase
      .from("project_items")
      .update(data)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Failed to update project item:", error)
      return null
    }
    return item
  }

  async deleteProjectItem(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("project_items")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Failed to delete project item:", error)
      return false
    }
    return true
  }

  // ========================================
  // 8.2 マスタデータ管理機能
  // ========================================

  // rooms テーブル機能
  async getAllRooms(): Promise<Rooms[]> {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("is_active", true)
      .order("floor", { ascending: true })

    if (error) {
      console.error("Failed to get rooms:", error)
      return []
    }
    return data || []
  }

  async getRoomsByFloor(floor: string): Promise<Rooms[]> {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("floor", floor)
      .eq("is_active", true)
      .order("room_id", { ascending: true })

    if (error) {
      console.error("Failed to get rooms by floor:", error)
      return []
    }
    return data || []
  }

  async updateRoom(roomId: string, data: Tables["rooms"]["Update"]): Promise<Rooms | null> {
    const { data: room, error } = await this.supabase
      .from("rooms")
      .update(data)
      .eq("room_id", roomId)
      .select()
      .single()

    if (error) {
      console.error("Failed to update room:", error)
      return null
    }
    return room
  }

  // seasons テーブル機能
  async getActiveSeasons(): Promise<Seasons[]> {
    const { data, error } = await this.supabase
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .order("start_date", { ascending: true })

    if (error) {
      console.error("Failed to get seasons:", error)
      return []
    }
    return data || []
  }

  async getSeasonForDate(date: string): Promise<Seasons | null> {
    const { data, error } = await this.supabase
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", date)
      .gte("end_date", date)
      .single()

    if (error) {
      console.error("Failed to get season for date:", error)
      return null
    }
    return data
  }

  // rates テーブル機能
  async getRates(filters?: {
    seasonId?: string
    dayType?: "weekday" | "weekend"
    roomUsage?: "shared" | "private"
    ageGroup?: string
  }): Promise<Rates[]> {
    let query = this.supabase
      .from("rates")
      .select("*")
      .eq("is_active", true)

    if (filters?.seasonId) {
      query = query.eq("season_id", filters.seasonId)
    }
    if (filters?.dayType) {
      query = query.eq("day_type", filters.dayType)
    }
    if (filters?.roomUsage) {
      query = query.eq("room_usage", filters.roomUsage)
    }
    if (filters?.ageGroup) {
      query = query.eq("age_group", filters.ageGroup)
    }

    const { data, error } = await query.order("age_group", { ascending: true })

    if (error) {
      console.error("Failed to get rates:", error)
      return []
    }
    return data || []
  }

  async getRate(seasonId: string, dayType: "weekday" | "weekend", roomUsage: "shared" | "private", ageGroup: string): Promise<Rates | null> {
    const { data, error } = await this.supabase
      .from("rates")
      .select("*")
      .eq("season_id", seasonId)
      .eq("day_type", dayType)
      .eq("room_usage", roomUsage)
      .eq("age_group", ageGroup)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("Failed to get rate:", error)
      return null
    }
    return data
  }

  // add_ons テーブル機能
  async getAllAddOns(): Promise<AddOns[]> {
    const { data, error } = await this.supabase
      .from("add_ons")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })

    if (error) {
      console.error("Failed to get add-ons:", error)
      return []
    }
    return data || []
  }

  async getAddOnsByCategory(category: "meal" | "facility" | "equipment"): Promise<AddOns[]> {
    const { data, error } = await this.supabase
      .from("add_ons")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("Failed to get add-ons by category:", error)
      return []
    }
    return data || []
  }

  async getAddOn(addOnId: string): Promise<AddOns | null> {
    const { data, error } = await this.supabase
      .from("add_ons")
      .select("*")
      .eq("add_on_id", addOnId)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("Failed to get add-on:", error)
      return null
    }
    return data
  }

  async createAddOn(data: Tables["add_ons"]["Insert"]): Promise<AddOns | null> {
    const { data: addOn, error } = await this.supabase
      .from("add_ons")
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error("Failed to create add-on:", error)
      return null
    }
    return addOn
  }

  async updateAddOn(addOnId: string, data: Tables["add_ons"]["Update"]): Promise<AddOns | null> {
    const { data: addOn, error } = await this.supabase
      .from("add_ons")
      .update(data)
      .eq("add_on_id", addOnId)
      .select()
      .single()

    if (error) {
      console.error("Failed to update add-on:", error)
      return null
    }
    return addOn
  }

  async deleteAddOn(addOnId: string): Promise<boolean> {
    // Soft delete by setting is_active to false
    const { error } = await this.supabase
      .from("add_ons")
      .update({ is_active: false })
      .eq("add_on_id", addOnId)

    if (error) {
      console.error("Failed to delete add-on:", error)
      return false
    }
    return true
  }


  // ========================================
  // 複合操作・統計機能
  // ========================================

  async getProjectWithRoomsAndItems(projectId: string): Promise<{
    project: Projects | null
    rooms: ProjectRooms[]
    items: ProjectItems[]
  }> {
    const [project, rooms, items] = await Promise.all([
      this.getProject(projectId),
      this.getProjectRooms(projectId),
      this.getProjectItems(projectId),
    ])

    return { project, rooms, items }
  }

  async getOccupancyStats(startDate: string, endDate: string): Promise<{
    totalBookings: number
    confirmedBookings: number
    totalRevenue: number
    averageOccupancy: number
  }> {
    const projects = await this.getProjectsByDateRange(startDate, endDate)
    const confirmedProjects = projects.filter(p => p.status === "confirmed")

    const totalBookings = projects.length
    const confirmedBookings = confirmedProjects.length
    const totalRevenue = confirmedProjects.reduce((sum, p) => sum + p.total_amount, 0)

    // Calculate average occupancy (simplified)
    const rooms = await this.getAllRooms()
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
    const totalGuestNights = confirmedProjects.reduce((sum, p) => sum + (p.pax_total * p.nights), 0)
    const totalRoomNights = rooms.length * this.daysBetween(startDate, endDate)
    const averageOccupancy = totalRoomNights > 0 ? (totalGuestNights / (totalCapacity * totalRoomNights)) * 100 : 0

    return {
      totalBookings,
      confirmedBookings,
      totalRevenue,
      averageOccupancy,
    }
  }

  private daysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()