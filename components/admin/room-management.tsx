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
  room_id: string
  name: string
  floor: string
  capacity: number
  room_type: "large" | "medium_a" | "medium_b" | "small_a" | "small_b" | "small_c"
  room_rate: number
  usage_type: "shared" | "private"
  amenities: string[]
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState<Partial<Room>>({
    room_id: "",
    name: "",
    floor: "2F",
    capacity: 5,
    room_type: "small_a",
    room_rate: 5000,
    usage_type: "private",
    amenities: [],
    description: "",
    is_active: true,
  })

  const roomTypeOptions = [
    { value: "large", label: "大部屋 (25-35名)", capacities: [25, 35], defaultRate: 20000 },
    { value: "medium_a", label: "中部屋A (21名)", capacities: [21], defaultRate: 13000 },
    { value: "medium_b", label: "中部屋B (10名)", capacities: [10], defaultRate: 8000 },
    { value: "small_a", label: "個室A (5名)", capacities: [5], defaultRate: 7000 },
    { value: "small_b", label: "個室B (10名)", capacities: [10], defaultRate: 6000 },
    { value: "small_c", label: "個室C (5名)", capacities: [5], defaultRate: 5000 },
  ]

  const floorRoomCounts = {
    "2F": { total: 5, occupied: rooms.filter(r => r.floor === "2F").length },
    "3F": { total: 8, occupied: rooms.filter(r => r.floor === "3F").length }
  }
  
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
        .order("room_id", { ascending: true })

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
            room_type: formData.room_type,
            room_rate: formData.room_rate,
            usage_type: formData.usage_type,
            amenities: formData.amenities,
            description: formData.description,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("room_id", editingRoom.room_id)
          
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("rooms")
          .insert({
            room_id: formData.room_id,
            name: formData.name,
            floor: formData.floor,
            capacity: formData.capacity,
            room_type: formData.room_type,
            room_rate: formData.room_rate,
            usage_type: formData.usage_type,
            amenities: formData.amenities,
            description: formData.description,
            is_active: formData.is_active,
          })
          
        if (error) throw error
      }
      
      await fetchRooms()
      setDialogOpen(false)
      setEditingRoom(null)
      setFormData({
        room_id: "",
        name: "",
        floor: "2F",
        capacity: 5,
        room_type: "small_a",
        room_rate: 5000,
        usage_type: "private",
        amenities: [],
        description: "",
        is_active: true,
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
      room_id: room.room_id,
      name: room.name,
      floor: room.floor,
      capacity: room.capacity,
      room_type: room.room_type,
      room_rate: room.room_rate,
      usage_type: room.usage_type,
      amenities: room.amenities,
      description: room.description,
      is_active: room.is_active,
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
        .eq("room_id", roomId)
        
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
            <CardDescription>
              13部屋のマスタデータを管理 (2F: {floorRoomCounts["2F"].total}室, 3F: {floorRoomCounts["3F"].total}室)
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRoom(null)
                setFormData({
                  room_id: "",
                  name: "",
                  floor: "2F",
                  capacity: 5,
                  room_type: "small_a",
                  room_rate: 5000,
                  usage_type: "private",
                  amenities: [],
                  description: "",
                  is_active: true,
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="room_id">部屋ID</Label>
                    <Input
                      id="room_id"
                      value={formData.room_id}
                      onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                      placeholder="R201"
                      disabled={!!editingRoom}
                      required
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="floor">フロア</Label>
                    <Select 
                      value={formData.floor} 
                      onValueChange={(value) => setFormData({ ...formData, floor: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2F">2F ({floorRoomCounts["2F"].occupied}/{floorRoomCounts["2F"].total}室)</SelectItem>
                        <SelectItem value="3F">3F ({floorRoomCounts["3F"].occupied}/{floorRoomCounts["3F"].total}室)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="room_type">部屋タイプ</Label>
                    <Select 
                      value={formData.room_type} 
                      onValueChange={(value: any) => {
                        const roomType = roomTypeOptions.find(opt => opt.value === value)
                        setFormData({ 
                          ...formData, 
                          room_type: value,
                          capacity: roomType?.capacities[0] || 5,
                          room_rate: roomType?.defaultRate || 5000
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="capacity">定員</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="room_rate">室料（円/泊）</Label>
                    <Input
                      id="room_rate"
                      type="number"
                      value={formData.room_rate}
                      onChange={(e) => setFormData({ ...formData, room_rate: parseInt(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="usage_type">利用区分</Label>
                    <Select 
                      value={formData.usage_type} 
                      onValueChange={(value: any) => setFormData({ ...formData, usage_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">個室</SelectItem>
                        <SelectItem value="shared">大部屋・中部屋</SelectItem>
                      </SelectContent>
                    </Select>
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
        
        {/* 部屋統計 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{rooms.length}</div>
                <div className="text-sm text-muted-foreground">総部屋数</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {floorRoomCounts["2F"].occupied}
                </div>
                <div className="text-sm text-muted-foreground">2F 部屋数</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {floorRoomCounts["3F"].occupied}
                </div>
                <div className="text-sm text-muted-foreground">3F 部屋数</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {rooms.reduce((sum, room) => sum + room.capacity, 0)}
                </div>
                <div className="text-sm text-muted-foreground">総収容人数</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>部屋ID</TableHead>
              <TableHead>部屋名</TableHead>
              <TableHead>フロア</TableHead>
              <TableHead>タイプ</TableHead>
              <TableHead>定員</TableHead>
              <TableHead>室料</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.room_id}>
                <TableCell className="font-mono text-sm">{room.room_id}</TableCell>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell>{room.floor}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    room.room_type === "large" ? "bg-red-100 text-red-800" :
                    room.room_type.startsWith("medium") ? "bg-yellow-100 text-yellow-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {roomTypeOptions.find(opt => opt.value === room.room_type)?.label.split(' ')[0]}
                  </span>
                </TableCell>
                <TableCell>{room.capacity}名</TableCell>
                <TableCell>¥{room.room_rate?.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    room.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {room.is_active ? "有効" : "無効"}
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
                      onClick={() => handleDelete(room.room_id)}
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