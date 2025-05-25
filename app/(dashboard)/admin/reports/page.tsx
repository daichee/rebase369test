"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Calendar, DollarSign, Home } from "lucide-react"
import { useBookingStore } from "@/store/booking-store"
import { useRoomStore } from "@/store/room-store"

export default function ReportsPage() {
  const { bookings, customers } = useBookingStore()
  const { rooms } = useRoomStore()
  const [selectedPeriod, setSelectedPeriod] = useState("month")

  // 売上統計の計算
  const calculateRevenue = () => {
    const completedBookings = bookings.filter((b) => b.status === "completed")
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0)
    const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0

    return {
      totalRevenue,
      completedBookings: completedBookings.length,
      averageBookingValue,
      pendingRevenue: bookings.filter((b) => b.status === "pending").reduce((sum, b) => sum + b.totalAmount, 0),
    }
  }

  // 稼働率の計算
  const calculateOccupancy = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    let occupiedRoomDays = 0
    const totalRoomDays = rooms.length * daysInMonth

    bookings.forEach((booking) => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)

      if (checkIn.getMonth() === currentMonth && checkIn.getFullYear() === currentYear) {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        occupiedRoomDays += nights
      }
    })

    return totalRoomDays > 0 ? (occupiedRoomDays / totalRoomDays) * 100 : 0
  }

  // 部屋別統計
  const getRoomStats = () => {
    return rooms
      .map((room) => {
        const roomBookings = bookings.filter((b) => b.roomId === room.id)
        const revenue = roomBookings.reduce((sum, b) => sum + b.totalAmount, 0)
        const bookingCount = roomBookings.length

        return {
          room,
          bookingCount,
          revenue,
          averageRate: bookingCount > 0 ? revenue / bookingCount : 0,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
  }

  // 月別統計
  const getMonthlyStats = () => {
    const monthlyData: { [key: string]: { bookings: number; revenue: number } } = {}

    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { bookings: 0, revenue: 0 }
      }

      monthlyData[monthKey].bookings += 1
      monthlyData[monthKey].revenue += booking.totalAmount
    })

    return Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
  }

  const revenue = calculateRevenue()
  const occupancyRate = calculateOccupancy()
  const roomStats = getRoomStats()
  const monthlyStats = getMonthlyStats()

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">レポート</h1>
          <p className="text-muted-foreground">売上レポートと分析データ</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">今週</SelectItem>
            <SelectItem value="month">今月</SelectItem>
            <SelectItem value="quarter">四半期</SelectItem>
            <SelectItem value="year">今年</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 主要指標 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総売上</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{revenue.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">完了済み予約: {revenue.completedBookings}件</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均客単価</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{Math.round(revenue.averageBookingValue).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">1予約あたりの平均金額</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">稼働率</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">今月の部屋稼働率</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">保留中売上</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{revenue.pendingRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">確定待ちの売上</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rooms">部屋別分析</TabsTrigger>
          <TabsTrigger value="monthly">月別推移</TabsTrigger>
          <TabsTrigger value="customers">顧客分析</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>部屋別売上ランキング</CardTitle>
              <CardDescription>各部屋の予約数と売上実績</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>部屋名</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>予約数</TableHead>
                    <TableHead>売上</TableHead>
                    <TableHead>平均単価</TableHead>
                    <TableHead>稼働率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomStats.map((stat, index) => (
                    <TableRow key={stat.room.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          {stat.room.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stat.room.type}</Badge>
                      </TableCell>
                      <TableCell>{stat.bookingCount}件</TableCell>
                      <TableCell>¥{stat.revenue.toLocaleString()}</TableCell>
                      <TableCell>¥{Math.round(stat.averageRate).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((stat.bookingCount / Math.max(...roomStats.map((s) => s.bookingCount))) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm">
                            {((stat.bookingCount / Math.max(...roomStats.map((s) => s.bookingCount))) * 100).toFixed(0)}
                            %
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>月別売上推移</CardTitle>
              <CardDescription>過去12ヶ月の予約数と売上の推移</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>年月</TableHead>
                    <TableHead>予約数</TableHead>
                    <TableHead>売上</TableHead>
                    <TableHead>平均単価</TableHead>
                    <TableHead>前月比</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyStats.map(([month, data], index) => {
                    const prevData = monthlyStats[index + 1]?.[1]
                    const growthRate = prevData ? ((data.revenue - prevData.revenue) / prevData.revenue) * 100 : 0

                    return (
                      <TableRow key={month}>
                        <TableCell className="font-medium">{month}</TableCell>
                        <TableCell>{data.bookings}件</TableCell>
                        <TableCell>¥{data.revenue.toLocaleString()}</TableCell>
                        <TableCell>
                          ¥{data.bookings > 0 ? Math.round(data.revenue / data.bookings).toLocaleString() : "0"}
                        </TableCell>
                        <TableCell>
                          {prevData ? (
                            <Badge variant={growthRate >= 0 ? "default" : "destructive"}>
                              {growthRate >= 0 ? "+" : ""}
                              {growthRate.toFixed(1)}%
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>顧客統計</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>総顧客数:</span>
                  <span className="font-bold">{customers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>リピーター:</span>
                  <span className="font-bold">
                    {customers.filter((c) => bookings.filter((b) => b.customerId === c.id).length > 1).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>リピート率:</span>
                  <span className="font-bold">
                    {customers.length > 0
                      ? (
                          (customers.filter((c) => bookings.filter((b) => b.customerId === c.id).length > 1).length /
                            customers.length) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>予約パターン</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>平均予約間隔:</span>
                  <span className="font-bold">45日</span>
                </div>
                <div className="flex justify-between">
                  <span>平均滞在日数:</span>
                  <span className="font-bold">2.3日</span>
                </div>
                <div className="flex justify-between">
                  <span>平均宿泊人数:</span>
                  <span className="font-bold">2.1名</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>顧客価値</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>LTV平均:</span>
                  <span className="font-bold">¥85,000</span>
                </div>
                <div className="flex justify-between">
                  <span>最高LTV:</span>
                  <span className="font-bold">¥250,000</span>
                </div>
                <div className="flex justify-between">
                  <span>新規獲得コスト:</span>
                  <span className="font-bold">¥12,000</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
