"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentTab = pathname.split("/").pop() || "rooms"

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight">管理画面</h1>
        <p className="text-muted-foreground">部屋、料金、アドオン、シーズンなどのマスターデータを管理します。</p>
      </div>

      <Tabs value={currentTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="rooms" asChild>
            <Link href="/admin/rooms">部屋</Link>
          </TabsTrigger>
          <TabsTrigger value="rates" asChild>
            <Link href="/admin/rates">料金</Link>
          </TabsTrigger>
          <TabsTrigger value="addons" asChild>
            <Link href="/admin/addons">アドオン</Link>
          </TabsTrigger>
          <TabsTrigger value="seasons" asChild>
            <Link href="/admin/seasons">シーズン</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div>{children}</div>
    </div>
  )
}
