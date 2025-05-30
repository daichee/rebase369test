"use client"

import { useEffect, useState } from "react"
import { ErrorBoundary } from "./error-boundary"

interface ClientWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClientWrapper({ children, fallback }: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by only rendering on the client
  if (!mounted) {
    return fallback || <div>Loading...</div>
  }

  return (
    <ErrorBoundary>
      {children || null}
    </ErrorBoundary>
  )
}