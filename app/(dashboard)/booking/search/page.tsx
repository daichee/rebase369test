"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoomSearch } from "@/components/booking/room-search"
import { Search, Calendar, ArrowRight } from "lucide-react"

export default function BookingSearchPage() {
  const router = useRouter()
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<any>(null)

  const handleRoomSelect = (roomIds: string[]) => {
    setSelectedRooms(roomIds)
  }

  const handleCreateBooking = () => {
    if (selectedRooms.length > 0) {
      // 選択された部屋と検索条件を予約作成ページに渡す
      const params = new URLSearchParams({
        selectedRooms: selectedRooms.join(','),
        ...(searchResults && {
          searchData: JSON.stringify({
            dateRange: searchResults.dateRange,
            guests: searchResults.guests,
          }),
        }),
      })
      router.push(`/booking/new?${params.toString()}`)
    }
  }

  const handleViewCalendar = () => {
    router.push('/calendar')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* ヘッダー */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">空室検索</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          宿泊期間と人数を指定して、最適な部屋を検索します。
          リアルタイムで空室状況を確認し、代替案もご提案します。
        </p>
      </div>

      {/* 検索機能の特徴 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              高度な検索条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 期間検索（開始日・終了日）</li>
              <li>• 年齢区分別人数検索</li>
              <li>• 部屋タイプ・フロア検索</li>
              <li>• オプション条件検索</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              リアルタイム確認
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 即座空室状況表示</li>
              <li>• 検索結果の即座更新</li>
              <li>• ライブ稼働率計算</li>
              <li>• 自動競合チェック</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-purple-600" />
              代替提案機能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 近接日程の提案</li>
              <li>• 類似条件での提案</li>
              <li>• 部屋組み合わせ提案</li>
              <li>• 最適化提案表示</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* メイン検索インターフェース */}
      <RoomSearch
        onRoomSelect={handleRoomSelect}
        onSearchResults={setSearchResults}
      />

      {/* 選択された部屋とアクション */}
      {selectedRooms.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">
              選択された部屋: {selectedRooms.length}室
            </CardTitle>
            <CardDescription className="text-green-700">
              選択した部屋で予約を作成するか、カレンダーで詳細を確認できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={handleCreateBooking} className="bg-green-600 hover:bg-green-700">
                この条件で予約作成
              </Button>
              <Button variant="outline" onClick={handleViewCalendar}>
                カレンダーで確認
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedRooms([])}
                className="text-muted-foreground"
              >
                選択をクリア
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 検索結果サマリー */}
      {searchResults && (
        <Card>
          <CardHeader>
            <CardTitle>検索結果サマリー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {searchResults.totalMatches}
                </div>
                <div className="text-sm text-muted-foreground">利用可能部屋</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {searchResults.occupancyRate?.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">稼働率</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {searchResults.suggestions?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">代替提案</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {searchResults.availableRooms?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">検索対象部屋</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}