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

export default function NewRatePage() {
  const router = useRouter()
  const [rate, setRate] = useState({
    seasonId: "",
    dayType: "weekday",
    roomType: "shared",
    ageGroup: "adult",
    basePrice: 0,
    isActive: true,
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push("/admin/rates")
    } catch (error) {
      console.error("Error saving rate:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/admin/rates")
  }

  const updateRate = (field: string, value: any) => {
    setRate((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">新規料金追加</h1>
            <p className="text-muted-foreground">新しい料金設定を作成します</p>
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
          <CardTitle>料金設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seasonId">シーズン</Label>
              <Select value={rate.seasonId} onValueChange={(value) => updateRate("seasonId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="シーズンを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">通常期</SelectItem>
                  <SelectItem value="peak-spring">春の繁忙期</SelectItem>
                  <SelectItem value="peak-summer">夏の繁忙期</SelectItem>
                  <SelectItem value="peak-winter">冬の繁忙期</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dayType">曜日タイプ</Label>
              <Select value={rate.dayType} onValueChange={(value) => updateRate("dayType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekday">平日</SelectItem>
                  <SelectItem value="weekend">休日</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="roomType">部屋タイプ</Label>
              <Select value={rate.roomType} onValueChange={(value) => updateRate("roomType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">大部屋・中部屋</SelectItem>
                  <SelectItem value="private">個室</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageGroup">年齢区分</Label>
              <Select value={rate.ageGroup} onValueChange={(value) => updateRate("ageGroup", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adult">大人</SelectItem>
                  <SelectItem value="adult_leader">大人合宿付添</SelectItem>
                  <SelectItem value="student">中高大学生</SelectItem>
                  <SelectItem value="child">小学生</SelectItem>
                  <SelectItem value="infant">未就学児</SelectItem>
                  <SelectItem value="baby">乳幼児</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrice">基本料金</Label>
            <Input
              id="basePrice"
              type="number"
              value={rate.basePrice}
              onChange={(e) => updateRate("basePrice", Number.parseInt(e.target.value) || 0)}
              placeholder="4800"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={rate.isActive}
              onCheckedChange={(checked) => updateRate("isActive", checked)}
            />
            <Label htmlFor="isActive">有効</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
