"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { PlusCircle, Edit, Trash2, Search } from "lucide-react"
import type { Season } from "@/types/pricing"
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

// 仮のシーズンデータ
const MOCK_SEASONS: Season[] = [
  {
    seasonId: "peak-spring",
    name: "春の繁忙期",
    seasonType: "peak",
    startDate: new Date(2024, 2, 1),
    endDate: new Date(2024, 4, 31),
    roomRateMultiplier: 1.0,
    paxRateMultiplier: 1.15,
    isActive: true,
    createdAt: new Date(),
  },
]

export default function SeasonsAdminPage() {
  const [seasons, setSeasons] = useState<Season[]>(MOCK_SEASONS)
  const [searchTerm, setSearchTerm] = useState("")

  const getSeasonTypeLabel = (seasonType: string) => {
    const labels: Record<string, string> = {
      peak: "繁忙期",
      on: "通常期",
      off: "閑散期",
    }
    return labels[seasonType] || seasonType
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", { month: "long", day: "numeric" })
  }

  const columns = [
    {
      accessorKey: "seasonId",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "シーズン名",
    },
    {
      accessorKey: "seasonType",
      header: "タイプ",
      cell: ({ row }: any) => (
        <Badge variant={row.original.seasonType === "peak" ? "default" : "secondary"}>
          {getSeasonTypeLabel(row.original.seasonType)}
        </Badge>
      ),
    },
    {
      accessorKey: "period",
      header: "期間",
      cell: ({ row }: any) => (
        <span className="text-sm">
          {formatDate(row.original.startDate)} ～ {formatDate(row.original.endDate)}
        </span>
      ),
    },
    {
      accessorKey: "roomRateMultiplier",
      header: "室料係数",
      cell: ({ row }: any) => `×${row.original.roomRateMultiplier}`,
    },
    {
      accessorKey: "paxRateMultiplier",
      header: "個人料金係数",
      cell: ({ row }: any) => `×${row.original.paxRateMultiplier}`,
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
          <h2 className="text-xl font-semibold">シーズン一覧</h2>
          <p className="text-sm text-muted-foreground">繁忙期・閑散期の料金係数設定</p>
        </div>
        <Button asChild>
          <Link href="/admin/seasons/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            新規シーズン追加
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>シーズン一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="シーズン名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <DataTable columns={columns} data={seasons} />
        </CardContent>
      </Card>
    </div>
  )
}
