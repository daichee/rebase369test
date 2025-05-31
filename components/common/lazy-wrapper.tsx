"use client"

import { Suspense, lazy, ComponentType } from "react"
import { LoadingSpinner } from "./loading-spinner"

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  )
}

// 動的インポート用のヘルパー関数
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc)
  
  return function WrappedLazyComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// 条件付きレンダリング用のコンポーネント
export function ConditionalRender({ 
  condition, 
  children, 
  fallback 
}: {
  condition: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  if (!condition) {
    return fallback || null
  }

  return <>{children}</>
}

// Intersection Observer を使った遅延ローディング
export function LazyLoadOnVisible({
  children,
  threshold = 0.1,
  rootMargin = "50px",
  fallback,
}: {
  children: React.ReactNode
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
}) {
  const { useRef, useEffect, useState } = require("react")
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <div style={{ height: "200px" }} />)}
    </div>
  )
}