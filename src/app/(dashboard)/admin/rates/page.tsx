"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import type { Rate } from "@/types/pricing"
import Link from "next/link"

// Simple inline DataTable component
function DataTable({ columns, data }: { columns: any[]; data: any[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{typeof column.header === "string" ? column.header : "Header"}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    {column.cell ? column.cell({ row: { original: row } }) : row[column.accessorKey]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                データがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// 仮の料金データ
const MOCK_RATES: Rate[] = [
  {
    rateId: 1,
    seasonId: "regular",
    dayType: "weekday",
    roomType: "shared",
    ageGroup: "adult",
    basePrice: 4800,
    isActive: true,
    createdAt: new Date(),
  },
  {
    rateId: 2,
    seasonId: "regular",
    dayType: "weekend",
    roomType: "shared",
    ageGroup: "adult",
    basePrice: 5856,
    isActive: true,
    createdAt: new Date(),
  },
]

export default function RatesAdminPage() {
  const [rates, setRates] = useState<Rate[]>(MOCK_RATES)

  const getSeasonLabel = (seasonId: string | null) => {
    const labels: Record<string, string> = {
      regular: "通常期",
      peak: "繁忙期",
    }
    return seasonId ? labels[seasonId] || seasonId : "全期間"
  }

  const getDayTypeLabel = (dayType: string) => {
    const labels: Record<string, string> = {
      weekday: "平日",
      weekend: "休日",
    }
    return labels[dayType] || dayType
  }

  const getRoomTypeLabel = (roomType: string) => {
    const labels: Record<string, string> = {
      shared: "大部屋・中部屋",
      private: "個室",
    }
    return labels[roomType] || roomType
  }

  const getAgeGroupLabel = (ageGroup: string) => {
    const labels: Record<string, string> = {
      adult: "大人",
      adult_leader: "大人合宿付添",
      student: "中高大学生",
      child: "小学生",
      infant: "未就学児",
      baby: "乳幼児",
    }
    return labels[ageGroup] || ageGroup
  }

  const columns = [
    {
      accessorKey: "rateId",
      header: "ID",
    },
    {
      accessorKey: "seasonId",
      header: "シーズン",
      cell: ({ row }: any) => <Badge variant="outline">{getSeasonLabel(row.original.seasonId)}</Badge>,
    },
    {
      accessorKey: "dayType",
      header: "曜日",
      cell: ({ row }: any) => <Badge variant="secondary">{getDayTypeLabel(row.original.dayType)}</Badge>,
    },
    {
      accessorKey: "roomType",
      header: "部屋タイプ",
      cell: ({ row }: any) => getRoomTypeLabel(row.original.roomType),
    },
    {
      accessorKey: "ageGroup",
      header: "年齢区分",
      cell: ({ row }: any) => getAgeGroupLabel(row.original.ageGroup),
    },
    {
      accessorKey: "basePrice",
      header: "基本料金",
      cell: ({ row }: any) => `¥${row.original.basePrice.toLocaleString()}`,
    },
    {
      accessorKey: "isActive",
      header: "状態",
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "有効" : "無効"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">料金一覧</h2>
          <p className="text-sm text-muted-foreground">年齢区分・シーズン・曜日別の料金設定</p>
        </div>
        <Button asChild>
          <Link href="/admin/rates/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            新規料金追加
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>料金一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={rates} />
        </CardContent>
      </Card>
    </div>
  )
}
