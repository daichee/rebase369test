"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Save, 
  RefreshCw, 
  History, 
  Calculator,
  Settings,
  CheckCircle,
  AlertTriangle,
  Undo2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { EditableConfig } from "@/lib/pricing/config-service"

interface PricingHistory {
  id: string
  config_name: string
  is_active: boolean
  valid_from: string
  valid_until?: string
  created_at: string
  updated_at: string
  created_by: string
}

export default function AdminPricingPage() {
  const [config, setConfig] = useState<EditableConfig | null>(null)
  const [originalConfig, setOriginalConfig] = useState<EditableConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<PricingHistory[]>([])
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null)

  // 設定読み込み
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/pricing")
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setConfig(data)
      setOriginalConfig(JSON.parse(JSON.stringify(data))) // Deep copy
      
    } catch (error) {
      console.error("Failed to load pricing config:", error)
      toast({
        title: "❌ 設定読み込みエラー",
        description: "料金設定の読み込みに失敗しました",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await fetch("/api/admin/pricing/history?limit=10")
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setHistory(data.data || [])
      
    } catch (error) {
      console.error("Failed to load pricing history:", error)
      toast({
        title: "❌ 履歴読み込みエラー",
        description: "料金設定履歴の読み込みに失敗しました",
        variant: "destructive"
      })
    }
  }

  const saveConfig = async () => {
    if (!config) return

    try {
      setSaving(true)
      
      const response = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save configuration")
      }

      setSaveStatus({
        success: true,
        message: "料金設定が正常に保存されました。"
      })

      toast({
        title: "✅ 保存完了",
        description: "料金設定が正常に更新されました",
        variant: "default"
      })

      // 設定を再読み込み
      await loadConfig()

    } catch (error) {
      console.error("Failed to save pricing config:", error)
      setSaveStatus({
        success: false,
        message: error instanceof Error ? error.message : "保存に失敗しました"
      })

      toast({
        title: "❌ 保存エラー",
        description: "料金設定の保存に失敗しました",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveStatus(null), 5000)
    }
  }

  const resetConfig = () => {
    if (originalConfig) {
      setConfig(JSON.parse(JSON.stringify(originalConfig))) // Deep copy
      toast({
        title: "🔄 リセット完了",
        description: "変更を元に戻しました",
        variant: "default"
      })
    }
  }

  const restoreConfig = async (configId: string) => {
    try {
      const response = await fetch("/api/admin/pricing/history/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ configId })
      })

      if (!response.ok) {
        throw new Error("Failed to restore configuration")
      }

      toast({
        title: "✅ 復元完了",
        description: "過去の設定を復元しました",
        variant: "default"
      })

      // 設定を再読み込み
      await loadConfig()

    } catch (error) {
      console.error("Failed to restore config:", error)
      toast({
        title: "❌ 復元エラー",
        description: "設定の復元に失敗しました",
        variant: "destructive"
      })
    }
  }

  const hasChanges = config && originalConfig && 
    JSON.stringify(config) !== JSON.stringify(originalConfig)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">設定を読み込み中...</span>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="p-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            料金設定の読み込みに失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">料金設定管理</h1>
          <p className="text-muted-foreground">動的料金設定の管理と履歴管理</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={resetConfig}>
              <Undo2 className="mr-2 h-4 w-4" />
              リセット
            </Button>
          )}
          <Button onClick={saveConfig} disabled={saving || !hasChanges}>
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            設定を保存
          </Button>
        </div>
      </div>

      {/* 保存状況表示 */}
      {saveStatus && (
        <Alert className={`mb-6 ${saveStatus.success ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center">
            {saveStatus.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className="ml-2">{saveStatus.message}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* 変更状況表示 */}
      {hasChanges && (
        <Alert className="mb-6 border-orange-500">
          <Settings className="h-4 w-4 text-orange-500" />
          <AlertDescription>
            未保存の変更があります。設定を保存してください。
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">個人料金</TabsTrigger>
          <TabsTrigger value="room">部屋料金</TabsTrigger>
          <TabsTrigger value="addon">オプション料金</TabsTrigger>
          <TabsTrigger value="history">設定履歴</TabsTrigger>
        </TabsList>

        {/* 個人料金設定 */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>個人料金設定</CardTitle>
              <CardDescription>年齢区分・利用タイプ・時期別の個人料金</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 大部屋・中部屋料金 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">大部屋・中部屋料金</h3>
                <div className="grid grid-cols-5 gap-4">
                  <div className="font-medium">年齢区分</div>
                  <div className="text-center font-medium">平日</div>
                  <div className="text-center font-medium">休日</div>
                  <div className="text-center font-medium">繁忙期平日</div>
                  <div className="text-center font-medium">繁忙期休日</div>
                  
                  {Object.entries(config.personalRates.shared).map(([ageGroup, rates]) => (
                    <div key={ageGroup} className="contents">
                      <Label className="flex items-center">
                        {ageGroup === 'adult' ? '大人' :
                         ageGroup === 'student' ? '学生' :
                         ageGroup === 'child' ? '小学生' :
                         ageGroup === 'infant' ? '未就学児' : '乳幼児'}
                      </Label>
                      {(['weekday', 'weekend', 'peak_weekday', 'peak_weekend'] as const).map((period) => (
                        <Input
                          key={period}
                          type="number"
                          value={rates[period]}
                          onChange={(e) => {
                            const newConfig = { ...config }
                            newConfig.personalRates.shared[ageGroup as keyof typeof config.personalRates.shared][period] = parseInt(e.target.value) || 0
                            setConfig(newConfig)
                          }}
                          className="text-center"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 個室料金 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">個室料金</h3>
                <div className="grid grid-cols-5 gap-4">
                  <div className="font-medium">年齢区分</div>
                  <div className="text-center font-medium">平日</div>
                  <div className="text-center font-medium">休日</div>
                  <div className="text-center font-medium">繁忙期平日</div>
                  <div className="text-center font-medium">繁忙期休日</div>
                  
                  {Object.entries(config.personalRates.private).map(([ageGroup, rates]) => (
                    <div key={ageGroup} className="contents">
                      <Label className="flex items-center">
                        {ageGroup === 'adult' ? '大人' :
                         ageGroup === 'student' ? '学生' :
                         ageGroup === 'child' ? '小学生' :
                         ageGroup === 'infant' ? '未就学児' : '乳幼児'}
                      </Label>
                      {(['weekday', 'weekend', 'peak_weekday', 'peak_weekend'] as const).map((period) => (
                        <Input
                          key={period}
                          type="number"
                          value={rates[period]}
                          onChange={(e) => {
                            const newConfig = { ...config }
                            newConfig.personalRates.private[ageGroup as keyof typeof config.personalRates.private][period] = parseInt(e.target.value) || 0
                            setConfig(newConfig)
                          }}
                          className="text-center"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 部屋料金設定 */}
        <TabsContent value="room">
          <Card>
            <CardHeader>
              <CardTitle>部屋料金設定</CardTitle>
              <CardDescription>部屋タイプ別の室料（1泊あたり）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(config.roomRates).map(([roomType, rate]) => (
                  <div key={roomType} className="space-y-2">
                    <Label htmlFor={`room-${roomType}`}>
                      {roomType === 'large' ? '大部屋（作法室・被服室）' :
                       roomType === 'medium_a' ? '中部屋A（視聴覚室）' :
                       roomType === 'medium_b' ? '中部屋B（図書室）' :
                       roomType === 'small_a' ? '個室A（1年1組・1年2組）' :
                       roomType === 'small_b' ? '個室B（理科室）' : '個室C（2年組・3年組）'}
                    </Label>
                    <Input
                      id={`room-${roomType}`}
                      type="number"
                      value={rate}
                      onChange={(e) => {
                        const newConfig = { ...config }
                        newConfig.roomRates[roomType as keyof typeof config.roomRates] = parseInt(e.target.value) || 0
                        setConfig(newConfig)
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* オプション料金設定 */}
        <TabsContent value="addon">
          <Card>
            <CardHeader>
              <CardTitle>オプション料金設定</CardTitle>
              <CardDescription>食事・施設・備品の料金設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 食事料金 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">食事料金</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(config.addonRates.meal).map(([mealType, rate]) => (
                    <div key={mealType} className="space-y-2">
                      <Label>
                        {mealType === 'breakfast' ? '朝食' :
                         mealType === 'lunch' ? '昼食' :
                         mealType === 'dinner' ? '夕食' : 'BBQ'}
                      </Label>
                      <Input
                        type="number"
                        value={rate}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          newConfig.addonRates.meal[mealType as keyof typeof config.addonRates.meal] = parseInt(e.target.value) || 0
                          setConfig(newConfig)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 施設料金 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">施設料金</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(config.addonRates.facility).map(([facilityType, rate]) => (
                    <div key={facilityType} className="space-y-2">
                      <Label>
                        {facilityType === 'projector' ? 'プロジェクター' :
                         facilityType === 'sound_system' ? '音響設備' : 'フリップチャート'}
                      </Label>
                      <Input
                        type="number"
                        value={rate}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          newConfig.addonRates.facility[facilityType as keyof typeof config.addonRates.facility] = parseInt(e.target.value) || 0
                          setConfig(newConfig)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 備品料金 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">備品料金</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(config.addonRates.equipment).map(([equipmentType, rate]) => (
                    <div key={equipmentType} className="space-y-2">
                      <Label>
                        {equipmentType === 'bedding' ? '寝具' :
                         equipmentType === 'towel' ? 'タオル' : '枕'}
                      </Label>
                      <Input
                        type="number"
                        value={rate}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          newConfig.addonRates.equipment[equipmentType as keyof typeof config.addonRates.equipment] = parseInt(e.target.value) || 0
                          setConfig(newConfig)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* シーズン設定 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">繁忙期設定</h3>
                <Label>繁忙期月（カンマ区切りで入力）</Label>
                <Input
                  value={config.peakMonths.join(", ")}
                  onChange={(e) => {
                    const months = e.target.value
                      .split(",")
                      .map(m => parseInt(m.trim()))
                      .filter(m => !isNaN(m) && m >= 1 && m <= 12)
                    
                    const newConfig = { ...config }
                    newConfig.peakMonths = months
                    setConfig(newConfig)
                  }}
                  placeholder="例: 3, 4, 5, 7, 8, 9, 12"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  現在: {config.peakMonths.map(m => `${m}月`).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 設定履歴 */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5" />
                設定履歴
              </CardTitle>
              <CardDescription>過去の料金設定と復元機能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={loadHistory} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  履歴を読み込み
                </Button>

                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{item.config_name}</div>
                          <div className="text-sm text-muted-foreground">
                            作成: {new Date(item.created_at).toLocaleString('ja-JP')}
                          </div>
                          {item.is_active && (
                            <Badge variant="default" className="mt-1">現在の設定</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!item.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => restoreConfig(item.id)}
                            >
                              復元
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    履歴を読み込んでください
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* システム情報 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">システム情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <strong>設定名:</strong>
              <span className="ml-2">{config.configName}</span>
            </div>
            <div>
              <strong>バージョン:</strong>
              <span className="ml-2">{config.version}</span>
            </div>
            <div>
              <strong>最終更新:</strong>
              <span className="ml-2">{new Date(config.lastUpdated).toLocaleString('ja-JP')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}