"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Users, DollarSign, TrendingUp, Plus, Calendar, Clock } from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const STATS = {
  totalBookings: 24,
  monthlyRevenue: 1250000,
  occupancyRate: 78,
  pendingBookings: 3,
}

const RECENT_BOOKINGS = [
  {
    id: "1",
    guestName: "山田太郎",
    checkIn: "2024-01-15",
    checkOut: "2024-01-17",
    status: "confirmed",
    amount: 125000,
  },
  {
    id: "2",
    guestName: "鈴木一郎",
    checkIn: "2024-01-20",
    checkOut: "2024-01-22",
    status: "pending",
    amount: 230000,
  },
  {
    id: "3",
    guestName: "佐藤花子",
    checkIn: "2024-01-25",
    checkOut: "2024-01-26",
    status: "confirmed",
    amount: 45000,
  },
]

const UPCOMING_CHECKINS = [
  {
    id: "1",
    guestName: "田中次郎",
    checkIn: "2024-01-16",
    room: "2F作法室",
    guests: 8,
  },
  {
    id: "2",
    guestName: "高橋美咲",
    checkIn: "2024-01-17",
    room: "3F被服室",
    guests: 12,
  },
]

export default function DashboardPage() {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      confirmed: { label: "確定", variant: "default" as const },
      pending: { label: "保留", variant: "secondary" as const },
      cancelled: { label: "キャンセル", variant: "destructive" as const },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const }
  }

  return (
    <div className="container p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground">予約状況と売上の概要</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/booking/new">
              <Plus className="mr-2 h-4 w-4" />
              新規予約
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              カレンダー
            </Link>
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の予約数</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{STATS.totalBookings}</div>
            <p className="text-xs text-muted-foreground">前月比 +12%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の売上</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{STATS.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">前月比 +8%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">稼働率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{STATS.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">前月比 +5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">保留中の予約</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{STATS.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">要確認</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 最近の予約 */}
        <Card>
          <CardHeader>
            <CardTitle>最近の予約</CardTitle>
            <CardDescription>直近の予約状況</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RECENT_BOOKINGS.map((booking) => {
                const status = getStatusBadge(booking.status)
                return (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{booking.guestName}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.checkIn} ～ {booking.checkOut}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <p className="text-xs text-muted-foreground">¥{booking.amount.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/booking">すべての予約を見る</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 今日のチェックイン */}
        <Card>
          <CardHeader>
            <CardTitle>今日のチェックイン</CardTitle>
            <CardDescription>本日到着予定のゲスト</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {UPCOMING_CHECKINS.map((checkin) => (
                <div key={checkin.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{checkin.guestName}</p>
                    <p className="text-xs text-muted-foreground">{checkin.room}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      <Users className="mr-1 h-3 w-3" />
                      {checkin.guests}名
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/calendar">カレンダーで確認</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
