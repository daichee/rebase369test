"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // 現在のタブを判定
  const getCurrentTab = () => {
    if (pathname.includes("/admin/rooms")) return "rooms"
    if (pathname.includes("/admin/rates")) return "rates"
    if (pathname.includes("/admin/addons")) return "addons"
    if (pathname.includes("/admin/seasons")) return "seasons"
    return "rooms"
  }

  return (
    <div className="container p-6 space-y-6">
      {/* 管理画面ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">管理画面</h1>
        <p className="text-muted-foreground">システムの基本設定を管理</p>
      </div>

      {/* タブナビゲーション */}
      <Tabs value={getCurrentTab()} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rooms" asChild>
            <Link href="/admin/rooms">部屋管理</Link>
          </TabsTrigger>
          <TabsTrigger value="rates" asChild>
            <Link href="/admin/rates">料金管理</Link>
          </TabsTrigger>
          <TabsTrigger value="addons" asChild>
            <Link href="/admin/addons">オプション管理</Link>
          </TabsTrigger>
          <TabsTrigger value="seasons" asChild>
            <Link href="/admin/seasons">シーズン管理</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* コンテンツエリア */}
      <div className="mt-6">{children}</div>
    </div>
  )
}
