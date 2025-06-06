"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Save, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Database add_on type
interface AddOn {
  add_on_id: string
  category: "meal" | "facility" | "equipment"
  name: string
  unit: string
  adult_fee: number
  student_fee: number
  child_fee: number
  infant_fee: number
  personal_fee_5h: number
  personal_fee_10h: number
  personal_fee_over: number
  room_fee_weekday_guest: number
  room_fee_weekday_other: number
  room_fee_weekend_guest: number
  room_fee_weekend_other: number
  aircon_fee_per_hour: number
  min_quantity: number
  max_quantity: number | null
  is_active: boolean
  created_at: string
}

export default function OptionsAdminPage() {
  const [options, setOptions] = useState<AddOn[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState<Partial<AddOn>>({})
  const [newOptionForm, setNewOptionForm] = useState<Partial<AddOn>>({
    name: "",
    category: "meal",
    unit: "人・回",
    adult_fee: 0,
    student_fee: 0,
    child_fee: 0,
    infant_fee: 0,
    personal_fee_5h: 0,
    personal_fee_10h: 0,
    personal_fee_over: 0,
    room_fee_weekday_guest: 0,
    room_fee_weekday_other: 0,
    room_fee_weekend_guest: 0,
    room_fee_weekend_other: 0,
    aircon_fee_per_hour: 0,
    min_quantity: 1,
    max_quantity: null,
    is_active: true,
  })
  
  const { toast } = useToast()

  const categories = [
    { value: "meal", label: "食事オプション" },
    { value: "facility", label: "施設利用" },
    { value: "equipment", label: "備品・機材" },
  ]

  // Fetch options from API
  const fetchOptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/options')
      const result = await response.json()
      
      if (result.success) {
        setOptions(result.data)
      } else {
        toast({
          title: "エラー",
          description: "オプションの取得に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching options:', error)
      toast({
        title: "エラー",
        description: "オプションの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  const handleEdit = (option: AddOn) => {
    setIsEditing(option.add_on_id)
    setEditForm(option)
  }

  const handleSave = async () => {
    if (!isEditing || !editForm) return
    
    try {
      const response = await fetch('/api/admin/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add_on_id: isEditing, ...editForm })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchOptions()
        setIsEditing(null)
        setEditForm({})
        toast({
          title: "成功",
          description: "オプションが更新されました",
        })
      } else {
        toast({
          title: "エラー",
          description: result.error || "更新に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating option:', error)
      toast({
        title: "エラー",
        description: "更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(null)
    setEditForm({})
  }

  const handleDelete = async (addOnId: string) => {
    if (!confirm("このオプションを削除してもよろしいですか？")) return
    
    try {
      const response = await fetch(`/api/admin/options/${addOnId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchOptions()
        toast({
          title: "成功",
          description: "オプションが削除されました",
        })
      } else {
        toast({
          title: "エラー",
          description: result.error || "削除に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting option:', error)
      toast({
        title: "エラー",
        description: "削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleAddOption = async () => {
    try {
      const response = await fetch('/api/admin/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOptionForm)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchOptions()
        setNewOptionForm({
          name: "",
          category: "meal",
          unit: "人・回",
          adult_fee: 0,
          student_fee: 0,
          child_fee: 0,
          infant_fee: 0,
          personal_fee_5h: 0,
          personal_fee_10h: 0,
          personal_fee_over: 0,
          room_fee_weekday_guest: 0,
          room_fee_weekday_other: 0,
          room_fee_weekend_guest: 0,
          room_fee_weekend_other: 0,
          aircon_fee_per_hour: 0,
          min_quantity: 1,
          max_quantity: null,
          is_active: true,
        })
        setIsAdding(false)
        toast({
          title: "成功",
          description: "オプションが作成されました",
        })
      } else {
        toast({
          title: "エラー",
          description: result.error || "作成に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating option:', error)
      toast({
        title: "エラー",
        description: "作成に失敗しました",
        variant: "destructive",
      })
    }
  }

  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.value === category)?.label || category
  }

  const filterOptionsByCategory = (category: string) => {
    return options.filter((option) => option.category === category)
  }

  const OptionTable = ({ categoryOptions }: { categoryOptions: AddOn[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>オプション名</TableHead>
          <TableHead>単位</TableHead>
          <TableHead>年齢別料金</TableHead>
          <TableHead>施設料金</TableHead>
          <TableHead>数量制限</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categoryOptions.map((option) => (
          <TableRow key={option.add_on_id}>
            <TableCell>
              {isEditing === option.add_on_id ? (
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              ) : (
                option.name
              )}
            </TableCell>
            <TableCell>
              {isEditing === option.add_on_id ? (
                <Input
                  value={editForm.unit}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                />
              ) : (
                option.unit
              )}
            </TableCell>
            <TableCell>
              {isEditing === option.add_on_id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="w-16 text-xs">大人:</Label>
                    <Input
                      type="number"
                      value={editForm.adult_fee}
                      onChange={(e) => setEditForm({ ...editForm, adult_fee: Number(e.target.value) })}
                      className="w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-16 text-xs">学生:</Label>
                    <Input
                      type="number"
                      value={editForm.student_fee}
                      onChange={(e) => setEditForm({ ...editForm, student_fee: Number(e.target.value) })}
                      className="w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-16 text-xs">子供:</Label>
                    <Input
                      type="number"
                      value={editForm.child_fee}
                      onChange={(e) => setEditForm({ ...editForm, child_fee: Number(e.target.value) })}
                      className="w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-16 text-xs">乳幼児:</Label>
                    <Input
                      type="number"
                      value={editForm.infant_fee}
                      onChange={(e) => setEditForm({ ...editForm, infant_fee: Number(e.target.value) })}
                      className="w-20"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs">大人: ¥{option.adult_fee?.toLocaleString()}</div>
                  <div className="text-xs">学生: ¥{option.student_fee?.toLocaleString()}</div>
                  <div className="text-xs">子供: ¥{option.child_fee?.toLocaleString()}</div>
                  <div className="text-xs">乳幼児: ¥{option.infant_fee?.toLocaleString()}</div>
                </div>
              )}
            </TableCell>
            <TableCell>
              {option.category === 'facility' ? (
                isEditing === option.add_on_id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="w-16 text-xs">5h:</Label>
                      <Input
                        type="number"
                        value={editForm.personal_fee_5h}
                        onChange={(e) => setEditForm({ ...editForm, personal_fee_5h: Number(e.target.value) })}
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-16 text-xs">10h:</Label>
                      <Input
                        type="number"
                        value={editForm.personal_fee_10h}
                        onChange={(e) => setEditForm({ ...editForm, personal_fee_10h: Number(e.target.value) })}
                        className="w-20"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs">5h: ¥{option.personal_fee_5h?.toLocaleString()}</div>
                    <div className="text-xs">10h: ¥{option.personal_fee_10h?.toLocaleString()}</div>
                    <div className="text-xs">室料平日: ¥{option.room_fee_weekday_guest?.toLocaleString()}</div>
                    <div className="text-xs">エアコン: ¥{option.aircon_fee_per_hour?.toLocaleString()}/h</div>
                  </div>
                )
              ) : (
                <span className="text-xs text-muted-foreground">該当なし</span>
              )}
            </TableCell>
            <TableCell>
              {isEditing === option.add_on_id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="w-12 text-xs">最小:</Label>
                    <Input
                      type="number"
                      value={editForm.min_quantity}
                      onChange={(e) => setEditForm({ ...editForm, min_quantity: Number(e.target.value) })}
                      className="w-16"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-12 text-xs">最大:</Label>
                    <Input
                      type="number"
                      value={editForm.max_quantity || ''}
                      onChange={(e) => setEditForm({ ...editForm, max_quantity: e.target.value ? Number(e.target.value) : null })}
                      className="w-16"
                      placeholder="無制限"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs">最小: {option.min_quantity}</div>
                  <div className="text-xs">最大: {option.max_quantity || '無制限'}</div>
                </div>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={option.is_active ? "default" : "secondary"}>
                {option.is_active ? "アクティブ" : "非アクティブ"}
              </Badge>
            </TableCell>
            <TableCell>
              {isEditing === option.add_on_id ? (
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
                  <Button size="sm" variant="outline" onClick={() => handleEdit(option)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(option.add_on_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">オプションを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">オプション管理</h1>
          <p className="text-muted-foreground">食事、施設利用、備品オプションの管理</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="mr-2 h-4 w-4" />
          新規オプション追加
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">食事オプション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterOptionsByCategory("meal").length}</div>
            <p className="text-xs text-muted-foreground">朝食・夕食・BBQ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">施設利用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterOptionsByCategory("facility").length}</div>
            <p className="text-xs text-muted-foreground">会議室・体育館</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">備品・機材</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterOptionsByCategory("equipment").length}</div>
            <p className="text-xs text-muted-foreground">プロジェクター等</p>
          </CardContent>
        </Card>
      </div>

      {/* 新規オプション追加フォーム */}
      {isAdding && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>新規オプション追加</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>オプション名</Label>
                <Input
                  value={newOptionForm.name}
                  onChange={(e) => setNewOptionForm({ ...newOptionForm, name: e.target.value })}
                  placeholder="朝食"
                />
              </div>
              <div className="space-y-2">
                <Label>カテゴリ</Label>
                <Select
                  value={newOptionForm.category}
                  onValueChange={(value: any) => setNewOptionForm({ ...newOptionForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>単位</Label>
                <Input
                  value={newOptionForm.unit}
                  onChange={(e) => setNewOptionForm({ ...newOptionForm, unit: e.target.value })}
                  placeholder="人・回"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>年齢区分別料金設定</Label>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">大人</Label>
                  <Input
                    type="number"
                    value={newOptionForm.adult_fee}
                    onChange={(e) => setNewOptionForm({ ...newOptionForm, adult_fee: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">学生</Label>
                  <Input
                    type="number"
                    value={newOptionForm.student_fee}
                    onChange={(e) => setNewOptionForm({ ...newOptionForm, student_fee: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">子供</Label>
                  <Input
                    type="number"
                    value={newOptionForm.child_fee}
                    onChange={(e) => setNewOptionForm({ ...newOptionForm, child_fee: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">乳幼児</Label>
                  <Input
                    type="number"
                    value={newOptionForm.infant_fee}
                    onChange={(e) => setNewOptionForm({ ...newOptionForm, infant_fee: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {newOptionForm.category === 'facility' && (
              <div className="space-y-2">
                <Label>施設利用料金設定</Label>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">個人料金(5h)</Label>
                    <Input
                      type="number"
                      value={newOptionForm.personal_fee_5h}
                      onChange={(e) => setNewOptionForm({ ...newOptionForm, personal_fee_5h: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">個人料金(10h)</Label>
                    <Input
                      type="number"
                      value={newOptionForm.personal_fee_10h}
                      onChange={(e) => setNewOptionForm({ ...newOptionForm, personal_fee_10h: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">室料(平日宿泊者)</Label>
                    <Input
                      type="number"
                      value={newOptionForm.room_fee_weekday_guest}
                      onChange={(e) => setNewOptionForm({ ...newOptionForm, room_fee_weekday_guest: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">エアコン代(時間)</Label>
                    <Input
                      type="number"
                      value={newOptionForm.aircon_fee_per_hour}
                      onChange={(e) => setNewOptionForm({ ...newOptionForm, aircon_fee_per_hour: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>数量制限</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">最小数量</Label>
                  <Input
                    type="number"
                    value={newOptionForm.min_quantity}
                    onChange={(e) => setNewOptionForm({ ...newOptionForm, min_quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">最大数量</Label>
                  <Input
                    type="number"
                    value={newOptionForm.max_quantity || ''}
                    onChange={(e) => setNewOptionForm({ ...newOptionForm, max_quantity: e.target.value ? Number(e.target.value) : null })}
                    placeholder="無制限"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddOption}>
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

      {/* オプション一覧 */}
      <Tabs defaultValue="meal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="meal">食事オプション</TabsTrigger>
          <TabsTrigger value="facility">施設利用</TabsTrigger>
          <TabsTrigger value="equipment">備品・機材</TabsTrigger>
        </TabsList>

        <TabsContent value="meal">
          <Card>
            <CardHeader>
              <CardTitle>食事オプション管理</CardTitle>
              <CardDescription>朝食・夕食・BBQなどの食事オプション</CardDescription>
            </CardHeader>
            <CardContent>
              <OptionTable categoryOptions={filterOptionsByCategory("meal")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facility">
          <Card>
            <CardHeader>
              <CardTitle>施設利用管理</CardTitle>
              <CardDescription>会議室・体育館などの施設利用オプション</CardDescription>
            </CardHeader>
            <CardContent>
              <OptionTable categoryOptions={filterOptionsByCategory("facility")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>備品・機材管理</CardTitle>
              <CardDescription>プロジェクター・音響機器などの備品オプション</CardDescription>
            </CardHeader>
            <CardContent>
              <OptionTable categoryOptions={filterOptionsByCategory("equipment")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}