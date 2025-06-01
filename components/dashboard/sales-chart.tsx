"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TrendingUp, BarChart3, Calendar } from "lucide-react"

type ChartType = "sales" | "bookings"
type TimeRange = "daily" | "weekly" | "monthly"

const chartConfig = {
  sales: {
    label: "売上",
    color: "hsl(var(--primary))",
  },
  bookings: {
    label: "予約数",
    color: "hsl(var(--secondary))",
  },
}

export function SalesChart() {
  const { stats, loading } = useDashboardStats()
  const [chartType, setChartType] = useState<ChartType>("sales")
  const [timeRange, setTimeRange] = useState<TimeRange>("daily")

  if (loading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>売上・予約チャート</CardTitle>
          <CardDescription>データを読み込み中...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  const formatData = () => {
    if (timeRange === "daily") {
      return stats.salesChartData.map(item => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('ja-JP', { 
          month: 'short', 
          day: 'numeric' 
        })
      }))
    }
    
    // For weekly/monthly aggregation
    if (timeRange === "weekly") {
      const weeklyData: Record<string, { sales: number; bookings: number; date: string }> = {}
      
      stats.salesChartData.forEach(item => {
        const date = new Date(item.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { sales: 0, bookings: 0, date: weekKey }
        }
        weeklyData[weekKey].sales += item.sales
        weeklyData[weekKey].bookings += item.bookings
      })
      
      return Object.values(weeklyData).map(item => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('ja-JP', { 
          month: 'short', 
          day: 'numeric' 
        }) + '週'
      }))
    }
    
    // Monthly aggregation
    const monthlyData: Record<string, { sales: number; bookings: number; date: string }> = {}
    
    stats.salesChartData.forEach(item => {
      const date = new Date(item.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { sales: 0, bookings: 0, date: monthKey }
      }
      monthlyData[monthKey].sales += item.sales
      monthlyData[monthKey].bookings += item.bookings
    })
    
    return Object.values(monthlyData).map(item => ({
      ...item,
      displayDate: new Date(item.date + '-01').toLocaleDateString('ja-JP', { 
        year: 'numeric',
        month: 'short'
      })
    }))
  }

  const chartData = formatData()
  const dataKey = chartType === "sales" ? "sales" : "bookings"
  
  const formatValue = (value: number) => {
    const safeValue = value || 0
    if (chartType === "sales") {
      return `¥${safeValue.toLocaleString()}`
    }
    return `${safeValue}件`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl">売上・予約チャート</CardTitle>
            <CardDescription className="text-sm">
              {chartType === "sales" ? "売上" : "予約数"}の推移 ({timeRange === "daily" ? "日別" : timeRange === "weekly" ? "週別" : "月別"})
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex rounded-md border">
              <Button
                variant={chartType === "sales" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("sales")}
                className="rounded-r-none text-xs sm:text-sm"
              >
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                売上
              </Button>
              <Button
                variant={chartType === "bookings" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("bookings")}
                className="rounded-l-none text-xs sm:text-sm"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                予約
              </Button>
            </div>
            <div className="flex rounded-md border">
              <Button
                variant={timeRange === "daily" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange("daily")}
                className="rounded-r-none rounded-l-md text-xs sm:text-sm"
              >
                日
              </Button>
              <Button
                variant={timeRange === "weekly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange("weekly")}
                className="rounded-none text-xs sm:text-sm"
              >
                週
              </Button>
              <Button
                variant={timeRange === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange("monthly")}
                className="rounded-l-none rounded-r-md text-xs sm:text-sm"
              >
                月
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px]">
          {chartType === "sales" ? (
            <AreaChart data={chartData}>
              <XAxis dataKey="displayDate" />
              <YAxis tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`} />
              <ChartTooltip
                content={<ChartTooltipContent 
                  formatter={(value) => [formatValue(Number(value)), "売上"]}
                />}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="var(--color-sales)"
                fill="var(--color-sales)"
                fillOpacity={0.6}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData}>
              <XAxis dataKey="displayDate" />
              <YAxis />
              <ChartTooltip
                content={<ChartTooltipContent 
                  formatter={(value) => [formatValue(Number(value)), "予約数"]}
                />}
              />
              <Bar
                dataKey={dataKey}
                fill="var(--color-bookings)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}