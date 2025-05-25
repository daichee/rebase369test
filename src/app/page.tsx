import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ヒーローセクション */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">ReBASE 369 予約管理システム</h1>
          <p className="text-xl text-muted-foreground mb-8">
            淡路島の廃校活用宿泊施設の予約台帳管理と見積自動生成システム
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg">ダッシュボードへ</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                ログイン
              </Button>
            </Link>
          </div>
        </div>

        {/* 機能紹介 */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📅 予約管理</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                直感的なカレンダーインターフェースで予約状況を一目で確認。 ダブルブッキングを防ぐ自動チェック機能付き。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">💰 料金計算</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                シーズン料金、平日・休日料金、オプション料金を自動計算。 複雑な料金体系も簡単に管理できます。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🔗 Board連携</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Boardプロジェクト管理システムとの連携で、 予約情報を自動同期し業務効率を向上。
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* システム概要 */}
        <Card>
          <CardHeader>
            <CardTitle>システム概要</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">主要機能</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 予約作成・編集・キャンセル</li>
                  <li>• カレンダー表示・空室確認</li>
                  <li>• 料金自動計算・見積書生成</li>
                  <li>• 部屋・料金・オプション管理</li>
                  <li>• Board API連携</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">技術仕様</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Next.js 15 + TypeScript</li>
                  <li>• Supabase (認証・データベース)</li>
                  <li>• Tailwind CSS + shadcn/ui</li>
                  <li>• Zustand (状態管理)</li>
                  <li>• Jest + Testing Library</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
