"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { PlusCircle, Edit, Trash2, Search } from "lucide-react"
import type { Room } from "@/types/room"
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

// 仮の部屋データ
const MOCK_ROOMS: Room[] = [
  {
    roomId: "2f-saho",
    name: "2F作法室",
    floor: "2F",
    capacity: 25,
    roomType: "large",
    roomRate: 20000,
    usageType: "shared",
    isActive: true,
    amenities: ["エアコン", "プロジェクター"],
    description: "大人数での利用に適した部屋",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    roomId: "3f-hifuku",
    name: "3F被服室",
    floor: "3F",
    capacity: 35,
    roomType: "large",
    roomRate: 20000,
    usageType: "shared",
    isActive: true,
    amenities: ["エアコン"],
    description: "最大収容人数の大部屋",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function RoomsAdminPage() {
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS)
  const [searchTerm, setSearchTerm] = useState("")

  const getRoomTypeLabel = (roomType: string) => {
    const labels: Record<string, string> = {
      large: "大部屋",
      medium_a: "中部屋A",
      medium_b: "中部屋B",
      small_a: "個室A",
      small_b: "個室B",
      small_c: "個室C",
    }
    return labels[roomType] || roomType
  }

  const getUsageTypeLabel = (usageType: string) => {
    return usageType === "shared" ? "大部屋・中部屋" : "個室"
  }

  const columns = [
    {
      accessorKey: "roomId",
      header: "部屋ID",
    },
    {
      accessorKey: "name",
      header: "部屋名",
    },
    {
      accessorKey: "floor",
      header: "階",
    },
    {
      accessorKey: "capacity",
      header: "定員",
      cell: ({ row }: any) => `${row.original.capacity}名`,
    },
    {
      accessorKey: "roomType",
      header: "部屋タイプ",
      cell: ({ row }: any) => <Badge variant="outline">{getRoomTypeLabel(row.original.roomType)}</Badge>,
    },
    {
      accessorKey: "usageType",
      header: "利用タイプ",
      cell: ({ row }: any) => <Badge variant="secondary">{getUsageTypeLabel(row.original.usageType)}</Badge>,
    },
    {
      accessorKey: "roomRate",
      header: "室料",
      cell: ({ row }: any) => `¥${row.original.roomRate.toLocaleString()}/泊`,
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
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/rooms/${row.original.roomId}`}>
              <Edit className="h-4 w-4" />
            </Link>
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
          <h2 className="text-xl font-semibold">部屋一覧</h2>
          <p className="text-sm text-muted-foreground">宿泊施設の部屋情報を管理</p>
        </div>
        <Button asChild>
          <Link href="/admin/rooms/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            新規部屋追加
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>部屋一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="部屋名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <DataTable columns={columns} data={rooms} />
        </CardContent>
      </Card>
    </div>
  )
}
