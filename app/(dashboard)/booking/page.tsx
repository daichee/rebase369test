"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Calendar, Users, DollarSign } from "lucide-react"
import type { Database } from "@/lib/supabase/types"

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  project_rooms?: {
    rooms: Database["public"]["Tables"]["rooms"]["Row"]
  }[]
}

export default function BookingPage() {
  const [bookings, setBookings] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filteredBookings, setFilteredBookings] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Supabaseから予約データを取得
  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/booking')
      if (!response.ok) {
        throw new Error('予約データの取得に失敗しました')
      }
      
      const result = await response.json()
      setBookings(result.data || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(err instanceof Error ? err.message : '予約データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // フィルタリング処理
  useEffect(() => {
    let filtered = bookings

    if (searchTerm) {
      filtered = filtered.filter((booking) => {
        return (
          booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.guest_org?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter)
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    } as const

    const labels = {
      draft: "下書き",
      confirmed: "確定",
      cancelled: "キャンセル",
      completed: "完了",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP")
  }

  const formatShortId = (id: string) => {
    return id.slice(0, 8)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">予約管理</h1>
          <p className="text-muted-foreground">宿泊予約の管理と追跡</p>
        </div>
        <Button asChild>
          <Link href="/booking/new">
            <Plus className="mr-2 h-4 w-4" />
            新規予約
          </Link>
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総予約数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : bookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">確定済み</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : bookings.filter((b) => b.status === "confirmed").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">下書き</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : bookings.filter((b) => b.status === "draft").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総売上</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : `¥${bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0).toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 検索とフィルター */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>検索・フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="顧客名、組織名、メール、予約IDで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
                <SelectItem value="confirmed">確定</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 予約一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>予約一覧</CardTitle>
          <CardDescription>{filteredBookings.length}件の予約が見つかりました</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>予約番号</TableHead>
                <TableHead>顧客名</TableHead>
                <TableHead>組織名</TableHead>
                <TableHead>宿泊期間</TableHead>
                <TableHead>人数</TableHead>
                <TableHead>金額</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">予約データを読み込み中...</p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-red-500">{error}</p>
                    <Button onClick={fetchBookings} className="mt-2" size="sm">
                      再試行
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">予約データが見つかりません</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{formatShortId(booking.id)}</TableCell>
                    <TableCell>{booking.guest_name || "未設定"}</TableCell>
                    <TableCell>{booking.guest_org || "―"}</TableCell>
                    <TableCell>
                      {formatDate(booking.start_date)} ～ {formatDate(booking.end_date)}
                      <div className="text-xs text-muted-foreground">{booking.nights}泊</div>
                    </TableCell>
                    <TableCell>{booking.pax_total}名</TableCell>
                    <TableCell>¥{(booking.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/booking/${booking.id}`}>詳細</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
