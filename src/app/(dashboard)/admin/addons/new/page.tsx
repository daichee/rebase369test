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

export default function NewAddonPage() {
  const router = useRouter()
  const [addon, setAddon] = useState({
    addonId: "",
    category: "meal",
    name: "",
    unit: "食",
    adultFee: 0,
    studentFee: 0,
    childFee: 0,
    infantFee: 0,
    minQuantity: 1,
    isActive: true,
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push("/admin/addons")
    } catch (error) {
      console.error("Error saving addon:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/admin/addons")
  }

  const updateAddon = (field: string, value: any) => {
    setAddon((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">新規オプション追加</h1>
            <p className="text-muted-foreground">新しいオプションを作成します</p>
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
          <CardTitle>オプション設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addonId">オプションID</Label>
              <Input
                id="addonId"
                value={addon.addonId}
                onChange={(e) => updateAddon("addonId", e.target.value)}
                placeholder="breakfast"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">オプション名</Label>
              <Input
                id="name"
                value={addon.name}
                onChange={(e) => updateAddon("name", e.target.value)}
                placeholder="朝食"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">カテゴリ</Label>
              <Select value={addon.category} onValueChange={(value) => updateAddon("category", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meal">食事</SelectItem>
                  <SelectItem value="facility">施設利用</SelectItem>
                  <SelectItem value="equipment">備品</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">単位</Label>
              <Input
                id="unit"
                value={addon.unit}
                onChange={(e) => updateAddon("unit", e.target.value)}
                placeholder="食"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">年齢別料金</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adultFee">大人料金</Label>
                <Input
                  id="adultFee"
                  type="number"
                  value={addon.adultFee}
                  onChange={(e) => updateAddon("adultFee", Number.parseInt(e.target.value) || 0)}
                  placeholder="700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentFee">学生料金</Label>
                <Input
                  id="studentFee"
                  type="number"
                  value={addon.studentFee}
                  onChange={(e) => updateAddon("studentFee", Number.parseInt(e.target.value) || 0)}
                  placeholder="700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="childFee">小学生料金</Label>
                <Input
                  id="childFee"
                  type="number"
                  value={addon.childFee}
                  onChange={(e) => updateAddon("childFee", Number.parseInt(e.target.value) || 0)}
                  placeholder="700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="infantFee">未就学児料金</Label>
                <Input
                  id="infantFee"
                  type="number"
                  value={addon.infantFee}
                  onChange={(e) => updateAddon("infantFee", Number.parseInt(e.target.value) || 0)}
                  placeholder="700"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minQuantity">最小数量</Label>
            <Input
              id="minQuantity"
              type="number"
              value={addon.minQuantity}
              onChange={(e) => updateAddon("minQuantity", Number.parseInt(e.target.value) || 1)}
              placeholder="1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={addon.isActive}
              onCheckedChange={(checked) => updateAddon("isActive", checked)}
            />
            <Label htmlFor="isActive">有効</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
