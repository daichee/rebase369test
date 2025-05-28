"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Calendar } from "lucide-react"
import type { SeasonPeriod } from "@/lib/pricing/types"

const DEFAULT_SEASONS: SeasonPeriod[] = [
  {
    periodId: "spring_season",
    name: "春シーズン",
    type: "on_season",
    startDate: "03-01",
    endDate: "03-31",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    periodId: "early_summer_season",
    name: "初夏シーズン",
    type: "on_season", 
    startDate: "04-01",
    endDate: "04-30",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    periodId: "gw_season",
    name: "GWシーズン(GW含む)",
    type: "on_season",
    startDate: "05-01", 
    endDate: "05-10",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    periodId: "summer_season", 
    name: "夏シーズン",
    type: "on_season",
    startDate: "07-01",
    endDate: "08-31",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    periodId: "autumn_season",
    name: "秋シーズン", 
    type: "on_season",
    startDate: "09-01",
    endDate: "09-30",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    periodId: "winter_season",
    name: "冬シーズン",
    type: "on_season",
    startDate: "12-01", 
    endDate: "12-31",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
]

export function SeasonPeriodManager() {
  const [seasons, setSeasons] = useState<SeasonPeriod[]>(DEFAULT_SEASONS)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<SeasonPeriod | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "on_season" as "off_season" | "on_season",
    startDate: "",
    endDate: "",
    isActive: true
  })

  const formatDateForDisplay = (dateString: string) => {
    const [month, day] = dateString.split('-')
    return `${month}月${day}日`
  }

  const formatDateForInput = (dateString: string) => {
    return dateString
  }

  const handleEdit = (season: SeasonPeriod) => {
    setEditingSeason(season)
    setFormData({
      name: season.name,
      type: season.type,
      startDate: season.startDate,
      endDate: season.endDate,
      isActive: season.isActive
    })
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingSeason(null)
    setFormData({
      name: "",
      type: "on_season",
      startDate: "",
      endDate: "",
      isActive: true
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) return

    const now = new Date().toISOString()
    
    if (editingSeason) {
      // 編集
      setSeasons(seasons.map(season => 
        season.periodId === editingSeason.periodId 
          ? { ...season, ...formData, updatedAt: now }
          : season
      ))
    } else {
      // 新規追加
      const newSeason: SeasonPeriod = {
        periodId: `season_${Date.now()}`,
        ...formData,
        createdAt: now,
        updatedAt: now
      }
      setSeasons([...seasons, newSeason])
    }

    setIsDialogOpen(false)
    setEditingSeason(null)
  }

  const handleDelete = (periodId: string) => {
    setSeasons(seasons.filter(season => season.periodId !== periodId))
  }

  const toggleActive = (periodId: string) => {
    const now = new Date().toISOString()
    setSeasons(seasons.map(season => 
      season.periodId === periodId 
        ? { ...season, isActive: !season.isActive, updatedAt: now }
        : season
    ))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                季節期間設定
              </CardTitle>
              <CardDescription>
                オンシーズンの期間を設定します。設定されていない期間は自動的にオフシーズンとして扱われます。
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              期間追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>期間名</TableHead>
                <TableHead>シーズンタイプ</TableHead>
                <TableHead>開始日</TableHead>
                <TableHead>終了日</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasons.map((season) => (
                <TableRow key={season.periodId}>
                  <TableCell className="font-medium">{season.name}</TableCell>
                  <TableCell>
                    <Badge variant={season.type === "on_season" ? "default" : "secondary"}>
                      {season.type === "on_season" ? "オンシーズン" : "オフシーズン"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateForDisplay(season.startDate)}</TableCell>
                  <TableCell>{formatDateForDisplay(season.endDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={season.isActive}
                        onCheckedChange={() => toggleActive(season.periodId)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {season.isActive ? "有効" : "無効"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(season)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(season.periodId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              <strong>注意:</strong> 期間が重複する場合は、より早く設定された期間が優先されます。
              オフシーズンの期間を明示的に設定する必要はありません。
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingSeason ? "季節期間編集" : "季節期間追加"}
            </DialogTitle>
            <DialogDescription>
              季節期間の詳細を設定してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                期間名
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                placeholder="例: 春シーズン(GW含む)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                タイプ
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as "off_season" | "on_season" })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_season">オンシーズン</SelectItem>
                  <SelectItem value="off_season">オフシーズン</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                開始日
              </Label>
              <Input
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="col-span-3"
                placeholder="MM-DD (例: 03-01)"
                pattern="[0-9]{2}-[0-9]{2}"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                終了日
              </Label>
              <Input
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="col-span-3"
                placeholder="MM-DD (例: 05-10)"
                pattern="[0-9]{2}-[0-9]{2}"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                有効
              </Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSave}>
              {editingSeason ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}