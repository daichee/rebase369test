"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react"

interface Room {
  id: string
  name: string
  floor: string
  capacity: number
  basePrice: number
  facilities: string[]
  description?: string
  isActive: boolean
}

export function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState<Partial<Room>>({
    name: "",
    floor: "2F",
    capacity: 1,
    basePrice: 0,
    facilities: [],
    description: "",
    isActive: true,
  })
  
  const supabase = createClient()

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("floor", { ascending: true })
        .order("name", { ascending: true })

      if (error) throw error
      setRooms(data || [])
    } catch (err) {
      setError("部屋データの取得に失敗しました")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update({
            name: formData.name,
            floor: formData.floor,
            capacity: formData.capacity,
            base_price: formData.basePrice,
            facilities: formData.facilities,
            description: formData.description,
            is_active: formData.isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingRoom.id)
          
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("rooms")
          .insert({
            name: formData.name,
            floor: formData.floor,
            capacity: formData.capacity,
            base_price: formData.basePrice,
            facilities: formData.facilities,
            description: formData.description,
            is_active: formData.isActive,
          })
          
        if (error) throw error
      }
      
      await fetchRooms()
      setDialogOpen(false)
      setEditingRoom(null)
      setFormData({
        name: "",
        floor: "2F",
        capacity: 1,
        basePrice: 0,
        facilities: [],
        description: "",
        isActive: true,
      })
    } catch (err) {
      setError("部屋データの保存に失敗しました")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      floor: room.floor,
      capacity: room.capacity,
      basePrice: room.basePrice,
      facilities: room.facilities,
      description: room.description,
      isActive: room.isActive,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (roomId: string) => {
    if (!confirm("この部屋を削除しますか？")) return
    
    try {
      setLoading(true)
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId)
        
      if (error) throw error
      await fetchRooms()
    } catch (err) {
      setError("部屋の削除に失敗しました")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">部屋データを読み込み中...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>部屋管理</CardTitle>
            <CardDescription>宿泊施設の部屋情報を管理します</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRoom(null)
                setFormData({
                  name: "",
                  floor: "2F",
                  capacity: 1,
                  basePrice: 0,
                  facilities: [],
                  description: "",
                  isActive: true,
                })
              }}>
                <Plus className="mr-2 h-4 w-4" />
                新規追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRoom ? "部屋編集" : "新規部屋追加"}</DialogTitle>
                <DialogDescription>
                  部屋の基本情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">部屋名</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="1年1組"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="floor">フロア</Label>
                    <Select value={formData.floor} onValueChange={(value) => setFormData({ ...formData, floor: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2F">2F</SelectItem>
                        <SelectItem value="3F">3F</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity">定員</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="basePrice">基本料金（円）</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="部屋の特徴や設備について"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingRoom ? "更新" : "追加"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>部屋名</TableHead>
              <TableHead>フロア</TableHead>
              <TableHead>定員</TableHead>
              <TableHead>基本料金</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell>{room.floor}</TableCell>
                <TableCell>{room.capacity}名</TableCell>
                <TableCell>¥{room.basePrice?.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    room.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {room.isActive ? "有効" : "無効"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(room)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(room.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}