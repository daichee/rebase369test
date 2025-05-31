"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, TrendingUp, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import Link from "next/link"
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RoomStatusGrid } from "@/components/dashboard/room-status-grid"
import { TodaysBookings } from "@/components/dashboard/todays-bookings"

export default function DashboardPage() {
  const { stats, loading } = useDashboardStats()

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpIcon className="h-3 w-3 text-green-600" />
    if (change < 0) return <ArrowDownIcon className="h-3 w-3 text-red-600" />
    return null
  }

  const getChangeText = (change: number) => {
    if (change === 0) return "前月と同じ"
    return `前月比 ${change > 0 ? '+' : ''}${change}%`
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-muted-foreground"
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground">予約状況と売上の概要</p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の稼働率</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.todayOccupancy.percentage || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.todayOccupancy.occupiedRooms || 0}/{stats?.todayOccupancy.totalRooms || 13} 部屋
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の売上</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.monthlySales.total || 0)}</div>
                <p className={`text-xs flex items-center gap-1 ${getChangeColor(stats?.monthlySales.changePercentage || 0)}`}>
                  {getChangeIcon(stats?.monthlySales.changePercentage || 0)}
                  {getChangeText(stats?.monthlySales.changePercentage || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の予約数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.monthlyBookings.count || 0}</div>
                <p className={`text-xs flex items-center gap-1 ${getChangeColor(stats?.monthlyBookings.changePercentage || 0)}`}>
                  {getChangeIcon(stats?.monthlyBookings.changePercentage || 0)}
                  {getChangeText(stats?.monthlyBookings.changePercentage || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均客単価</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.averagePrice.amount || 0)}</div>
                <p className={`text-xs flex items-center gap-1 ${getChangeColor(stats?.averagePrice.changePercentage || 0)}`}>
                  {getChangeIcon(stats?.averagePrice.changePercentage || 0)}
                  {getChangeText(stats?.averagePrice.changePercentage || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 売上チャート */}
      <SalesChart />

      {/* メインコンテンツエリア */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左カラム */}
        <div className="space-y-6">
          <TodaysBookings />
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          <RoomStatusGrid />
          
          {/* クイックアクション */}
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
              <CardDescription>よく使用する機能へのショートカット</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Button asChild className="w-full justify-start">
                  <Link href="/booking/new">
                    <Calendar className="h-4 w-4 mr-2" />
                    新規予約作成
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/calendar">
                    <Calendar className="h-4 w-4 mr-2" />
                    カレンダー表示
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/settings">
                    <Users className="h-4 w-4 mr-2" />
                    設定
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
