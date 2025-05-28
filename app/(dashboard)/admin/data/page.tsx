"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Upload, 
  Download, 
  Database, 
  Trash2, 
  FileDown, 
  FileUp, 
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react"
import { useRoomStore } from "@/store/room-store"
import { useBookingStore } from "@/store/booking-store"
import { usePricingStore } from "@/store/pricing-store"
import { CSVExporter } from "@/lib/export/csv-exporter"
import { CSVImporter } from "@/lib/export/csv-importer"

export default function DataManagementPage() {
  const { rooms, addRoom, deleteRoom, updateRoom } = useRoomStore()
  const { bookings, customers } = useBookingStore()
  const { rules } = usePricingStore()
  
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])
  const [selectedRules, setSelectedRules] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; data?: any[] } | null>(null)
  
  const roomFileRef = useRef<HTMLInputElement>(null)
  const optionFileRef = useRef<HTMLInputElement>(null)

  // エクスポート機能
  const handleExportRooms = () => {
    CSVExporter.exportRooms(rooms)
  }

  const handleExportBookings = () => {
    CSVExporter.exportBookings(bookings, rooms)
  }

  const handleExportOccupancy = () => {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    const endDate = new Date()
    
    CSVExporter.exportOccupancyReport(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      rooms,
      bookings
    )
  }

  // テンプレートダウンロード
  const handleDownloadRoomTemplate = () => {
    CSVImporter.downloadRoomTemplate()
  }

  const handleDownloadOptionTemplate = () => {
    CSVImporter.downloadOptionTemplate()
  }

  // インポート機能
  const handleImportRooms = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const roomData = await CSVImporter.importRooms(file)
      
      // データを実際にストアに追加
      roomData.forEach(room => {
        addRoom(room)
      })
      
      setImportResult({
        success: true,
        message: `${roomData.length}件の部屋データを正常にインポートしました。`,
        data: roomData
      })
    } catch (error) {
      setImportResult({
        success: false,
        message: `インポートに失敗しました: ${error}`
      })
    } finally {
      setIsImporting(false)
      if (roomFileRef.current) {
        roomFileRef.current.value = ''
      }
    }
  }

  // 一括削除機能
  const handleBulkDeleteRooms = () => {
    if (selectedRooms.length === 0) {
      alert('削除する部屋を選択してください。')
      return
    }

    if (confirm(`選択された${selectedRooms.length}件の部屋を削除しますか？`)) {
      selectedRooms.forEach(roomId => {
        deleteRoom(roomId)
      })
      setSelectedRooms([])
    }
  }

  // 一括有効/無効切替
  const handleBulkToggleRooms = (isActive: boolean) => {
    if (selectedRooms.length === 0) {
      alert('変更する部屋を選択してください。')
      return
    }

    selectedRooms.forEach(roomId => {
      const room = rooms.find(r => r.id === roomId)
      if (room) {
        updateRoom(roomId, { ...room, isActive })
      }
    })
    setSelectedRooms([])
  }

  // データバックアップ
  const handleBackupData = () => {
    const backupData = {
      rooms,
      bookings,
      customers,
      pricingRules: rules,
      exportDate: new Date().toISOString(),
      version: "1.0"
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
      type: "application/json;charset=utf-8;" 
    })
    const link = document.createElement("a")
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `rebase369_backup_${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleSelectAllRooms = (checked: boolean) => {
    if (checked) {
      setSelectedRooms(rooms.map(room => room.id))
    } else {
      setSelectedRooms([])
    }
  }

  const handleSelectRoom = (roomId: string, checked: boolean) => {
    if (checked) {
      setSelectedRooms(prev => [...prev, roomId])
    } else {
      setSelectedRooms(prev => prev.filter(id => id !== roomId))
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">データ管理</h1>
        <p className="text-muted-foreground">データのインポート・エクスポート・バックアップ・一括操作</p>
      </div>

      {/* 統計概要 */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総部屋数</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
            <p className="text-xs text-muted-foreground">アクティブ: {rooms.filter(r => r.isActive).length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総予約数</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">確定: {bookings.filter(b => b.status === 'confirmed').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">顧客数</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">登録済み顧客</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">料金ルール</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-xs text-muted-foreground">アクティブ: {rules.filter(r => r.isActive).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* インポート結果表示 */}
      {importResult && (
        <Alert className={`mb-6 ${importResult.success ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center">
            {importResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className="ml-2">{importResult.message}</AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export">エクスポート</TabsTrigger>
          <TabsTrigger value="import">インポート</TabsTrigger>
          <TabsTrigger value="bulk">一括操作</TabsTrigger>
          <TabsTrigger value="backup">バックアップ</TabsTrigger>
        </TabsList>

        {/* エクスポート */}
        <TabsContent value="export">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  データエクスポート
                </CardTitle>
                <CardDescription>各種データをCSV形式でエクスポート</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleExportRooms} className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  部屋データエクスポート
                </Button>
                <Button onClick={handleExportBookings} className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  予約データエクスポート
                </Button>
                <Button onClick={handleExportOccupancy} className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  稼働率レポートエクスポート
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileDown className="mr-2 h-5 w-5" />
                  テンプレートダウンロード
                </CardTitle>
                <CardDescription>インポート用のCSVテンプレート</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleDownloadRoomTemplate} variant="outline" className="w-full">
                  部屋データテンプレート
                </Button>
                <Button onClick={handleDownloadOptionTemplate} variant="outline" className="w-full">
                  オプションデータテンプレート
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* インポート */}
        <TabsContent value="import">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  部屋データインポート
                </CardTitle>
                <CardDescription>CSVファイルから部屋データを一括インポート</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-csv">CSVファイルを選択</Label>
                  <Input
                    id="room-csv"
                    type="file"
                    accept=".csv"
                    ref={roomFileRef}
                    onChange={handleImportRooms}
                    disabled={isImporting}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• CSVファイルはUTF-8エンコーディングで保存してください</p>
                  <p>• 1行目はヘッダー行として扱われます</p>
                  <p>• テンプレートファイルを参考にしてください</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  オプションデータインポート
                </CardTitle>
                <CardDescription>CSVファイルからオプションデータを一括インポート</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="option-csv">CSVファイルを選択</Label>
                  <Input
                    id="option-csv"
                    type="file"
                    accept=".csv"
                    ref={optionFileRef}
                    disabled={isImporting}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• 料金は数値のみで入力してください</p>
                  <p>• カテゴリは meal/facility/equipment のいずれかです</p>
                  <p>• 倍率は小数点で入力可能です（例：1.2）</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 一括操作 */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                一括操作
              </CardTitle>
              <CardDescription>選択したデータに対して一括操作を実行</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 一括操作ボタン */}
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={() => handleBulkToggleRooms(true)}
                    disabled={selectedRooms.length === 0}
                    variant="outline"
                  >
                    選択部屋を有効化
                  </Button>
                  <Button 
                    onClick={() => handleBulkToggleRooms(false)}
                    disabled={selectedRooms.length === 0}
                    variant="outline"
                  >
                    選択部屋を無効化
                  </Button>
                  <Button 
                    onClick={handleBulkDeleteRooms}
                    disabled={selectedRooms.length === 0}
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    選択部屋を削除
                  </Button>
                </div>

                {/* 部屋選択テーブル */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">部屋選択 ({selectedRooms.length}/{rooms.length}件選択)</h3>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedRooms.length === rooms.length && rooms.length > 0}
                            onCheckedChange={handleSelectAllRooms}
                          />
                        </TableHead>
                        <TableHead>部屋名</TableHead>
                        <TableHead>タイプ</TableHead>
                        <TableHead>定員</TableHead>
                        <TableHead>料金</TableHead>
                        <TableHead>ステータス</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRooms.includes(room.id)}
                              onCheckedChange={(checked) => handleSelectRoom(room.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{room.name}</TableCell>
                          <TableCell>{room.type}</TableCell>
                          <TableCell>{room.capacity}名</TableCell>
                          <TableCell>¥{room.basePrice?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={room.isActive ? "default" : "secondary"}>
                              {room.isActive ? "アクティブ" : "非アクティブ"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* バックアップ */}
        <TabsContent value="backup">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  データバックアップ
                </CardTitle>
                <CardDescription>システム全体のデータをバックアップ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleBackupData} className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  完全バックアップ実行
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p>• 部屋データ、予約データ、顧客データ、料金ルールを含む</p>
                  <p>• JSON形式でダウンロードされます</p>
                  <p>• 定期的なバックアップを推奨します</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>バックアップ履歴</CardTitle>
                <CardDescription>過去のバックアップ作成履歴</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">今日 ({new Date().toLocaleDateString('ja-JP')})</span>
                    <Badge variant="outline">手動</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    自動バックアップ機能は今後実装予定です
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}