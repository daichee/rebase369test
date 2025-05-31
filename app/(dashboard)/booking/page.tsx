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
import { useBookingStore } from "@/store/booking-store"

export default function BookingPage() {
  const { bookings, customers, setBookings, setCustomers } = useBookingStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filteredBookings, setFilteredBookings] = useState(bookings)

  // サンプルデータの初期化
  useEffect(() => {
    if (bookings.length === 0) {
      const sampleBookings = [
        {
          id: "1",
          customerId: "1",
          roomId: "1",
          checkIn: "2024-02-15",
          checkOut: "2024-02-17",
          guestCount: 2,
          totalAmount: 45000,
          status: "confirmed" as const,
          createdAt: "2024-02-01T10:00:00Z",
          updatedAt: "2024-02-01T10:00:00Z",
          boardEstimateId: "EST-001",
          notes: "記念日での利用",
        },
        {
          id: "2",
          customerId: "2",
          roomId: "2",
          checkIn: "2024-02-20",
          checkOut: "2024-02-22",
          guestCount: 4,
          totalAmount: 75000,
          status: "pending" as const,
          createdAt: "2024-02-05T14:30:00Z",
          updatedAt: "2024-02-05T14:30:00Z",
          notes: "ファミリー旅行",
        },
        {
          id: "3",
          customerId: "3",
          roomId: "3",
          checkIn: "2024-02-25",
          checkOut: "2024-02-28",
          guestCount: 2,
          totalAmount: 120000,
          status: "confirmed" as const,
          createdAt: "2024-02-10T09:15:00Z",
          updatedAt: "2024-02-10T09:15:00Z",
          boardEstimateId: "EST-002",
        },
      ]

      const sampleCustomers = [
        {
          id: "1",
          name: "田中太郎",
          email: "tanaka@example.com",
          phone: "090-1234-5678",
          address: "東京都渋谷区1-1-1",
          createdAt: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          name: "佐藤花子",
          email: "sato@example.com",
          phone: "080-9876-5432",
          address: "大阪府大阪市2-2-2",
          createdAt: "2024-01-20T14:30:00Z",
        },
        {
          id: "3",
          name: "山田次郎",
          email: "yamada@example.com",
          phone: "070-5555-1111",
          address: "京都府京都市3-3-3",
          createdAt: "2024-01-25T16:45:00Z",
        },
      ]

      setBookings(sampleBookings)
      setCustomers(sampleCustomers)
    }
  }, [bookings.length, setBookings, setCustomers])

  // フィルタリング処理
  useEffect(() => {
    let filtered = bookings

    if (searchTerm) {
      filtered = filtered.filter((booking) => {
        const customer = customers.find((c) => c.id === booking.customerId)
        return (
          customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter)
    }

    setFilteredBookings(filtered)
  }, [bookings, customers, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    } as const

    const labels = {
      pending: "保留中",
      confirmed: "確定",
      cancelled: "キャンセル",
      completed: "完了",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    return customer?.name || "不明"
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
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">確定済み</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.filter((b) => b.status === "confirmed").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">保留中</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.filter((b) => b.status === "pending").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総売上</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
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
                  placeholder="顧客名、メール、予約IDで検索..."
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
                <SelectItem value="pending">保留中</SelectItem>
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
                <TableHead>予約ID</TableHead>
                <TableHead>顧客名</TableHead>
                <TableHead>チェックイン</TableHead>
                <TableHead>チェックアウト</TableHead>
                <TableHead>人数</TableHead>
                <TableHead>金額</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.id}</TableCell>
                  <TableCell>{getCustomerName(booking.customerId)}</TableCell>
                  <TableCell>{new Date(booking.checkIn).toLocaleDateString("ja-JP")}</TableCell>
                  <TableCell>{new Date(booking.checkOut).toLocaleDateString("ja-JP")}</TableCell>
                  <TableCell>{booking.guestCount}名</TableCell>
                  <TableCell>¥{booking.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/booking/${booking.id}`}>詳細</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
