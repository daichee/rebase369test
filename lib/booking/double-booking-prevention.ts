import { createClient } from "@/lib/supabase/client"

export interface BookingConflict {
  roomId: string
  conflictingBookingId: string
  conflictingGuestName: string
  overlapStart: string
  overlapEnd: string
  overlapNights: number
}

export interface BookingValidation {
  isValid: boolean
  conflicts: BookingConflict[]
  warnings: string[]
  errors: string[]
  canProceed: boolean
}

export interface RealtimeUpdateResult {
  success: boolean
  conflicts: BookingConflict[]
  updatedAt: string
  message: string
}

export class DoubleBookingPrevention {
  private supabase = createClient()

  /**
   * 予約前の排他制御チェック
   */
  async validateBookingExclusively(
    roomIds: string[],
    startDate: string,
    endDate: string,
    excludeBookingId?: string
  ): Promise<BookingValidation> {
    try {
      // トランザクション内で排他制御を実行
      const { data: conflicts, error } = await this.supabase.rpc(
        'check_booking_conflicts_exclusive',
        {
          p_room_ids: roomIds,
          p_start_date: startDate,
          p_end_date: endDate,
          p_exclude_booking_id: excludeBookingId,
        }
      )

      if (error) {
        throw new Error(`排他制御エラー: ${error.message}`)
      }

      const bookingConflicts: BookingConflict[] = (conflicts || []).map((conflict: any) => ({
        roomId: conflict.room_id,
        conflictingBookingId: conflict.conflicting_booking_id,
        conflictingGuestName: conflict.guest_name,
        overlapStart: conflict.overlap_start,
        overlapEnd: conflict.overlap_end,
        overlapNights: conflict.overlap_nights,
      }))

      const hasConflicts = bookingConflicts.length > 0

      return {
        isValid: !hasConflicts,
        conflicts: bookingConflicts,
        warnings: this.generateWarnings(bookingConflicts),
        errors: hasConflicts ? ['予約の重複が検出されました'] : [],
        canProceed: !hasConflicts,
      }
    } catch (error) {
      return {
        isValid: false,
        conflicts: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : '検証に失敗しました'],
        canProceed: false,
      }
    }
  }

  /**
   * リアルタイム重複チェック
   */
  async performRealtimeCheck(
    roomIds: string[],
    startDate: string,
    endDate: string,
    currentBookingId?: string
  ): Promise<RealtimeUpdateResult> {
    try {
      const validation = await this.validateBookingExclusively(
        roomIds,
        startDate,
        endDate,
        currentBookingId
      )

      return {
        success: validation.isValid,
        conflicts: validation.conflicts,
        updatedAt: new Date().toISOString(),
        message: validation.isValid 
          ? '重複なし - 予約可能です' 
          : `${validation.conflicts.length}件の重複が検出されました`,
      }
    } catch (error) {
      return {
        success: false,
        conflicts: [],
        updatedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'チェックに失敗しました',
      }
    }
  }

  /**
   * 予約確定時の最終確認
   */
  async finalValidationBeforeCommit(
    bookingData: {
      roomIds: string[]
      startDate: string
      endDate: string
      guestCount: number
      guestName: string
    },
    excludeBookingId?: string
  ): Promise<BookingValidation> {
    try {
      // 1. ダブルブッキングチェック
      const conflictValidation = await this.validateBookingExclusively(
        bookingData.roomIds,
        bookingData.startDate,
        bookingData.endDate,
        excludeBookingId
      )

      if (!conflictValidation.isValid) {
        return conflictValidation
      }

      // 2. 定員チェック
      const capacityValidation = await this.validateCapacity(
        bookingData.roomIds,
        bookingData.guestCount
      )

      // 3. ビジネスルールチェック
      const businessValidation = this.validateBusinessRules(bookingData)

      // 結果を統合
      const allErrors = [
        ...conflictValidation.errors,
        ...capacityValidation.errors,
        ...businessValidation.errors,
      ]

      const allWarnings = [
        ...conflictValidation.warnings,
        ...capacityValidation.warnings,
        ...businessValidation.warnings,
      ]

      return {
        isValid: allErrors.length === 0,
        conflicts: conflictValidation.conflicts,
        warnings: allWarnings,
        errors: allErrors,
        canProceed: allErrors.length === 0,
      }
    } catch (error) {
      return {
        isValid: false,
        conflicts: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : '最終検証に失敗しました'],
        canProceed: false,
      }
    }
  }

  /**
   * 定員妥当性チェック
   */
  private async validateCapacity(
    roomIds: string[],
    guestCount: number
  ): Promise<{ errors: string[]; warnings: string[] }> {
    try {
      const { data: rooms, error } = await this.supabase
        .from('rooms')
        .select('room_id, name, capacity')
        .in('room_id', roomIds)
        .eq('is_active', true)

      if (error) throw error

      const totalCapacity = rooms?.reduce((sum, room) => sum + room.capacity, 0) || 0
      const errors: string[] = []
      const warnings: string[] = []

      if (totalCapacity < guestCount) {
        errors.push(`定員不足: ${guestCount}名 > ${totalCapacity}名（選択部屋の合計定員）`)
      }

      // 80%以上の利用率で警告
      if (totalCapacity > 0 && guestCount / totalCapacity > 0.8) {
        warnings.push('選択部屋の定員に対して人数が多めです。快適性をご確認ください。')
      }

      return { errors, warnings }
    } catch (error) {
      return {
        errors: ['定員チェックに失敗しました'],
        warnings: [],
      }
    }
  }

  /**
   * ビジネスルール検証
   */
  private validateBusinessRules(bookingData: {
    startDate: string
    endDate: string
    guestCount: number
    guestName: string
  }): { errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // 日付検証
    const startDate = new Date(bookingData.startDate)
    const endDate = new Date(bookingData.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      errors.push('過去の日付は予約できません')
    }

    if (startDate >= endDate) {
      errors.push('チェックアウト日はチェックイン日より後である必要があります')
    }

    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (nights > 30) {
      warnings.push('30泊を超える長期滞在です。事前にご相談ください。')
    }

    // 人数検証
    if (bookingData.guestCount <= 0) {
      errors.push('宿泊者数を入力してください')
    }

    if (bookingData.guestCount > 100) {
      warnings.push('大規模グループでのご利用です。事前にご相談ください。')
    }

    // ゲスト名検証
    if (!bookingData.guestName.trim()) {
      errors.push('代表者名を入力してください')
    }

    return { errors, warnings }
  }

  /**
   * 競合状態の検知と回避
   */
  async detectAndResolveConflicts(
    originalBookingId: string,
    roomIds: string[],
    startDate: string,
    endDate: string
  ): Promise<{
    hasNewConflicts: boolean
    conflicts: BookingConflict[]
    resolutionOptions: Array<{
      type: 'alternative_rooms' | 'alternative_dates' | 'split_booking'
      description: string
      data: any
    }>
  }> {
    try {
      // 最新の競合状況をチェック
      const validation = await this.validateBookingExclusively(
        roomIds,
        startDate,
        endDate,
        originalBookingId
      )

      const resolutionOptions = []

      if (!validation.isValid) {
        // 代替部屋の提案
        const alternativeRooms = await this.findAlternativeRooms(
          roomIds,
          startDate,
          endDate,
          originalBookingId
        )

        if (alternativeRooms.length > 0) {
          resolutionOptions.push({
            type: 'alternative_rooms' as const,
            description: `代替部屋: ${alternativeRooms.length}室が利用可能`,
            data: { roomIds: alternativeRooms },
          })
        }

        // 代替日程の提案
        const alternativeDates = await this.findAlternativeDates(
          roomIds,
          startDate,
          endDate,
          originalBookingId
        )

        if (alternativeDates.length > 0) {
          resolutionOptions.push({
            type: 'alternative_dates' as const,
            description: '代替日程での空室があります',
            data: { dates: alternativeDates },
          })
        }
      }

      return {
        hasNewConflicts: !validation.isValid,
        conflicts: validation.conflicts,
        resolutionOptions,
      }
    } catch (error) {
      return {
        hasNewConflicts: true,
        conflicts: [],
        resolutionOptions: [],
      }
    }
  }

  /**
   * 複数ユーザー同時アクセス対応
   */
  async handleConcurrentAccess(
    sessionId: string,
    roomIds: string[],
    startDate: string,
    endDate: string
  ): Promise<{
    lockAcquired: boolean
    lockExpiresAt: string
    otherActiveSessions: number
  }> {
    try {
      const lockExpiry = new Date()
      lockExpiry.setMinutes(lockExpiry.getMinutes() + 10) // 10分間のロック

      const { data, error } = await this.supabase.rpc(
        'acquire_booking_lock',
        {
          p_session_id: sessionId,
          p_room_ids: roomIds,
          p_start_date: startDate,
          p_end_date: endDate,
          p_lock_expires_at: lockExpiry.toISOString(),
        }
      )

      if (error) throw error

      return {
        lockAcquired: data?.lock_acquired || false,
        lockExpiresAt: lockExpiry.toISOString(),
        otherActiveSessions: data?.other_sessions || 0,
      }
    } catch (error) {
      return {
        lockAcquired: false,
        lockExpiresAt: '',
        otherActiveSessions: 0,
      }
    }
  }

  /**
   * 代替部屋検索
   */
  private async findAlternativeRooms(
    originalRoomIds: string[],
    startDate: string,
    endDate: string,
    excludeBookingId?: string
  ): Promise<string[]> {
    try {
      const { data: availableRooms, error } = await this.supabase.rpc(
        'find_alternative_rooms',
        {
          p_original_room_ids: originalRoomIds,
          p_start_date: startDate,
          p_end_date: endDate,
          p_exclude_booking_id: excludeBookingId,
        }
      )

      if (error) throw error

      return (availableRooms || []).map((room: any) => room.room_id)
    } catch (error) {
      console.error('代替部屋検索エラー:', error)
      return []
    }
  }

  /**
   * 代替日程検索
   */
  private async findAlternativeDates(
    roomIds: string[],
    originalStartDate: string,
    originalEndDate: string,
    excludeBookingId?: string
  ): Promise<Array<{ startDate: string; endDate: string }>> {
    try {
      const { data: alternativeDates, error } = await this.supabase.rpc(
        'find_alternative_dates',
        {
          p_room_ids: roomIds,
          p_original_start: originalStartDate,
          p_original_end: originalEndDate,
          p_exclude_booking_id: excludeBookingId,
          p_search_days: 14, // 前後14日間で検索
        }
      )

      if (error) throw error

      return alternativeDates || []
    } catch (error) {
      console.error('代替日程検索エラー:', error)
      return []
    }
  }

  /**
   * 警告メッセージ生成
   */
  private generateWarnings(conflicts: BookingConflict[]): string[] {
    const warnings: string[] = []

    if (conflicts.length > 0) {
      const roomNames = [...new Set(conflicts.map(c => c.roomId))].join(', ')
      warnings.push(`部屋 ${roomNames} で予約の重複があります`)
      
      conflicts.forEach(conflict => {
        warnings.push(
          `${conflict.roomId}: ${conflict.conflictingGuestName}様と${conflict.overlapNights}泊重複`
        )
      })
    }

    return warnings
  }
}