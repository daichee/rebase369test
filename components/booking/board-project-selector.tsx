"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, ExternalLink, RefreshCw, Building2 } from "lucide-react"
import { useBoardProjects } from "@/lib/hooks/use-board-projects"

interface BoardProjectSelectorProps {
  onSelect: (projectId: number) => void
  onCancel: () => void
}

export function BoardProjectSelector({ onSelect, onCancel }: BoardProjectSelectorProps) {
  const { projects, loading, error, syncWithBoard, getBoardEditUrl } = useBoardProjects()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)

  const filteredProjects = projects.filter(
    (project) =>
      project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.projectNo.toString().includes(searchTerm) ||
      project.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSync = async () => {
    setSyncLoading(true)
    try {
      await syncWithBoard()
    } catch (err) {
      console.error("同期エラー:", err)
    } finally {
      setSyncLoading(false)
    }
  }

  const handleSelect = () => {
    if (selectedProjectId) {
      onSelect(selectedProjectId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Board案件選択
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading ? "animate-spin" : ""}`} />
            同期
          </Button>
        </CardTitle>
        <CardDescription>
          見積データを同期するBoard案件を選択してください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 検索 */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="顧客名、案件番号、タイトルで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 案件一覧 */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">案件を読み込み中...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm ? "検索条件に一致する案件が見つかりません" : "案件がありません"}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <RadioGroup value={selectedProjectId?.toString() || ""} onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
              {filteredProjects.map((project) => (
                <Card key={project.boardProjectId} className="p-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem 
                      value={project.boardProjectId.toString()} 
                      id={`project-${project.boardProjectId}`}
                      className="mt-1"
                    />
                    <Label 
                      htmlFor={`project-${project.boardProjectId}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{project.clientName}</span>
                            <Badge variant="outline">#{project.projectNo}</Badge>
                            <Badge variant={
                              project.status === "active" ? "default" :
                              project.status === "completed" ? "secondary" : "outline"
                            }>
                              {project.status}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              window.open(getBoardEditUrl(project.boardProjectId), "_blank")
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>

                        {project.title && (
                          <p className="text-sm text-muted-foreground">{project.title}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>案件ID: {project.boardProjectId}</span>
                          <span>最終同期: {new Date(project.lastSyncedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </Card>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* 操作ボタン */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedProjectId}
          >
            選択
          </Button>
        </div>

        {/* 注意事項 */}
        <Alert>
          <AlertDescription className="text-xs">
            <div className="font-medium mb-1">Board案件連携について</div>
            <ul className="space-y-1 ml-4 list-disc">
              <li>選択した案件の見積書に料金明細が自動追加されます</li>
              <li>見積データは予約確定時に同期されます</li>
              <li>Board側での編集も可能です（外部リンクボタンから）</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}