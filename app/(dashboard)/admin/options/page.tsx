"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"

interface Option {
  id: string
  name: string
  category: "meal" | "facility" | "equipment"
  description: string
  pricing: {
    adult: number
    student: number
    child: number
    preschool: number
    infant: number
  }
  dayMultipliers: {
    weekday: number
    weekend: number
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const sampleOptions: Option[] = [
  {
    id: "1",
    name: "朝食",
    category: "meal",
    description: "和定食または洋定食をお選びいただけます",
    pricing: {
      adult: 700,
      student: 700,
      child: 700,
      preschool: 700,
      infant: 0,
    },
    dayMultipliers: {
      weekday: 1.0,
      weekend: 1.0,
    },
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "夕食",
    category: "meal",
    description: "地元の食材を使った会席料理",
    pricing: {
      adult: 1500,
      student: 1000,
      child: 800,
      preschool: 0,
      infant: 0,
    },
    dayMultipliers: {
      weekday: 1.0,
      weekend: 1.2,
    },
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "BBQ",
    category: "meal",
    description: "屋外バーベキュー（食材・機材込み）",
    pricing: {
      adult: 3000,
      student: 2200,
      child: 1500,
      preschool: 0,
      infant: 0,
    },
    dayMultipliers: {
      weekday: 1.0,
      weekend: 1.1,
    },
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "会議室",
    category: "facility",
    description: "プロジェクター付き会議室",
    pricing: {
      adult: 500,
      student: 400,
      child: 300,
      preschool: 200,
      infant: 0,
    },
    dayMultipliers: {
      weekday: 1.0,
      weekend: 1.5,
    },
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "体育館",
    category: "facility",
    description: "バスケットコート1面分の体育館",
    pricing: {
      adult: 500,
      student: 500,
      child: 500,
      preschool: 500,
      infant: 0,
    },
    dayMultipliers: {
      weekday: 1.0,
      weekend: 1.25,
    },
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "プロジェクター",
    category: "equipment",
    description: "HD対応プロジェクター",
    pricing: {
      adult: 3000,
      student: 3000,
      child: 3000,
      preschool: 3000,
      infant: 3000,
    },
    dayMultipliers: {
      weekday: 1.0,
      weekend: 1.0,
    },
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
]

export default function OptionsAdminPage() {
  const [options, setOptions] = useState<Option[]>(sampleOptions)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Option>>({})
  const [newOptionForm, setNewOptionForm] = useState<Partial<Option>>({
    name: "",
    category: "meal",
    description: "",
    pricing: {
      adult: 0,
      student: 0,
      child: 0,
      preschool: 0,
      infant: 0,
    },
    dayMultipliers: {
      weekday: 1.0,
      weekend: 1.0,
    },
    isActive: true,
  })

  const categories = [
    { value: "meal", label: "食事オプション" },
    { value: "facility", label: "施設利用" },
    { value: "equipment", label: "備品・機材" },
  ]

  const ageGroups = [
    { key: "adult", label: "大人" },
    { key: "student", label: "中高大学生" },
    { key: "child", label: "小学生" },
    { key: "preschool", label: "未就学児(3歳~)" },
    { key: "infant", label: "乳幼児(0~2歳)" },
  ]

  const handleEdit = (option: Option) => {
    setIsEditing(option.id)
    setEditForm(option)
  }

  const handleSave = () => {
    if (isEditing && editForm) {
      setOptions((prev) =>
        prev.map((option) =>
          option.id === isEditing
            ? { ...option, ...editForm, updatedAt: new Date().toISOString() }
            : option,
        ),
      )
      setIsEditing(null)
      setEditForm({})
    }
  }

  const handleCancel = () => {
    setIsEditing(null)
    setEditForm({})
  }

  const handleDelete = (optionId: string) => {
    if (confirm("このオプションを削除してもよろしいですか？")) {
      setOptions((prev) => prev.filter((option) => option.id !== optionId))
    }
  }

  const handleAddOption = () => {
    const newOption: Option = {
      ...newOptionForm,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Option

    setOptions((prev) => [...prev, newOption])
    setNewOptionForm({
      name: "",
      category: "meal",
      description: "",
      pricing: {
        adult: 0,
        student: 0,
        child: 0,
        preschool: 0,
        infant: 0,
      },
      dayMultipliers: {
        weekday: 1.0,
        weekend: 1.0,
      },
      isActive: true,
    })
    setIsAdding(false)
  }

  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.value === category)?.label || category
  }

  const filterOptionsByCategory = (category: string) => {
    return options.filter((option) => option.category === category)
  }

  const OptionTable = ({ categoryOptions }: { categoryOptions: Option[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>オプション名</TableHead>
          <TableHead>説明</TableHead>
          <TableHead>料金設定</TableHead>
          <TableHead>曜日倍率</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categoryOptions.map((option) => (
          <TableRow key={option.id}>
            <TableCell>
              {isEditing === option.id ? (
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              ) : (
                option.name
              )}
            </TableCell>
            <TableCell>
              {isEditing === option.id ? (
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              ) : (
                option.description
              )}
            </TableCell>
            <TableCell>
              {isEditing === option.id ? (
                <div className="space-y-2">
                  {ageGroups.map((group) => (
                    <div key={group.key} className="flex items-center gap-2">
                      <Label className="w-20 text-xs">{group.label}:</Label>
                      <Input
                        type="number"
                        value={editForm.pricing?.[group.key as keyof typeof editForm.pricing]}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            pricing: {
                              ...editForm.pricing!,
                              [group.key]: Number.parseInt(e.target.value),
                            },
                          })
                        }
                        className="w-20"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {ageGroups.map((group) => (
                    <div key={group.key} className="text-xs">
                      {group.label}: ¥{option.pricing[group.key as keyof typeof option.pricing]?.toLocaleString()}
                    </div>
                  ))}
                </div>
              )}
            </TableCell>
            <TableCell>
              {isEditing === option.id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="w-12 text-xs">平日:</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editForm.dayMultipliers?.weekday}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          dayMultipliers: {
                            ...editForm.dayMultipliers!,
                            weekday: Number.parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-12 text-xs">休日:</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editForm.dayMultipliers?.weekend}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          dayMultipliers: {
                            ...editForm.dayMultipliers!,
                            weekend: Number.parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-20"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs">平日: {option.dayMultipliers.weekday}x</div>
                  <div className="text-xs">休日: {option.dayMultipliers.weekend}x</div>
                </div>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={option.isActive ? "default" : "secondary"}>
                {option.isActive ? "アクティブ" : "非アクティブ"}
              </Badge>
            </TableCell>
            <TableCell>
              {isEditing === option.id ? (
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
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(option.id)}>
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="space-y-2">
              <Label>説明</Label>
              <Input
                value={newOptionForm.description}
                onChange={(e) => setNewOptionForm({ ...newOptionForm, description: e.target.value })}
                placeholder="オプションの説明"
              />
            </div>

            <div className="space-y-2">
              <Label>年齢区分別料金設定</Label>
              <div className="grid grid-cols-5 gap-4">
                {ageGroups.map((group) => (
                  <div key={group.key} className="space-y-1">
                    <Label className="text-xs">{group.label}</Label>
                    <Input
                      type="number"
                      value={newOptionForm.pricing?.[group.key as keyof typeof newOptionForm.pricing]}
                      onChange={(e) =>
                        setNewOptionForm({
                          ...newOptionForm,
                          pricing: {
                            ...newOptionForm.pricing!,
                            [group.key]: Number.parseInt(e.target.value),
                          },
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>曜日別倍率</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">平日倍率</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newOptionForm.dayMultipliers?.weekday}
                    onChange={(e) =>
                      setNewOptionForm({
                        ...newOptionForm,
                        dayMultipliers: {
                          ...newOptionForm.dayMultipliers!,
                          weekday: Number.parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">休日倍率</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newOptionForm.dayMultipliers?.weekend}
                    onChange={(e) =>
                      setNewOptionForm({
                        ...newOptionForm,
                        dayMultipliers: {
                          ...newOptionForm.dayMultipliers!,
                          weekend: Number.parseFloat(e.target.value),
                        },
                      })
                    }
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