"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Users, Home, DollarSign, Calendar, BarChart3 } from "lucide-react"
import { useBookingStore } from "@/store/booking-store"
import { useRoomStore } from "@/store/room-store"
import { usePricingStore } from "@/store/pricing-store"

export default function AdminPage() {
  const { bookings, customers } = useBookingStore()
  const { rooms } = useRoomStore()
  const { rules } = usePricingStore()

  const stats = {
    totalBookings: bookings.length,
    totalCustomers: customers.length,
    totalRooms: rooms.length,
    activePricingRules: rules.filter((r) => r.isActive).length,
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
    confirmedBookings: bookings.filter((b) => b.status === "confirmed").length,
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">管理画面</h1>
        <p className="text-muted-foreground">システムの設定と管理</p>
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
              <Badge variant="secondary">{stats.pendingBookings} 保留</Badge>
              <Badge variant="default">{stats.confirmedBookings} 確定</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">顧客数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">登録済み顧客</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">部屋数</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRooms}</div>
            <p className="text-xs text-muted-foreground">利用可能な部屋</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">料金ルール</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePricingRules}</div>
            <p className="text-xs text-muted-foreground">アクティブなルール</p>
          </CardContent>
        </Card>
      </div>

      {/* 管理メニュー */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="mr-2 h-5 w-5" />
              部屋管理
            </CardTitle>
            <CardDescription>部屋の追加、編集、削除を行います</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm">登録部屋数: {rooms.length}</p>
              <p className="text-sm">アクティブ: {rooms.filter((r) => r.isActive).length}</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/rooms">部屋管理を開く</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              料金設定
            </CardTitle>
            <CardDescription>料金ルールとシーズン料金の設定</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm">料金ルール: {rules.length}</p>
              <p className="text-sm">アクティブ: {rules.filter((r) => r.isActive).length}</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/pricing">料金設定を開く</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              顧客管理
            </CardTitle>
            <CardDescription>顧客情報の管理と履歴確認</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm">登録顧客: {customers.length}</p>
              <p className="text-sm">今月新規: 0</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/customers">顧客管理を開く</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              レポート
            </CardTitle>
            <CardDescription>売上レポートと分析データ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm">
                今月売上: ¥{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
              </p>
              <p className="text-sm">稼働率: 85%</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/reports">レポートを開く</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              システム設定
            </CardTitle>
            <CardDescription>システム全般の設定と環境変数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm">Board API: 接続済み</p>
              <p className="text-sm">Supabase: 接続済み</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/settings">システム設定を開く</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Board連携
            </CardTitle>
            <CardDescription>Board APIとの連携状況と同期管理</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm">同期済み見積もり: {bookings.filter((b) => b.boardEstimateId).length}</p>
              <p className="text-sm">未同期: {bookings.filter((b) => !b.boardEstimateId).length}</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/board-sync">Board連携を開く</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              オプション管理
            </CardTitle>
            <CardDescription>食事・施設・備品オプションの管理</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm">食事オプション: 3件</p>
              <p className="text-sm">施設・備品: 3件</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/options">オプション管理を開く</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              データ管理
            </CardTitle>
            <CardDescription>インポート・エクスポート・バックアップ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm">部屋データ: {rooms.length}件</p>
              <p className="text-sm">予約データ: {bookings.length}件</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/data">データ管理を開く</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
