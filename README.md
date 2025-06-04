# ReBASE 369 予約システム

淡路Reベース369の予約台帳管理・見積自動生成システム

## 🎯 システム概要

**淡路Reベース369（廃校活用宿泊施設）の予約台帳管理 + 見積自動生成システム**

### 解決する課題
1. **予約台帳管理**: 12部屋の稼働状況をカレンダーで一元管理し、空室確認を瞬時に行う
2. **見積自動生成**: 複雑な料金体系（シーズン×曜日×年齢区分×オプション）を自動計算

### システム価値
- **予約問い合わせ**: 電話での空室確認を即座に回答（現在：数分→数秒）
- **見積作成**: 複雑な料金計算を自動化（現在：数時間→数分）
- **ダブルブッキング防止**: 高度な排他制御・競合検知でヒューマンエラー完全撲滅

## 🛠 技術構成

### アーキテクチャ
```
Frontend: Next.js 14 + shadcn/ui
Backend: Supabase (PostgreSQL + Edge Functions)
Development: プロダクション環境のみ（Vercel + Supabase）
```

### 技術スタック
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + TailwindCSS
- **Language**: TypeScript (strict mode)
- **Database**: Supabase PostgreSQL
- **State**: TanStack Query + Zustand
- **Validation**: Zod
- **Deployment**: Vercel

## 📋 主要機能

### 🗓 予約台帳管理
- **12部屋のカレンダー表示** (月/週表示切替、フロア別フィルタリング)
- **リアルタイム空室検索** (期間・人数・部屋タイプ)
- **高度なダブルブッキング防止** (RPC関数・排他制御・競合検知・予約ロック機能)
- **3ステップ予約ウィザード** (日程選択→部屋選択→確認完了)

### 💰 料金計算エンジン
- **高度な料金体系自動計算**: 部屋タイプ × シーズン × 曜日 × 年齢区分
- **動的設定対応**: データベース設定優先＋固定料金テーブルフォールバック
- **日本式料金体系**: 個室利用時の大幅料金差、週末22%割増、繁忙期15%割増
- **6段階年齢区分**: 大人/学生/小学生/未就学児/乳幼児/付添
- **オプション料金**: 食事（年齢別）+ 施設利用（時間制）+ 備品
- **リアルタイム計算**: 条件変更時の瞬時再計算（高速化済み）

### 🎨 ダッシュボード・分析
- **KPI表示**: 稼働率、売上、予約数、客単価
- **ビジュアル分析**: グラフ・チャートによる推移表示
- **リアルタイム監視**: 部屋状況、予約状況

### 🔧 管理機能
- **12部屋マスタ管理** (2F 5部屋、3F 7部屋) + 完全CRUD操作
- **料金マトリクス管理** (視覚的料金設定・動的更新)
- **顧客データベース** (検索・統計・履歴)
- **システム設定** (データベース・API・通知)
- **リアルタイム監視** (部屋状況・予約状況の実時間更新)

## 📁 ディレクトリ構造

```
app/                              # Next.js 14 App Router
├── (dashboard)/                  # メインアプリケーション
│   ├── dashboard/               # ダッシュボード（KPI・統計）
│   ├── booking/                 # 予約管理（検索・作成・編集）
│   ├── calendar/                # カレンダー（月/週表示）
│   ├── admin/                   # 管理機能（部屋・料金・設定）
│   └── settings/                # ユーザー設定
├── api/                         # API Routes
│   ├── booking/                 # 予約API (CRUD + 競合検知)
│   ├── rooms/                   # 部屋API (検索・管理)
│   └── pricing/                 # 料金計算API
└── login/                       # 認証

components/                      # React Components
├── ui/                         # shadcn/ui Components (40+)
├── booking/                    # 予約関連 (ウィザード・検索・選択)
├── calendar/                   # カレンダー関連
├── dashboard/                  # ダッシュボード (統計・チャート)
├── admin/                      # 管理機能 (部屋・料金マトリクス)
├── auth/                       # 認証 (ガード・プロバイダー)
└── common/                     # 共通コンポーネント

lib/                            # Utility Functions
├── supabase/                   # Supabase関連（クライント・型）
├── pricing/                    # 料金計算エンジン
├── availability/               # 空室チェック・稼働管理
├── booking/                    # ダブルブッキング防止
├── hooks/                      # Custom Hooks (10+)
└── utils/                      # ユーティリティ

store/                          # State Management
├── booking-store.ts            # 予約状態管理
├── pricing-store.ts            # 料金状態管理
├── room-store.ts               # 部屋状態管理
└── ui-store.ts                 # UI状態管理

tests/                          # テストスイート
├── unit/                       # Unit Tests (料金計算・空室チェック)
├── integration/                # Integration Tests (予約フロー)
└── e2e/                        # E2E Tests (レスポンシブ・パフォーマンス)

docs/                           # ドキュメント
├── database/                   # データベース設計
├── development/                # 開発ガイドライン
└── features/                   # 機能説明
```

## 🚀 開発・運用

### 開発環境
- **プロダクション環境のみ**: すべての開発・検証をVercel環境で実施
- **データベース**: Supabaseプロダクション環境を直接使用
- **デプロイ**: GitHubプッシュ時の自動デプロイ
- **テスト**: 包括的テストスイート（Unit/Integration/E2E）

### 品質・パフォーマンス
- **TypeScript**: Strict mode完全対応
- **エラーハンドリング**: ApiErrorHandler統一処理
- **リアルタイム機能**: Supabaseリアルタイム活用
- **レスポンシブ対応**: モバイル・タブレット最適化

### データベース
- **12部屋データ**: 2F 5部屋（R201-R205）、3F 7部屋（R301-R307）
- **サンプル予約**: 関西大学・株式会社テックソリューション（2025年6-7月）
- **正確な料金設定**: 料金表画像準拠のシードデータ
- **高度な排他制御**: booking_locksテーブル + RPC関数

### 関連ドキュメント
- [データベース設計](./docs/database/README.md)
- [開発ガイドライン](./docs/development/README.md)
- [ダブルブッキング防止機能](./docs/features/double-booking-prevention.md)
- [システムリノベーションチェックリスト](./SYSTEM_RENOVATION_CHECKLIST.md)
- [開発者向けガイドライン](./CLAUDE.md)
