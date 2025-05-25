# ReBASE 369 予約システム

淡路Reベース369の予約台帳管理・見積自動生成システム

## 🚀 クイックスタート

### 1. 依存関係のインストール

\`\`\`bash
npm install
\`\`\`

### 2. Supabase CLIのインストール

\`\`\`bash
npm install -g supabase
\`\`\`

### 3. Supabaseローカル環境の起動

\`\`\`bash
# Supabaseローカル環境を初期化・起動
supabase start

# データベースの型定義を生成
npm run db:types
\`\`\`

### 4. 環境変数の設定

\`\`\`bash
# 環境変数ファイルをコピー
cp .env.local.example .env.local

# Supabaseの接続情報を設定（supabase statusで確認）
supabase status
\`\`\`

### 5. 開発サーバーの起動

\`\`\`bash
npm run dev
\`\`\`

ブラウザで http://localhost:3000 を開いてください。

## 📋 利用可能なスクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - 本番ビルド
- `npm run start` - 本番サーバー起動
- `npm run lint` - ESLintチェック
- `npm run type-check` - TypeScriptチェック
- `npm run db:types` - Supabase型定義生成
- `npm run db:reset` - データベースリセット
- `npm run supabase:start` - Supabaseローカル環境起動
- `npm run supabase:stop` - Supabaseローカル環境停止
- `npm run supabase:status` - Supabaseステータス確認

## 🏗️ アーキテクチャ

### 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **状態管理**: Zustand
- **型安全性**: TypeScript

### 主要機能

1. **複雑料金計算エンジン**
   - 年齢区分×曜日×シーズンの自動計算
   - 室料（固定）+ 個人料金（変動）
   - 大部屋中部屋 vs 個室の料金体系

2. **Board API連携**
   - 見積もりデータの自動同期
   - 外部システム連携

3. **稼働状況管理**
   - ダブルブッキング防止
   - リアルタイム空室管理

4. **13部屋管理**
   - 実際の部屋構成に対応
   - 個室・大部屋・中部屋の管理

## 🗄️ データベース構造

### 主要テーブル

- `projects` - 予約メインテーブル
- `rooms` - 部屋マスタ
- `project_rooms` - 部屋割り当て
- `rates` - 料金マトリクス
- `seasons` - シーズン設定
- `add_ons` - オプション・サービス

## 🔧 開発ガイド

### Supabaseローカル開発

\`\`\`bash
# ローカル環境起動
supabase start

# マイグレーション適用
supabase db reset

# 型定義生成
npm run db:types

# ダッシュボード確認
# Studio: http://127.0.0.1:54323
# API: http://127.0.0.1:54321
\`\`\`

### 新しいマイグレーション作成

\`\`\`bash
supabase migration new your_migration_name
\`\`\`

### 本番デプロイ

\`\`\`bash
# Vercelにデプロイ
vercel --prod

# Supabase本番環境にマイグレーション適用
supabase db push --project-ref your-project-ref
\`\`\`

## 🎯 主要な特徴

- **複雑料金計算**: 年齢区分×曜日×シーズンの自動計算
- **Board API連携**: 見積もりデータの完全同期
- **ダブルブッキング防止**: リアルタイム重複チェック
- **13部屋管理**: 実際の部屋構成に対応
- **リアルタイム更新**: 複数ユーザー同時利用
- **モバイル対応**: 全画面レスポンシブ

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. Supabaseローカル環境が起動しているか
2. 環境変数が正しく設定されているか
3. 依存関係が最新版か

\`\`\`bash
# Supabaseステータス確認
supabase status

# 依存関係の更新
npm update
