"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">ReBASE 369 予約システム</h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-3xl">効率的な宿泊予約管理を実現する総合システム</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">ダッシュボードへ</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">ログイン</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle>簡単予約管理</CardTitle>
              <CardDescription>直感的なインターフェースで予約を管理</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                カレンダービューやリスト表示で予約状況を一目で確認できます。ドラッグ＆ドロップで簡単に予約の変更が可能です。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>料金計算エンジン</CardTitle>
              <CardDescription>複雑な料金体系も自動計算</CardDescription>
            </CardHeader>
            <CardContent>
              <p>シーズン料金、部屋タイプ、宿泊人数に応じた料金を自動計算。オプションやアドオンにも対応しています。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>外部連携</CardTitle>
              <CardDescription>Board APIとの連携</CardDescription>
            </CardHeader>
            <CardContent>
              <p>予約データをBoardの見積もりと同期。PDFの自動生成や顧客情報の連携が可能です。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
