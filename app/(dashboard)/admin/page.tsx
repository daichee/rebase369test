"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ErrorBoundary } from "@/components/common/error-boundary"
import { ClientWrapper } from "@/components/common/client-wrapper"
import { useHydration } from "@/hooks/use-hydration"
import { useBookingStore } from "@/store/booking-store"
import { useRoomStore } from "@/store/room-store"
import { usePricingStore } from "@/store/pricing-store"
import dynamic from "next/dynamic"

// Dynamic imports for lucide-react icons to prevent SSR issues
const Settings = dynamic(() => import("lucide-react").then(mod => ({ default: mod.Settings })), { ssr: false })
const Users = dynamic(() => import("lucide-react").then(mod => ({ default: mod.Users })), { ssr: false })
const Home = dynamic(() => import("lucide-react").then(mod => ({ default: mod.Home })), { ssr: false })
const DollarSign = dynamic(() => import("lucide-react").then(mod => ({ default: mod.DollarSign })), { ssr: false })
const Calendar = dynamic(() => import("lucide-react").then(mod => ({ default: mod.Calendar })), { ssr: false })
const BarChart3 = dynamic(() => import("lucide-react").then(mod => ({ default: mod.BarChart3 })), { ssr: false })
const Database = dynamic(() => import("lucide-react").then(mod => ({ default: mod.Database })), { ssr: false })
const Sync = dynamic(() => import("lucide-react").then(mod => ({ default: mod.Sync })), { ssr: false })
const Settings2 = dynamic(() => import("lucide-react").then(mod => ({ default: mod.Settings2 })), { ssr: false })

export default function AdminPage() {
  const isHydrated = useHydration()
  
  // Safely get store data with error handling
  let bookingStore, roomStore, pricingStore
  try {
    bookingStore = useBookingStore()
    roomStore = useRoomStore()
    pricingStore = usePricingStore()
  } catch (error) {
    console.error("Store initialization error:", error)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Store initialization failed. Please refresh the page.</p>
        </div>
      </div>
    )
  }

  const { bookings = [], customers = [] } = bookingStore || {}
  const { rooms = [] } = roomStore || {}
  const { rules = [] } = pricingStore || {}

  // Prevent rendering until hydration is complete to avoid React error #130
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Defensive programming: ensure all arrays are valid before operations
  const safeBookings = Array.isArray(bookings) ? bookings : []
  const safeCustomers = Array.isArray(customers) ? customers : []
  const safeRooms = Array.isArray(rooms) ? rooms : []
  const safeRules = Array.isArray(rules) ? rules : []

  // Calculate stats with error handling
  const stats = (() => {
    try {
      return {
        totalBookings: safeBookings.length,
        totalCustomers: safeCustomers.length,
        totalRooms: safeRooms.length,
        activePricingRules: safeRules.filter((r) => r && typeof r === 'object' && r.isActive === true).length,
        pendingBookings: safeBookings.filter((b) => b && typeof b === 'object' && b.status === "pending").length,
        confirmedBookings: safeBookings.filter((b) => b && typeof b === 'object' && b.status === "confirmed").length,
        syncedBookings: safeBookings.filter((b) => b && typeof b === 'object' && b.boardEstimateId).length,
        totalRevenue: safeBookings.reduce((sum, b) => {
          const amount = (b && typeof b === 'object' && typeof b.totalAmount === 'number') ? b.totalAmount : 0
          return sum + amount
        }, 0),
      }
    } catch (error) {
      console.error("Stats calculation error:", error)
      return {
        totalBookings: 0,
        totalCustomers: 0,
        totalRooms: 0,
        activePricingRules: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        syncedBookings: 0,
        totalRevenue: 0,
      }
    }
  })()

  return (
    <ClientWrapper>
      <ErrorBoundary>
        <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">管理画面</h1>
          <p className="text-muted-foreground">システムの管理とデータの概要</p>
        </div>

      {/* 統計概要 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総予約数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">{stats.pendingBookings} 保留</Badge>
              <Badge variant="default" className="text-xs">{stats.confirmedBookings} 確定</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総売上</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">全期間合計</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">顧客・部屋</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}・{stats.totalRooms}</div>
            <p className="text-xs text-muted-foreground">顧客数・部屋数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Board連携</CardTitle>
            <Sync className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.syncedBookings}/{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">同期済み予約</p>
          </CardContent>
        </Card>
      </div>

      {/* 管理メニュー */}
      <div className="space-y-8">
        {/* 主要機能 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">主要機能</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="mr-2 h-5 w-5" />
                  部屋管理
                </CardTitle>
                <CardDescription>部屋の追加、編集、削除</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm">登録部屋数</span>
                  <Badge variant="outline">{safeRooms.length}件</Badge>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/rooms">管理画面を開く</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  料金設定
                </CardTitle>
                <CardDescription>料金ルールとシーズン料金</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm">アクティブルール</span>
                  <Badge variant="outline">{stats.activePricingRules}件</Badge>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/pricing">管理画面を開く</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  顧客管理
                </CardTitle>
                <CardDescription>顧客情報と予約履歴</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm">登録顧客数</span>
                  <Badge variant="outline">{safeCustomers.length}件</Badge>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/customers">管理画面を開く</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* 分析・レポート */}
        <div>
          <h2 className="text-xl font-semibold mb-4">分析・レポート</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  売上レポート
                </CardTitle>
                <CardDescription>売上分析と稼働率レポート</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/reports">レポートを開く</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  データ管理
                </CardTitle>
                <CardDescription>エクスポート・インポート・バックアップ</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/data">管理画面を開く</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* システム・連携 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">システム・連携</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sync className="mr-2 h-5 w-5" />
                  Board連携
                </CardTitle>
                <CardDescription>見積もりシステムとの同期</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm">未同期予約</span>
                  <Badge variant={(stats.totalBookings - stats.syncedBookings) > 0 ? "destructive" : "default"}>
                    {Math.max(0, stats.totalBookings - stats.syncedBookings)}件
                  </Badge>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/board-sync">同期管理を開く</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings2 className="mr-2 h-5 w-5" />
                  オプション管理
                </CardTitle>
                <CardDescription>食事・施設・備品オプション</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm">登録オプション</span>
                  <Badge variant="outline">6件</Badge>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/options">管理画面を開く</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  システム設定
                </CardTitle>
                <CardDescription>基本設定と外部連携</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Board API</span>
                    <Badge variant="default" className="text-xs">接続済み</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Supabase</span>
                    <Badge variant="default" className="text-xs">接続済み</Badge>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/settings">設定を開く</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
        </div>
      </ErrorBoundary>
    </ClientWrapper>
  )
}
