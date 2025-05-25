"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Search } from "lucide-react"

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

// 仮のデータ
const bookings = [
  {
    id: "1",
    guestName: "山田太郎",
    startDate: "2023-06-01",
    endDate: "2023-06-03",
    nights: 2,
    paxTotal: 5,
    status: "confirmed",
    totalAmount: 125000,
  },
  {
    id: "2",
    guestName: "鈴木一郎",
    startDate: "2023-06-10",
    endDate: "2023-06-12",
    nights: 2,
    paxTotal: 10,
    status: "draft",
    totalAmount: 230000,
  },
  {
    id: "3",
    guestName: "佐藤花子",
    startDate: "2023-06-15",
    endDate: "2023-06-16",
    nights: 1,
    paxTotal: 3,
    status: "confirmed",
    totalAmount: 45000,
  },
]

// ステータスバッジ
const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    confirmed: { label: "確定", variant: "default" },
    draft: { label: "下書き", variant: "secondary" },
    cancelled: { label: "キャンセル", variant: "destructive" },
  }

  const { label, variant } = statusMap[status] || { label: status, variant: "secondary" }

  return <Badge variant={variant}>{label}</Badge>
}

export default function BookingPage() {
  const [searchTerm, setSearchTerm] = useState("")

  // 列定義
  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }: any) => (
        <Link href={`/booking/${row.original.id}`} className="text-primary hover:underline">
          #{row.original.id}
        </Link>
      ),
    },
    {
      accessorKey: "guestName",
      header: "顧客名",
    },
    {
      accessorKey: "startDate",
      header: "チェックイン",
      cell: ({ row }: any) => new Date(row.original.startDate).toLocaleDateString("ja-JP"),
    },
    {
      accessorKey: "endDate",
      header: "チェックアウト",
      cell: ({ row }: any) => new Date(row.original.endDate).toLocaleDateString("ja-JP"),
    },
    {
      accessorKey: "nights",
      header: "泊数",
    },
    {
      accessorKey: "paxTotal",
      header: "人数",
    },
    {
      accessorKey: "status",
      header: "ステータス",
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "totalAmount",
      header: "合計金額",
      cell: ({ row }: any) => `¥${row.original.totalAmount.toLocaleString()}`,
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }: any) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/booking/${row.original.id}`}>詳細</Link>
        </Button>
      ),
    },
  ]

  return (
    <div className="container p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">予約一覧</h1>
          <p className="text-muted-foreground">すべての予約を管理</p>
        </div>
        <Button asChild>
          <Link href="/booking/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            新規予約
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>予約リスト</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="顧客名、予約IDで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <DataTable columns={columns} data={bookings} />
        </CardContent>
      </Card>
    </div>
  )
}
