"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, X } from "lucide-react"

export default function NewSeasonPage() {
  const router = useRouter()
  const [season, setSeason] = useState({
    seasonId: "",
    name: "",
    seasonType: "peak",
    startDate: "",
    endDate: "",
    roomRateMultiplier: 1.0,
    paxRateMultiplier: 1.0,
    isActive: true,
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push("/admin/seasons")
    } catch (error) {
      console.error("Error saving season:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/admin/seasons")
  }

  const updateSeason = (field: string, value: any) => {
    setSeason((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">新規シーズン追加</h1>
            <p className="text-muted-foreground">新しいシーズン設定を作成します</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>シーズン設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seasonId">シーズンID</Label>
              <Input
                id="seasonId"
                value={season.seasonId}
                onChange={(e) => updateSeason("seasonId", e.target.value)}
                placeholder="peak-spring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">シーズン名</Label>
              <Input
                id="name"
                value={season.name}
                onChange={(e) => updateSeason("name", e.target.value)}
                placeholder="春の繁忙期"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seasonType">シーズンタイプ</Label>
            <Select value={season.seasonType} onValueChange={(value) => updateSeason("seasonType", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="peak">繁忙期</SelectItem>
                <SelectItem value="on">通常期</SelectItem>
                <SelectItem value="off">閑散期</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">開始日</Label>
              <Input
                id="startDate"
                type="date"
                value={season.startDate}
                onChange={(e) => updateSeason("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">終了日</Label>
              <Input
                id="endDate"
                type="date"
                value={season.endDate}
                onChange={(e) => updateSeason("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="roomRateMultiplier">室料係数</Label>
              <Input
                id="roomRateMultiplier"
                type="number"
                step="0.1"
                value={season.roomRateMultiplier}
                onChange={(e) => updateSeason("roomRateMultiplier", Number.parseFloat(e.target.value) || 1.0)}
                placeholder="1.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paxRateMultiplier">個人料金係数</Label>
              <Input
                id="paxRateMultiplier"
                type="number"
                step="0.1"
                value={season.paxRateMultiplier}
                onChange={(e) => updateSeason("paxRateMultiplier", Number.parseFloat(e.target.value) || 1.0)}
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={season.isActive}
              onCheckedChange={(checked) => updateSeason("isActive", checked)}
            />
            <Label htmlFor="isActive">有効</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
