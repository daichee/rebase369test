"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { boardApiClient } from "@/lib/board/client"
import type { BoardProject } from "@/lib/board/types"

interface BoardProjectSelectorProps {
  bookingId: string
  onProjectSelect: (project: BoardProject) => void
  selectedProjectId?: number
}

export function BoardProjectSelector({ bookingId, onProjectSelect, selectedProjectId }: BoardProjectSelectorProps) {
  const [projects, setProjects] = useState<BoardProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<BoardProject | null>(null)
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  // Board案件一覧の取得
  const fetchProjects = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        client_name: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
        date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
        limit: 50,
      }

      const response = await boardApiClient.getProjects(params)
      setProjects(response.projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : "案件の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  // 初期読み込み
  useEffect(() => {
    fetchProjects()
  }, [])

  // 検索実行
  const handleSearch = () => {
    fetchProjects()
  }

  // 案件選択
  const handleProjectSelect = (project: BoardProject) => {
    setSelectedProject(project)
    onProjectSelect(project)
  }

  // Board編集ページを開く
  const openBoardEdit = (projectId: number) => {
    const url = boardApiClient.getEditUrl(projectId, "estimate")
    window.open(url, "_blank")
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      active: "default",
      completed: "outline",
      cancelled: "destructive",
    } as const

    const labels = {
      draft: "下書き",
      active: "進行中",
      completed: "完了",
      cancelled: "キャンセル",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* 検索・フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Board案件検索
          </CardTitle>
          <CardDescription>予約に関連するBoard案件を選択してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">顧客名・案件名</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="検索キーワード"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="active">進行中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>開始日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "yyyy年MM月dd日", { locale: ja }) : "開始日を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>終了日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "yyyy年MM月dd日", { locale: ja }) : "終了日を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                検索
              </Button>
              <Button variant="outline" onClick={fetchProjects} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 案件一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>案件一覧</CardTitle>
          <CardDescription>{projects.length}件の案件が見つかりました</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>案件を読み込み中...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>選択</TableHead>
                  <TableHead>案件番号</TableHead>
                  <TableHead>顧客名</TableHead>
                  <TableHead>案件名</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>見積金額</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} className={selectedProject?.id === project.id ? "bg-blue-50" : ""}>
                    <TableCell>
                      <Button
                        variant={selectedProject?.id === project.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleProjectSelect(project)}
                      >
                        {selectedProject?.id === project.id ? <CheckCircle className="h-4 w-4" /> : "選択"}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{project.project_no}</TableCell>
                    <TableCell>{project.client_name}</TableCell>
                    <TableCell>{project.title || "-"}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>
                      {project.estimate_amount ? `¥${project.estimate_amount.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>{new Date(project.created_at).toLocaleDateString("ja-JP")}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openBoardEdit(project.id)}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Board
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>該当する案件が見つかりませんでした</p>
              <p className="text-sm mt-2">検索条件を変更してお試しください</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 選択された案件の詳細 */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              選択された案件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">案件番号</Label>
                <p className="text-lg font-bold">{selectedProject.project_no}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">顧客名</Label>
                <p className="text-lg">{selectedProject.client_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">案件名</Label>
                <p>{selectedProject.title || "-"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">ステータス</Label>
                <div className="mt-1">{getStatusBadge(selectedProject.status)}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => openBoardEdit(selectedProject.id)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Board編集ページを開く
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
