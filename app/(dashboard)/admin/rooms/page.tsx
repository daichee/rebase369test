"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { useRoomStore } from "@/store/room-store"

export default function RoomsAdminPage() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useRoomStore()
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [newRoomForm, setNewRoomForm] = useState({
    name: "",
    type: "double" as const,
    capacity: 2,
    basePrice: 15000,
    amenities: [] as string[],
    description: "",
    isActive: true,
  })

  const roomTypes = [
    { value: "single", label: "シングル" },
    { value: "double", label: "ダブル" },
    { value: "suite", label: "スイート" },
    { value: "family", label: "ファミリー" },
  ]

  const amenityOptions = [
    "WiFi",
    "エアコン",
    "テレビ",
    "バスルーム",
    "キッチン",
    "バルコニー",
    "冷蔵庫",
    "電子レンジ",
    "洗濯機",
    "駐車場",
  ]

  const handleEdit = (room: any) => {
    setIsEditing(room.id)
    setEditForm(room)
  }

  const handleSave = () => {
    if (isEditing) {
      updateRoom(isEditing, editForm)
      setIsEditing(null)
      setEditForm({})
    }
  }

  const handleCancel = () => {
    setIsEditing(null)
    setEditForm({})
  }

  const handleDelete = (roomId: string) => {
    if (confirm("この部屋を削除してもよろしいですか？")) {
      deleteRoom(roomId)
    }
  }

  const handleAddRoom = () => {
    const newRoom = {
      ...newRoomForm,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addRoom(newRoom)
    setNewRoomForm({
      name: "",
      type: "double",
      capacity: 2,
      basePrice: 15000,
      amenities: [],
      description: "",
      isActive: true,
    })
    setIsAdding(false)
  }

  const toggleAmenity = (amenity: string, isNew = false) => {
    if (isNew) {
      setNewRoomForm((prev) => ({
        ...prev,
        amenities: prev.amenities.includes(amenity)
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      }))
    } else {
      setEditForm((prev: any) => ({
        ...prev,
        amenities: prev.amenities.includes(amenity)
          ? prev.amenities.filter((a: string) => a !== amenity)
          : [...prev.amenities, amenity],
      }))
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">部屋管理</h1>
          <p className="text-muted-foreground">部屋の追加、編集、削除を行います</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="mr-2 h-4 w-4" />
          新規部屋追加
        </Button>
      </div>

      {/* 新規部屋追加フォーム */}
      {isAdding && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>新規部屋追加</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>部屋名</Label>
                <Input
                  value={newRoomForm.name}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, name: e.target.value })}
                  placeholder="スタンダードルーム A"
                />
              </div>
              <div className="space-y-2">
                <Label>部屋タイプ</Label>
                <Select
                  value={newRoomForm.type}
                  onValueChange={(value: any) => setNewRoomForm({ ...newRoomForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>定員</Label>
                <Select
                  value={newRoomForm.capacity.toString()}
                  onValueChange={(value) => setNewRoomForm({ ...newRoomForm, capacity: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}名
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>基本料金</Label>
                <Input
                  type="number"
                  value={newRoomForm.basePrice}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, basePrice: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>設備・アメニティ</Label>
              <div className="grid grid-cols-5 gap-2">
                {amenityOptions.map((amenity) => (
                  <Button
                    key={amenity}
                    variant={newRoomForm.amenities.includes(amenity) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAmenity(amenity, true)}
                  >
                    {amenity}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>説明</Label>
              <Input
                value={newRoomForm.description}
                onChange={(e) => setNewRoomForm({ ...newRoomForm, description: e.target.value })}
                placeholder="部屋の説明"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddRoom}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                <X className="mr-2 h-4 w-4" />
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 部屋一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>部屋一覧</CardTitle>
          <CardDescription>{rooms.length}件の部屋が登録されています</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部屋名</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>定員</TableHead>
                <TableHead>基本料金</TableHead>
                <TableHead>設備</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    {isEditing === room.id ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      room.name
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing === room.id ? (
                      <Select
                        value={editForm.type}
                        onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      roomTypes.find((t) => t.value === room.type)?.label
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing === room.id ? (
                      <Select
                        value={editForm.capacity.toString()}
                        onValueChange={(value) => setEditForm({ ...editForm, capacity: Number.parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}名
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      `${room.capacity}名`
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing === room.id ? (
                      <Input
                        type="number"
                        value={editForm.basePrice}
                        onChange={(e) => setEditForm({ ...editForm, basePrice: Number.parseInt(e.target.value) })}
                      />
                    ) : (
                      `¥${room.basePrice.toLocaleString()}`
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing === room.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-1">
                          {amenityOptions.map((amenity) => (
                            <Button
                              key={amenity}
                              variant={editForm.amenities?.includes(amenity) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleAmenity(amenity)}
                              className="text-xs"
                            >
                              {amenity}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {room.amenities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{room.amenities.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={room.isActive ? "default" : "secondary"}>
                      {room.isActive ? "アクティブ" : "非アクティブ"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isEditing === room.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(room)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(room.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
