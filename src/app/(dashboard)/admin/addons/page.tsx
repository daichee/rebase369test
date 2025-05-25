"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { PlusCircle, Edit, Trash2, Search } from "lucide-react"
import type { Addon } from "@/types/pricing"
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

// 仮のオプションデータ
const MOCK_ADDONS: Addon[] = [
  {
    addonId: "breakfast",
    category: "meal",
    name: "朝食",
    unit: "食",
    adultFee: 700,
    studentFee: 700,
    childFee: 700,
    infantFee: 700,
    personalFee5h: 0,
    personalFee10h: 0,
    personalFeeOver: 0,
    roomFeeWeekdayGuest: 0,
    roomFeeWeekdayOther: 0,
    roomFeeWeekendGuest: 0,
    roomFeeWeekendOther: 0,
    airconFeePerHour: 0,
    minQuantity: 1,
    isActive: true,
    createdAt: new Date(),
  },
]

export default function AddonsAdminPage() {
  const [addons, setAddons] = useState<Addon[]>(MOCK_ADDONS)
  const [searchTerm, setSearchTerm] = useState("")

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      meal: "食事",
      facility: "施設利用",
      equipment: "備品",
    }
    return labels[category] || category
  }

  const columns = [
    {
      accessorKey: "addonId",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "名前",
    },
    {
      accessorKey: "category",
      header: "カテゴリ",
      cell: ({ row }: any) => <Badge variant="outline">{getCategoryLabel(row.original.category)}</Badge>,
    },
    {
      accessorKey: "unit",
      header: "単位",
    },
    {
      accessorKey: "adultFee",
      header: "大人料金",
      cell: ({ row }: any) => {
        const addon = row.original
        if (addon.category === "meal") {
          return `¥${addon.adultFee.toLocaleString()}`
        } else if (addon.category === "facility") {
          return `¥${addon.personalFee5h.toLocaleString()}～`
        } else {
          return `¥${addon.roomFeeWeekdayGuest.toLocaleString()}`
        }
      },
    },
    {
      accessorKey: "minQuantity",
      header: "最小数量",
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
          <h2 className="text-xl font-semibold">オプション一覧</h2>
          <p className="text-sm text-muted-foreground">食事・施設利用・備品などのオプション設定</p>
        </div>
        <Button asChild>
          <Link href="/admin/addons/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            新規オプション追加
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>オプション一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="オプション名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <DataTable columns={columns} data={addons} />
        </CardContent>
      </Card>
    </div>
  )
}
