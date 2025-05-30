"use client"

import { ReactNode, useEffect, useState } from "react"

interface HydrationBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * ハイドレーション境界コンポーネント
 * React Error #130を防ぐためのハイドレーション保護
 */
export function HydrationBoundary({ children, fallback }: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // ハイドレーション完了をマーク
    setIsHydrated(true)
  }, [])

  // ハイドレーション完了まではフォールバックを表示
  if (!isHydrated) {
    return (
      <>
        {fallback || (
          <div className="flex h-32 items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}