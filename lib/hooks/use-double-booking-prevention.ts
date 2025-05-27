"use client"

import { useState, useEffect, useCallback } from "react"
import { DoubleBookingPrevention } from "@/lib/booking/double-booking-prevention"
import type { BookingValidation, RealtimeUpdateResult, BookingConflict } from "@/lib/booking/double-booking-prevention"

export interface UseDoubleBookingPreventionOptions {
  autoCheck?: boolean
  checkInterval?: number
  sessionId?: string
}

export function useDoubleBookingPrevention(options: UseDoubleBookingPreventionOptions = {}) {
  const {
    autoCheck = true,
    checkInterval = 30000, // 30秒
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  } = options

  const [prevention] = useState(() => new DoubleBookingPrevention())
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<BookingConflict[]>([])
  const [hasLock, setHasLock] = useState(false)
  const [lockExpiresAt, setLockExpiresAt] = useState<string | null>(null)
  const [otherActiveSessions, setOtherActiveSessions] = useState(0)

  // リアルタイム重複チェック
  const checkForConflicts = useCallback(async (
    roomIds: string[],
    startDate: string,
    endDate: string,
    currentBookingId?: string
  ): Promise<RealtimeUpdateResult> => {
    if (roomIds.length === 0 || !startDate || !endDate) {
      return {
        success: true,
        conflicts: [],
        updatedAt: new Date().toISOString(),
        message: "検証対象なし",
      }
    }

    setIsChecking(true)
    try {
      const result = await prevention.performRealtimeCheck(
        roomIds,
        startDate,
        endDate,
        currentBookingId
      )

      setConflicts(result.conflicts)
      setLastCheck(result.updatedAt)
      
      return result
    } catch (error) {
      console.error("リアルタイムチェックエラー:", error)
      return {
        success: false,
        conflicts: [],
        updatedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "チェックに失敗しました",
      }
    } finally {
      setIsChecking(false)
    }
  }, [prevention])

  // 排他制御付き検証
  const validateExclusively = useCallback(async (
    roomIds: string[],
    startDate: string,
    endDate: string,
    excludeBookingId?: string
  ): Promise<BookingValidation> => {
    setIsChecking(true)
    try {
      const result = await prevention.validateBookingExclusively(
        roomIds,
        startDate,
        endDate,
        excludeBookingId
      )

      setConflicts(result.conflicts)
      setLastCheck(new Date().toISOString())
      
      return result
    } catch (error) {
      console.error("排他制御検証エラー:", error)
      return {
        isValid: false,
        conflicts: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : "検証に失敗しました"],
        canProceed: false,
      }
    } finally {
      setIsChecking(false)
    }
  }, [prevention])

  // 最終確認
  const finalValidation = useCallback(async (
    bookingData: {
      roomIds: string[]
      startDate: string
      endDate: string
      guestCount: number
      guestName: string
    },
    excludeBookingId?: string
  ): Promise<BookingValidation> => {
    setIsChecking(true)
    try {
      const result = await prevention.finalValidationBeforeCommit(
        bookingData,
        excludeBookingId
      )

      setConflicts(result.conflicts)
      setLastCheck(new Date().toISOString())
      
      return result
    } catch (error) {
      console.error("最終検証エラー:", error)
      return {
        isValid: false,
        conflicts: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : "最終検証に失敗しました"],
        canProceed: false,
      }
    } finally {
      setIsChecking(false)
    }
  }, [prevention])

  // 予約ロック取得
  const acquireLock = useCallback(async (
    roomIds: string[],
    startDate: string,
    endDate: string
  ): Promise<boolean> => {
    try {
      const result = await prevention.handleConcurrentAccess(
        sessionId,
        roomIds,
        startDate,
        endDate
      )

      setHasLock(result.lockAcquired)
      setLockExpiresAt(result.lockExpiresAt)
      setOtherActiveSessions(result.otherActiveSessions)
      
      return result.lockAcquired
    } catch (error) {
      console.error("ロック取得エラー:", error)
      return false
    }
  }, [prevention, sessionId])

  // 競合検知と解決
  const detectAndResolveConflicts = useCallback(async (
    originalBookingId: string,
    roomIds: string[],
    startDate: string,
    endDate: string
  ) => {
    setIsChecking(true)
    try {
      const result = await prevention.detectAndResolveConflicts(
        originalBookingId,
        roomIds,
        startDate,
        endDate
      )

      setConflicts(result.conflicts)
      setLastCheck(new Date().toISOString())
      
      return result
    } catch (error) {
      console.error("競合検知エラー:", error)
      return {
        hasNewConflicts: true,
        conflicts: [],
        resolutionOptions: [],
      }
    } finally {
      setIsChecking(false)
    }
  }, [prevention])

  // 自動チェック
  useEffect(() => {
    if (!autoCheck) return

    const intervalId = setInterval(() => {
      // 最後のチェックから指定時間経過している場合のみ実行
      if (lastCheck) {
        const timeSinceLastCheck = Date.now() - new Date(lastCheck).getTime()
        if (timeSinceLastCheck < checkInterval) return
      }

      // 現在チェック中の場合はスキップ
      if (isChecking) return

      // 実際の自動チェックはコンポーネント側で実装
      // ここではハートビート的な機能のみ
    }, checkInterval)

    return () => clearInterval(intervalId)
  }, [autoCheck, checkInterval, lastCheck, isChecking])

  // ロック期限監視
  useEffect(() => {
    if (!lockExpiresAt) return

    const expiryTime = new Date(lockExpiresAt).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiryTime - now

    if (timeUntilExpiry <= 0) {
      setHasLock(false)
      setLockExpiresAt(null)
      return
    }

    const timeoutId = setTimeout(() => {
      setHasLock(false)
      setLockExpiresAt(null)
    }, timeUntilExpiry)

    return () => clearTimeout(timeoutId)
  }, [lockExpiresAt])

  // ユーティリティ関数
  const hasConflicts = conflicts.length > 0
  const isLockExpiring = lockExpiresAt 
    ? new Date(lockExpiresAt).getTime() - Date.now() < 60000 // 1分以内
    : false

  const getConflictSummary = () => {
    if (conflicts.length === 0) return null

    const roomsWithConflicts = [...new Set(conflicts.map(c => c.roomId))]
    const totalOverlapNights = conflicts.reduce((sum, c) => sum + c.overlapNights, 0)

    return {
      affectedRooms: roomsWithConflicts.length,
      totalConflicts: conflicts.length,
      totalOverlapNights,
      roomNames: roomsWithConflicts.join(", "),
    }
  }

  const reset = useCallback(() => {
    setConflicts([])
    setLastCheck(null)
    setHasLock(false)
    setLockExpiresAt(null)
    setOtherActiveSessions(0)
  }, [])

  return {
    // State
    isChecking,
    lastCheck,
    conflicts,
    hasConflicts,
    hasLock,
    lockExpiresAt,
    isLockExpiring,
    otherActiveSessions,
    sessionId,

    // Functions
    checkForConflicts,
    validateExclusively,
    finalValidation,
    acquireLock,
    detectAndResolveConflicts,
    reset,

    // Utilities
    getConflictSummary,
  }
}