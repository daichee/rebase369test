import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

export function LoadingSpinner({ size = "md", text, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    </div>
  )
}

export function LoadingPage({ text = "読み込み中..." }: { text?: string }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

export function LoadingCard({ text = "データを読み込み中..." }: { text?: string }) {
  return (
    <div className="flex h-64 items-center justify-center border rounded-lg bg-card">
      <LoadingSpinner size="md" text={text} />
    </div>
  )
}