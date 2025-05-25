"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, X } from "lucide-react"

export default function NewRoomPage() {
  const router = useRouter()
  const [room, setRoom] = useState({
    roomId: "",
    name: "",
    floor: "",
    capacity: 0,
    roomType: "large",
    roomRate: 0,
    usageType: "shared",
    isActive: true,
    amenities: [] as string[],
    description: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push("/admin/rooms")
    } catch (error) {
      console.error("Error saving room:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/admin/rooms")
  }

  const updateRoom = (field: string, value: any) => {
    setRoom((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">新規部屋追加</h1>
            <p className="text-muted-foreground">新しい部屋を作成します</p>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomId">部屋ID</Label>
              <Input
                id="roomId"
                value={room.roomId}
                onChange={(e) => updateRoom("roomId", e.target.value)}
                placeholder="2f-saho"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">部屋名</Label>
              <Input
                id="name"
                value={room.name}
                onChange={(e) => updateRoom("name", e.target.value)}
                placeholder="2F作法室"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="floor">階</Label>
                <Input
                  id="floor"
                  value={room.floor}
                  onChange={(e) => updateRoom("floor", e.target.value)}
                  placeholder="2F"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">定員</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={room.capacity}
                  onChange={(e) => updateRoom("capacity", Number.parseInt(e.target.value) || 0)}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomType">部屋タイプ</Label>
              <Select value={room.roomType} onValueChange={(value) => updateRoom("roomType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="large">大部屋</SelectItem>
                  <SelectItem value="medium_a">中部屋A</SelectItem>
                  <SelectItem value="medium_b">中部屋B</SelectItem>
                  <SelectItem value="small_a">個室A</SelectItem>
                  <SelectItem value="small_b">個室B</SelectItem>
                  <SelectItem value="small_c">個室C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageType">利用タイプ</Label>
              <Select value={room.usageType} onValueChange={(value) => updateRoom("usageType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">大部屋・中部屋</SelectItem>
                  <SelectItem value="private">個室</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>料金・設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomRate">室料（1泊）</Label>
              <Input
                id="roomRate"
                type="number"
                value={room.roomRate}
                onChange={(e) => updateRoom("roomRate", Number.parseInt(e.target.value) || 0)}
                placeholder="20000"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={room.isActive}
                onCheckedChange={(checked) => updateRoom("isActive", checked)}
              />
              <Label htmlFor="isActive">有効</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={room.description}
                onChange={(e) => updateRoom("description", e.target.value)}
                placeholder="部屋の説明を入力してください"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>設備・備品</Label>
              <div className="space-y-2">
                {["エアコン", "プロジェクター", "ホワイトボード", "Wi-Fi"].map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={room.amenities.includes(amenity)}
                      onChange={(e) => {
                        const newAmenities = e.target.checked
                          ? [...room.amenities, amenity]
                          : room.amenities.filter((a) => a !== amenity)
                        updateRoom("amenities", newAmenities)
                      }}
                    />
                    <span className="text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
