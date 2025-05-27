"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save, X, Calculator } from "lucide-react"
import { usePricingStore } from "@/store/pricing-store"
import { PricingMatrix } from "@/components/admin/pricing-matrix"

export default function PricingAdminPage() {
  const { rules, addRule, updateRule, deleteRule } = usePricingStore()
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [activeTab, setActiveTab] = useState<string>("rules")
  const [newRuleForm, setNewRuleForm] = useState({
    name: "",
    type: "seasonal" as const,
    roomType: "",
    startDate: "",
    endDate: "",
    dayOfWeek: [] as number[],
    multiplier: 1.0,
    fixedAmount: 0,
    isActive: true,
    priority: 1,
  })

  const ruleTypes = [
    { value: "seasonal", label: "シーズン料金" },
    { value: "weekday", label: "曜日料金" },
    { value: "special", label: "特別料金" },
    { value: "addon", label: "アドオン" },
  ]

  const weekDays = [
    { value: 0, label: "日曜日" },
    { value: 1, label: "月曜日" },
    { value: 2, label: "火曜日" },
    { value: 3, label: "水曜日" },
    { value: 4, label: "木曜日" },
    { value: 5, label: "金曜日" },
    { value: 6, label: "土曜日" },
  ]

  const handleEdit = (rule: any) => {
    setIsEditing(rule.id)
    setEditForm(rule)
  }

  const handleSave = () => {
    if (isEditing) {
      updateRule(isEditing, editForm)
      setIsEditing(null)
      setEditForm({})
    }
  }

  const handleCancel = () => {
    setIsEditing(null)
    setEditForm({})
  }

  const handleDelete = (ruleId: string) => {
    if (confirm("この料金ルールを削除してもよろしいですか？")) {
      deleteRule(ruleId)
    }
  }

  const handleAddRule = () => {
    const newRule = {
      ...newRuleForm,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addRule(newRule)
    setNewRuleForm({
      name: "",
      type: "seasonal",
      roomType: "",
      startDate: "",
      endDate: "",
      dayOfWeek: [],
      multiplier: 1.0,
      fixedAmount: 0,
      isActive: true,
      priority: 1,
    })
    setIsAdding(false)
  }

  const toggleWeekDay = (day: number, isNew = false) => {
    if (isNew) {
      setNewRuleForm((prev) => ({
        ...prev,
        dayOfWeek: prev.dayOfWeek.includes(day) ? prev.dayOfWeek.filter((d) => d !== day) : [...prev.dayOfWeek, day],
      }))
    } else {
      setEditForm((prev: any) => ({
        ...prev,
        dayOfWeek: prev.dayOfWeek?.includes(day)
          ? prev.dayOfWeek.filter((d: number) => d !== day)
          : [...(prev.dayOfWeek || []), day],
      }))
    }
  }

  const getRuleTypeLabel = (type: string) => {
    return ruleTypes.find((t) => t.value === type)?.label || type
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">料金設定</h1>
          <p className="text-muted-foreground">料金ルールとシーズン料金の設定</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === "rules" ? "default" : "outline"} 
            onClick={() => setActiveTab("rules")}
          >
            料金ルール
          </Button>
          <Button 
            variant={activeTab === "matrix" ? "default" : "outline"} 
            onClick={() => setActiveTab("matrix")}
          >
            <Calculator className="mr-2 h-4 w-4" />
            料金マトリクス
          </Button>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="mr-2 h-4 w-4" />
            新規ルール追加
          </Button>
        </div>
      </div>

      {/* 新規ルール追加フォーム */}
      {isAdding && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>新規料金ルール追加</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ルール名</Label>
                <Input
                  value={newRuleForm.name}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, name: e.target.value })}
                  placeholder="夏季料金"
                />
              </div>
              <div className="space-y-2">
                <Label>ルールタイプ</Label>
                <Select
                  value={newRuleForm.type}
                  onValueChange={(value: any) => setNewRuleForm({ ...newRuleForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ruleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(newRuleForm.type === "seasonal" || newRuleForm.type === "special") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>開始日</Label>
                  <Input
                    type="date"
                    value={newRuleForm.startDate}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>終了日</Label>
                  <Input
                    type="date"
                    value={newRuleForm.endDate}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            {newRuleForm.type === "weekday" && (
              <div className="space-y-2">
                <Label>対象曜日</Label>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <Button
                      key={day.value}
                      variant={newRuleForm.dayOfWeek.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWeekDay(day.value, true)}
                    >
                      {day.label.charAt(0)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>優先度</Label>
                <Input
                  type="number"
                  value={newRuleForm.priority}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, priority: Number.parseInt(e.target.value) })}
                />
              </div>
              {newRuleForm.type !== "addon" ? (
                <div className="space-y-2">
                  <Label>倍率</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newRuleForm.multiplier}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, multiplier: Number.parseFloat(e.target.value) })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>固定金額</Label>
                  <Input
                    type="number"
                    value={newRuleForm.fixedAmount}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, fixedAmount: Number.parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddRule}>
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

      {/* 料金マトリクス表示 */}
      {activeTab === "matrix" && (
        <PricingMatrix />
      )}

      {/* 料金ルール一覧 */}
      {activeTab === "rules" && (
      <Card>
        <CardHeader>
          <CardTitle>料金ルール一覧</CardTitle>
          <CardDescription>{rules.length}件のルールが登録されています</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ルール名</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>期間/曜日</TableHead>
                <TableHead>倍率/金額</TableHead>
                <TableHead>優先度</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules
                .sort((a, b) => a.priority - b.priority)
                .map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      {isEditing === rule.id ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        rule.name
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRuleTypeLabel(rule.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.type === "seasonal" || rule.type === "special" ? (
                        <span className="text-sm">
                          {rule.startDate} ～ {rule.endDate}
                        </span>
                      ) : rule.type === "weekday" ? (
                        <div className="flex gap-1">
                          {rule.dayOfWeek?.map((day) => (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {weekDays.find((d) => d.value === day)?.label.charAt(0)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing === rule.id ? (
                        rule.type === "addon" ? (
                          <Input
                            type="number"
                            value={editForm.fixedAmount}
                            onChange={(e) => setEditForm({ ...editForm, fixedAmount: Number.parseInt(e.target.value) })}
                          />
                        ) : (
                          <Input
                            type="number"
                            step="0.1"
                            value={editForm.multiplier}
                            onChange={(e) =>
                              setEditForm({ ...editForm, multiplier: Number.parseFloat(e.target.value) })
                            }
                          />
                        )
                      ) : rule.type === "addon" ? (
                        `¥${rule.fixedAmount?.toLocaleString()}`
                      ) : (
                        `${rule.multiplier}x`
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing === rule.id ? (
                        <Input
                          type="number"
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: Number.parseInt(e.target.value) })}
                        />
                      ) : (
                        rule.priority
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "アクティブ" : "非アクティブ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isEditing === rule.id ? (
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
                          <Button size="sm" variant="outline" onClick={() => handleEdit(rule)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(rule.id)}>
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
      )}
    </div>
  )
}
