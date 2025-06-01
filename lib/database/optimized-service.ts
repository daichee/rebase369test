import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type CalculatedRate = Database['public']['Views']['calculated_rates']['Row']
type RoomAvailability = Database['public']['Views']['room_availability']['Row']

export class OptimizedDatabaseService {
  /**
   * 最適化された料金取得
   * マテリアライズドビューから事前計算済み料金を取得
   */
  static async getCalculatedRates(params: {
    seasonId?: string
    dayType?: 'weekday' | 'weekend'
    roomUsage?: 'shared' | 'private'
    ageGroup?: string
  }): Promise<CalculatedRate[]> {
    let query = supabase
      .from('calculated_rates')
      .select('*')
      .eq('is_active', true)

    if (params.seasonId) {
      query = query.eq('season_id', params.seasonId)
    }
    if (params.dayType) {
      query = query.eq('day_type', params.dayType)
    }
    if (params.roomUsage) {
      query = query.eq('room_usage', params.roomUsage)
    }
    if (params.ageGroup) {
      query = query.eq('age_group', params.ageGroup)
    }

    const { data, error } = await query

    if (error) {
      console.error('料金取得エラー:', error)
      throw new Error(`料金取得に失敗しました: ${error.message}`)
    }

    return data || []
  }

  /**
   * 最適化された部屋空室状況取得
   * ビューから稼働状況を含む部屋情報を取得
   */
  static async getRoomAvailability(roomType?: string): Promise<RoomAvailability[]> {
    let query = supabase.from('room_availability').select('*')

    if (roomType) {
      query = query.eq('room_type', roomType)
    }

    const { data, error } = await query

    if (error) {
      console.error('部屋空室状況取得エラー:', error)
      throw new Error(`部屋空室状況取得に失敗しました: ${error.message}`)
    }

    return data || []
  }

  /**
   * 高速空室チェック
   * 最適化されたインデックスを使用した空室チェック
   */
  static async checkRoomAvailability(
    roomId: string,
    startDate: string,
    endDate: string,
    excludeProjectId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('projects')
      .select('id')
      .eq('status', 'confirmed')
      .lte('start_date', endDate)
      .gte('end_date', startDate)

    if (excludeProjectId) {
      query = query.neq('id', excludeProjectId)
    }

    // 該当する期間に予約があるプロジェクトを取得
    const { data: conflictingProjects, error: projectError } = await query

    if (projectError) {
      console.error('プロジェクト検索エラー:', projectError)
      throw new Error(`プロジェクト検索に失敗しました: ${projectError.message}`)
    }

    if (!conflictingProjects || conflictingProjects.length === 0) {
      return true // 重複する予約がないので空室
    }

    // 該当プロジェクトで指定部屋を使用しているかチェック
    const projectIds = conflictingProjects.map(p => p.id)
    const { data: roomBookings, error: roomError } = await supabase
      .from('project_rooms')
      .select('project_id')
      .eq('room_id', roomId)
      .in('project_id', projectIds)

    if (roomError) {
      console.error('部屋予約検索エラー:', roomError)
      throw new Error(`部屋予約検索に失敗しました: ${roomError.message}`)
    }

    return !roomBookings || roomBookings.length === 0
  }

  /**
   * 期間での複数部屋空室チェック
   * 一度のクエリで複数部屋の空室状況をチェック
   */
  static async checkMultipleRoomsAvailability(
    roomIds: string[],
    startDate: string,
    endDate: string,
    excludeProjectId?: string
  ): Promise<Record<string, boolean>> {
    // 期間内の予約プロジェクト取得
    let query = supabase
      .from('projects')
      .select(`
        id,
        project_rooms!inner(room_id)
      `)
      .eq('status', 'confirmed')
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .in('project_rooms.room_id', roomIds)

    if (excludeProjectId) {
      query = query.neq('id', excludeProjectId)
    }

    const { data: conflictingBookings, error } = await query

    if (error) {
      console.error('複数部屋空室チェックエラー:', error)
      throw new Error(`複数部屋空室チェックに失敗しました: ${error.message}`)
    }

    // 予約されている部屋IDを抽出
    const bookedRoomIds = new Set(
      conflictingBookings?.flatMap(p => 
        p.project_rooms.map(pr => pr.room_id)
      ) || []
    )

    // 結果を構築
    const result: Record<string, boolean> = {}
    for (const roomId of roomIds) {
      result[roomId] = !bookedRoomIds.has(roomId)
    }

    return result
  }

  /**
   * 料金計算の高速化
   * マテリアライズドビューから直接料金を取得
   */
  static async calculateRatesOptimized(params: {
    seasonId: string
    dayType: 'weekday' | 'weekend'
    roomUsage: 'shared' | 'private'
    ageGroups: string[]
  }): Promise<Record<string, number>> {
    const { data: rates, error } = await supabase
      .from('calculated_rates')
      .select('age_group, final_price')
      .eq('season_id', params.seasonId)
      .eq('day_type', params.dayType)
      .eq('room_usage', params.roomUsage)
      .in('age_group', params.ageGroups)
      .eq('is_active', true)

    if (error) {
      console.error('最適化料金計算エラー:', error)
      throw new Error(`最適化料金計算に失敗しました: ${error.message}`)
    }

    const result: Record<string, number> = {}
    rates?.forEach(rate => {
      result[rate.age_group] = rate.final_price
    })

    return result
  }

  /**
   * マテリアライズドビューの手動更新
   * 必要に応じて料金ビューを更新
   */
  static async refreshCalculatedRates(): Promise<void> {
    const { error } = await supabase.rpc('refresh_materialized_view', {
      view_name: 'calculated_rates'
    })

    if (error) {
      console.error('ビュー更新エラー:', error)
      throw new Error(`ビュー更新に失敗しました: ${error.message}`)
    }
  }
}