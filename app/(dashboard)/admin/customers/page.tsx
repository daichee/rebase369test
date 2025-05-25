"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Mail, Phone } from "lucide-react"
import { useBookingStore } from "@/store/booking-store"

export default function CustomersAdminPage() {
  const { customers, bookings } = useBookingStore()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm),
  )

  const getCustomerBookings = (customerId: string) => {
    return bookings.filter((booking) => booking.customerId === customerId)
  }

  const getCustomerStats = (customerId: string) => {
    const customerBookings = getCustomerBookings(customerId)
    const totalSpent = customerBookings.reduce((sum, booking) => sum + booking.totalAmount, 0)
    const completedBookings = customerBookings.filter((b) => b.status === "completed").length

    return {
      totalBookings: customerBookings.length,
      completedBookings,
      totalSpent,
      lastBooking:
        customerBookings.length > 0
          ? new Date(Math.max(...customerBookings.map((b) => new Date(b.createdAt).getTime())))
          : null,
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">顧客管理</h1>
        <p className="text-muted-foreground">顧客情報の管理と履歴確認</p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総顧客数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">リピーター</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c) => getCustomerBookings(c.id).length > 1).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均利用回数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.length > 0 ? (bookings.length / customers.length).toFixed(1) : "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均客単価</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥
              {bookings.length > 0
                ? Math.round(bookings.reduce((sum, b) => sum + b.totalAmount, 0) / bookings.length).toLocaleString()
                : "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 検索 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="顧客名、メール、電話番号で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* 顧客一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>顧客一覧</CardTitle>
          <CardDescription>{filteredCustomers.length}件の顧客が見つかりました</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>顧客名</TableHead>
                <TableHead>連絡先</TableHead>
                <TableHead>予約回数</TableHead>
                <TableHead>総利用金額</TableHead>
                <TableHead>最終利用日</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const stats = getCustomerStats(customer.id)
                return (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {customer.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="mr-1 h-3 w-3" />
                          {customer.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="mr-1 h-3 w-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{stats.totalBookings}</div>
                        <div className="text-xs text-muted-foreground">完了: {stats.completedBookings}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">¥{stats.totalSpent.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      {stats.lastBooking ? (
                        <div className="text-sm">{stats.lastBooking.toLocaleDateString("ja-JP")}</div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stats.totalBookings > 1 ? "default" : "secondary"}>
                        {stats.totalBookings > 1 ? "リピーター" : "新規"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/customers/${customer.id}`}>
                          <Eye className="mr-1 h-3 w-3" />
                          詳細
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
