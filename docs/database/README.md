# データベース設計書

## 📊 プロダクション環境設定

### 接続情報
- **Database URL**: `postgresql://postgres:j&yrF9U!7dBq&p&@db.pgycxpxgozgqlgboafqe.supabase.co:5432/postgres`
- **Project ID**: `pgycxpxgozgqlgboafqe`
- **Project Name**: `rebase369_test`
- **管理画面**: https://supabase.com/dashboard/project/pgycxpxgozgqlgboafqe

## 🗄️ テーブル構成

### 予約管理テーブル
- **projects** - 予約メインテーブル
- **project_rooms** - 部屋割り当て（稼働管理）
- **project_items** - 明細（オプション・個人料金）

### マスタデータテーブル
- **rooms** - 部屋マスタ（12部屋: 2F 5部屋、3F 7部屋）
- **seasons** - シーズン設定
- **rates** - 料金マトリクス
- **add_ons** - オプション・サービス

### 高度機能テーブル
- **booking_locks** - 排他制御・予約ロック
- **user_profiles** - ユーザープロファイル

### 認証テーブル
- Supabase Auth統合テーブル群

## 📋 データ管理

### マイグレーション
- `supabase/migrations/` 配下に実行済み
- プロダクション環境に既に適用済み

### シードデータ
- `supabase/seed.sql` でサンプルデータ投入
- 12部屋（2F: R201-R205、3F: R301-R307）
- 料金表画像準拠の正確な料金設定
- 5件のサンプル予約データ（関西大学・株式会社テックソリューション）
- 2025年6-7月期間の予約データ

## ⚠️ 重要事項
- **本番データベース直接操作**: ローカル環境は使用しない
- **バックアップ確認**: 重要変更前は必ずSupabase管理画面で確認
- **段階的変更**: 大きな変更は段階的に適用