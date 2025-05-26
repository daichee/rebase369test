"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Building2,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { useBoardProjects } from "@/lib/hooks/use-board-projects"
import type { BoardProject } from "@/lib/hooks/use-board-projects"

interface BoardProjectSelectorProps {
  onProjectSelect: (project: BoardProject | null) => void
  selectedProject?: BoardProject | null
  estimateData?: {
    roomAmount: number
    guestAmount: number
    addonAmount: number
    totalAmount: number
    items: Array<{
      itemName: string
      quantity: number
      unitPrice: number
      amount: number
      category: string
    }>
  }
}

export function BoardProjectSelector({ 
  onProjectSelect, 
  selectedProject,
  estimateData 
}: BoardProjectSelectorProps) {
  const {
    projects,
    isLoading,
    error,
    lastSyncAt,
    searchProjects,
    syncFromBoard,
    syncEstimateToBoard,
    getBoardEditUrl
  } = useBoardProjects()

  const [searchParams, setSearchParams] = useState({
    clientName: "",
    projectNo: "",
    status: ""
  })
  const [filteredProjects, setFilteredProjects] = useState<BoardProject[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    setFilteredProjects(projects)
  }, [projects])

  const handleSearch = async () => {
    try {
      const results = await searchProjects({
        clientName: searchParams.clientName || undefined,
        projectNo: searchParams.projectNo ? parseInt(searchParams.projectNo) : undefined,
        status: searchParams.status || undefined
      })
      setFilteredProjects(results)
    } catch (error) {
      console.error("検索に失敗:", error)
    }
  }

  const handleSyncFromBoard = async () => {
    setIsSyncing(true)
    setSyncMessage(null)
    
    try {
      const result = await syncFromBoard()
      setSyncMessage({
        type: result.success ? "success" : "error",
        message: result.message
      })
    } catch (error) {
      setSyncMessage({
        type: "error",
        message: "Board同期に失敗しました"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncEstimate = async () => {
    if (!selectedProject || !estimateData) return
    
    setIsSyncing(true)
    setSyncMessage(null)
    
    try {
      const result = await syncEstimateToBoard(selectedProject.id, estimateData)
      setSyncMessage({
        type: result.success ? "success" : "error",
        message: result.message
      })
    } catch (error) {
      setSyncMessage({
        type: "error",
        message: "見積同期に失敗しました"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const clearSearch = () => {
    setSearchParams({ clientName: "", projectNo: "", status: "" })
    setFilteredProjects(projects)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Board案件選択
          </CardTitle>
          <CardDescription>
            予約をBoard案件に連携する場合は、該当する案件を選択してください（任意）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 同期ステータス */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                最終同期: {lastSyncAt ? new Date(lastSyncAt).toLocaleString('ja-JP') : '未同期'}
              </span>
            </div>
            <Button
              onClick={handleSyncFromBoard}
              disabled={isSyncing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Board同期
            </Button>
          </div>

          {/* 同期メッセージ */}
          {syncMessage && (
            <Alert>
              {syncMessage.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {syncMessage.type === "success" ? "同期成功" : "同期エラー"}
              </AlertTitle>
              <AlertDescription>{syncMessage.message}</AlertDescription>
            </Alert>
          )}

          {/* 検索フィルター */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">案件検索</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">顧客名</Label>
                <Input
                  id="clientName"
                  placeholder="顧客名で検索"
                  value={searchParams.clientName}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectNo">案件番号</Label>
                <Input
                  id="projectNo"
                  placeholder="案件番号"
                  value={searchParams.projectNo}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, projectNo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">ステータス</Label>
                <Select 
                  value={searchParams.status} 
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全て" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全て</SelectItem>
                    <SelectItem value="active">進行中</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="cancelled">キャンセル</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end space-x-2">
                <Button onClick={handleSearch} disabled={isLoading}>
                  <Search className="mr-2 h-4 w-4" />
                  検索
                </Button>
                <Button onClick={clearSearch} variant="outline" disabled={isLoading}>
                  クリア
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* 案件一覧 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">案件一覧</h3>
              <Badge variant="secondary">
                {filteredProjects.length}件表示
              </Badge>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>案件を読み込み中...</p>
              </div>
            ) : error ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2" />
                <p>該当する案件が見つかりません</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {filteredProjects.map((project) => (
                  <Card 
                    key={project.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedProject?.id === project.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => onProjectSelect(
                      selectedProject?.id === project.id ? null : project
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">#{project.projectNo}</h4>
                            <Badge variant={project.status === "active" ? "default" : "secondary"}>
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{project.clientName}</p>
                          {project.title && (
                            <p className="text-sm text-muted-foreground">{project.title}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            最終同期: {new Date(project.lastSyncedAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <div className="flex flex-col space-y-1">
                          {selectedProject?.id === project.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 選択中の案件情報 */}
          {selectedProject && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">選択中の案件</h3>
                <Card className="bg-primary/5">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">案件情報</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>案件番号:</strong> #{selectedProject.projectNo}</p>
                          <p><strong>顧客名:</strong> {selectedProject.clientName}</p>
                          {selectedProject.title && (
                            <p><strong>案件名:</strong> {selectedProject.title}</p>
                          )}
                          <p><strong>ステータス:</strong> {selectedProject.status}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">操作</h4>
                        <div className="space-y-2">
                          <Button
                            onClick={() => window.open(getBoardEditUrl(selectedProject.id), '_blank')}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Board で編集
                          </Button>
                          {estimateData && (
                            <Button
                              onClick={handleSyncEstimate}
                              disabled={isSyncing}
                              size="sm"
                              className="w-full"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              見積を同期
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* 案件未選択の場合の説明 */}
          {!selectedProject && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">
                Board案件との連携は任意です。連携しない場合はこのまま次へ進んでください。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}