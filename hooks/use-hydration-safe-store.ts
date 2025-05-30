"use client"

import { useEffect, useState } from "react"

/**
 * カスタムフック: Zustandストアのハイドレーション安全な利用
 * React Error #130を防ぐためのハイドレーション保護
 */
export function useHydrationSafeStore<T>(
  useStore: () => T,
  fallback: T | (() => T)
): T {
  const [isHydrated, setIsHydrated] = useState(false)
  const storeValue = useStore()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return typeof fallback === 'function' ? (fallback as () => T)() : fallback
  }

  return storeValue
}

/**
 * Zustandストア用の安全なデフォルト値
 */
export const safeStoreDefaults = {
  bookings: [],
  customers: [],
  rooms: [],
  rules: [],
  notifications: [],
  loadingStates: {},
} as const