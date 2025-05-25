"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar, Home, BookOpen, Settings, LogOut } from "lucide-react"

const navigation = [
  { name: "ダッシュボード", href: "/dashboard", icon: Home },
  { name: "予約管理", href: "/booking", icon: BookOpen },
  { name: "カレンダー", href: "/calendar", icon: Calendar },
  { name: "管理画面", href: "/admin", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      {/* サイドバー */}
      <div className="hidden w-64 bg-gray-900 md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-4">
            <h2 className="text-lg font-semibold text-white">ReBASE 369</h2>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? "text-white" : "text-gray-400 group-hover:text-white",
                      "mr-3 h-5 w-5 flex-shrink-0",
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="flex flex-shrink-0 border-t border-gray-800 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
              asChild
            >
              <Link href="/">
                <LogOut className="mr-3 h-5 w-5" />
                ログアウト
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
