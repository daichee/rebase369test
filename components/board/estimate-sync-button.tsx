"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

interface EstimateSyncButtonProps {
  bookingId: string
}

export function EstimateSyncButton({ bookingId }: EstimateSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSync = async () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <Button onClick={handleSync} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          同期中...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Boardと同期
        </>
      )}
    </Button>
  )
}
