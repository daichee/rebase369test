# Board案件メタデータ分析

## 概要
Boardシステムの案件管理におけるメタデータ構造の分析結果

## Board案件の主要フィールド

### 基本情報
- **案件名** (`title`): プロジェクトの名称
- **案件番号** (`project_number`): システム内での一意識別子
- **顧客名** (`client_name`): 発注者・顧客の名称
- **ステータス** (`status`): 案件の進行状況

### 日程情報
- **開始日** (`start_date`): プロジェクト開始予定日
- **終了日** (`end_date`): プロジェクト完了予定日
- **作成日** (`created_at`): 案件登録日時
- **更新日** (`updated_at`): 最終更新日時

### 金額情報
- **見積金額** (`estimated_amount`): 予想金額
- **確定金額** (`confirmed_amount`): 確定済み金額
- **税込み/税抜き** (`tax_included`): 税金の取り扱い

### 担当者情報
- **営業担当** (`sales_person`): 営業責任者
- **プロジェクト担当** (`project_manager`): プロジェクト管理者

### 分類・カテゴリ
- **業種** (`industry`): 顧客の業界・業種
- **案件種別** (`project_type`): 案件の種類・カテゴリ
- **優先度** (`priority`): 案件の重要度

## 予約システムとのマッピング戦略

### 1. 基本マッピング
```typescript
// 予約システム → Board案件
{
  title: `${guestName}様 宿泊予約`,
  client_name: customer.name || guest_name,
  start_date: booking.checkIn,
  end_date: booking.checkOut,
  estimated_amount: booking.totalAmount,
  project_type: "宿泊予約",
  status: "見積中"
}
```

### 2. 見積書連携
```typescript
// 予約詳細 → Board見積書
{
  project_id: board_project.id,
  items: [
    {
      name: "宿泊費",
      quantity: nights,
      unit_price: room.basePrice,
      amount: room.basePrice * nights
    },
    {
      name: "人数追加料金", 
      quantity: additional_guests,
      unit_price: person_rate,
      amount: additional_guests * person_rate
    }
  ]
}
```

## UI設計要件

### 1. 案件選択インターフェース
- 案件番号での検索機能
- 顧客名での絞り込み
- ステータス別フィルター
- 日付範囲での絞り込み

### 2. 見積書比較表示
- 既存見積 vs 新規見積の並列表示
- 変更項目のハイライト表示
- 金額差分の詳細表示
- 項目別の増減表示

### 3. 確認ダイアログ
- 同期対象の詳細情報表示
- エラー時の詳細メッセージ
- 同期履歴の表示機能

## 技術実装要件

### 1. API認証管理
- API Key/Tokenの暗号化保存
- 認証エラー時の適切な処理
- 接続テスト機能

### 2. データ変換処理
- 予約データ → Board形式の変換
- 料金体系の詳細マッピング
- バリデーション機能

### 3. エラーハンドリング
- ネットワークエラー対応
- データ不整合の検知
- リトライ機能

## セキュリティ考慮事項

### 1. データ保護
- 顧客情報の暗号化
- アクセスログの記録
- 権限管理

### 2. API安全性
- レート制限の遵守
- タイムアウト設定
- SSL/TLS通信の強制