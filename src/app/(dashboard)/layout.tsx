import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="font-bold text-xl">ReBASE 369</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              ダッシュボード
            </Link>
            <Link href="/calendar" className="text-sm font-medium transition-colors hover:text-primary">
              予約カレンダー
            </Link>
            <Link href="/booking" className="text-sm font-medium transition-colors hover:text-primary">
              予約一覧
            </Link>
            <Link href="/admin/rooms" className="text-sm font-medium transition-colors hover:text-primary">
              管理画面
            </Link>
          </nav>
          <div className="ml-auto">
            <Button asChild variant="default" size="sm">
              <Link href="/booking/new">新規予約</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6">{children}</main>
    </div>
  )
}
