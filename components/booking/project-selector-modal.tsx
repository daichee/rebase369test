"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, FolderOpen, Calendar, User, Yen } from "lucide-react"
import { EstimateComparison } from "./estimate-comparison"

interface ProjectSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  booking: any
  customer: any
  room: any
}

// モック案件データ（実際にはBoard APIから取得）
const mockBoardProjects = [
  {
    id: "proj-001",
    project_number: "PRJ-2024-001",
    title: "田中太郎様 宿泊予約",
    client_name: "田中太郎",
    client_company: "田中商事株式会社",
    status: "見積中",
    estimated_amount: 45000,
    start_date: "2024-06-01",
    end_date: "2024-06-03",
    created_at: "2024-05-20",
    has_estimate: true
  },
  {
    id: "proj-002",
    project_number: "PRJ-2024-002", 
    title: "佐藤花子様 宿泊予約",
    client_name: "佐藤花子",
    client_company: "佐藤工業",
    status: "受注",
    estimated_amount: 78000,
    start_date: "2024-06-10",
    end_date: "2024-06-12",
    created_at: "2024-05-22",
    has_estimate: true
  },
  {
    id: "proj-003",
    project_number: "PRJ-2024-003",
    title: "山田次郎様 宿泊予約",
    client_name: "山田次郎", 
    client_company: "",
    status: "見積中",
    estimated_amount: 32000,
    start_date: "2024-06-15",
    end_date: "2024-06-16",
    created_at: "2024-05-25",
    has_estimate: false
  },
]

export function ProjectSelectorModal({
  isOpen,
  onClose,
  booking,
  customer,
  room
}: ProjectSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [boardProjects, setBoardProjects] = useState(mockBoardProjects)

  // 現在の予約者と関連する案件を優先表示するため検索
  useEffect(() => {
    if (isOpen && customer) {
      setSearchTerm(customer.name || "")
    }
  }, [isOpen, customer])

  const filteredProjects = boardProjects.filter(project =>
    project.project_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client_company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project)
  }

  const handleProceedToComparison = () => {
    if (selectedProject) {
      setShowComparison(true)
    }
  }

  const handleComparisonComplete = () => {
    setShowComparison(false)
    onClose()
    // ここで実際にBoard APIに更新を送信する処理を実装
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      "見積中": "secondary",
      "受注": "default", 
      "完了": "outline",
      "キャンセル": "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    )
  }

  if (showComparison && selectedProject) {
    return (
      <EstimateComparison
        isOpen={true}
        onClose={() => setShowComparison(false)}
        onConfirm={handleComparisonComplete}
        project={selectedProject}
        booking={booking}
        customer={customer}
        room={room}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Board案件選択
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 検索バー */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="案件番号、案件名、顧客名、会社名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 案件一覧 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Board登録済み案件から選択 ({filteredProjects.length}件)
            </Label>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedProject?.id === project.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleProjectSelect(project)}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {project.project_number}
                        </Badge>
                        {getStatusBadge(project.status)}
                        {!project.has_estimate && (
                          <Badge variant="destructive" className="text-xs">
                            見積未作成
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">見積金額</p>
                        <p className="font-bold text-lg">¥{project.estimated_amount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-base">{project.title}</h4>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{project.client_name}</p>
                            {project.client_company && (
                              <p className="text-xs text-muted-foreground">{project.client_company}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">期間</p>
                            <p>{new Date(project.start_date).toLocaleDateString('ja-JP')} 〜</p>
                            <p>{new Date(project.end_date).toLocaleDateString('ja-JP')}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">作成日</p>
                          <p>{new Date(project.created_at).toLocaleDateString('ja-JP')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredProjects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>該当する案件が見つかりません</p>
                  <p className="text-sm">検索条件を変更してお試しください</p>
                </div>
              )}
            </div>
          </div>

          {/* 選択された案件の詳細 */}
          {selectedProject && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">選択中の案件</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">案件番号・案件名</Label>
                    <p className="font-medium">{selectedProject.project_number}</p>
                    <p>{selectedProject.title}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">顧客情報</Label>
                    <p className="font-medium">{selectedProject.client_name}</p>
                    {selectedProject.client_company && (
                      <p className="text-xs">{selectedProject.client_company}</p>
                    )}
                  </div>
                </div>
                {!selectedProject.has_estimate && (
                  <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                    ⚠️ この案件にはまだ見積書が作成されていません。新規作成されます。
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleProceedToComparison}
            disabled={!selectedProject}
          >
            選択した案件で見積を更新
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}