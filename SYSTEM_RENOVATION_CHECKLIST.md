# 🔄 システムリノベーション完全チェックリスト

## 📋 プロジェクト概要

### 🎯 実現したいこと
- ✅ **コア機能に絞る**: Board機能を除去し、予約管理・料金計算・カレンダーに集約
- ✅ **ディレクトリ構造リノベーション**: 直感的な3セクション構成（ダッシュボード・予約管理・カレンダー）
- ✅ **UI/UXリノベーション**: 各ページの情報表示を直感的に、レスポンシブ対応
- ✅ **コードリファクタリング**: エラーが少なく管理しやすいコードベース

---

## 🔥 フェーズ1: Board機能完全除去（最優先）

### 1.1 コンポーネント除去
- [ ] **Board専用コンポーネント削除** (19個)
  - [ ] `components/board/board-project-selector.tsx` 削除
  - [ ] `components/board/board-sync-status.tsx` 削除
  - [ ] `components/board/estimate-sync-button.tsx` 削除
  - [ ] `components/booking/board-sync-dropdown.tsx` 削除
  - [ ] `components/booking/board-project-selector.tsx` 削除
  - [ ] `components/booking/sync-confirmation-dialog.tsx` 削除
  - [ ] `components/dashboard/board-sync-status.tsx` 削除

### 1.2 ページ・API除去
- [ ] **Board専用ページ削除**
  - [ ] `app/(dashboard)/admin/board-sync/` ディレクトリ完全削除
  - [ ] `app/(dashboard)/booking/[id]/board-project/page.tsx` 削除
- [ ] **Board API削除**
  - [ ] `app/api/board/` ディレクトリ完全削除（5ファイル）
  - [ ] `app/api/board/[id]/route.ts` 削除
  - [ ] `app/api/board/connection/route.ts` 削除
  - [ ] `app/api/board/edit-url/route.ts` 削除
  - [ ] `app/api/board/projects/route.ts` 削除
  - [ ] `app/api/board/sync/route.ts` 削除

### 1.3 ライブラリ・ロジック除去
- [ ] **Board関連ライブラリ削除**
  - [ ] `lib/board/` ディレクトリ完全削除（4ファイル）
  - [ ] `lib/board/board-sync-service.ts` 削除
  - [ ] `lib/board/client.ts` 削除
  - [ ] `lib/board/mapper.ts` 削除
  - [ ] `lib/board/types.ts` 削除
- [ ] **Board関連Hooks削除**
  - [ ] `hooks/use-board-projects.ts` 削除

### 1.4 予約フローからBoard要素除去
- [ ] **予約ウィザードのBoard関連ステップ除去**
  - [ ] `components/booking/booking-wizard.tsx` のBoard案件選択ステップ削除
  - [ ] Board関連のZodスキーマ削除
  - [ ] Board同期状態管理の削除
- [ ] **予約詳細画面のBoard機能除去**
  - [ ] 予約詳細でのBoard案件表示削除
  - [ ] Board同期ボタン・ステータス削除

### 1.5 ナビゲーションからBoard除去
- [ ] **管理画面ナビゲーション簡素化**
  - [ ] `app/(dashboard)/admin/layout.tsx` のBoard同期メニュー削除
  - [ ] ダッシュボードのBoard同期ステータス削除

---

## 🎨 フェーズ2: ナビゲーション・UX大改革

### 2.1 ディレクトリ構造リノベーション
- [ ] **管理画面→設定への統合**
  - [ ] `mkdir -p app/(dashboard)/settings/`
  - [ ] `mkdir -p app/(dashboard)/settings/rooms/`
  - [ ] `mkdir -p app/(dashboard)/settings/pricing/`
  - [ ] `mkdir -p app/(dashboard)/settings/options/`
  - [ ] `mkdir -p app/(dashboard)/settings/data/`
  - [ ] `mv app/(dashboard)/admin/rooms/ app/(dashboard)/settings/rooms/`
  - [ ] `mv app/(dashboard)/admin/pricing/ app/(dashboard)/settings/pricing/`
  - [ ] `mv app/(dashboard)/admin/options/ app/(dashboard)/settings/options/`
  - [ ] `mv app/(dashboard)/admin/data/ app/(dashboard)/settings/data/`
  - [ ] `rm -rf app/(dashboard)/admin/`

### 2.2 ナビゲーション簡素化
- [ ] **メインナビゲーション更新**
  - [ ] `app/(dashboard)/layout.tsx` のナビゲーション3セクション化
    ```typescript
    const navigation = [
      { name: "ダッシュボード", icon: "📊", href: "/dashboard" },
      { name: "予約管理", icon: "📝", href: "/booking" },
      { name: "カレンダー", icon: "📅", href: "/calendar" },
      { name: "設定", icon: "⚙️", href: "/settings" },
    ]
    ```
  - [ ] 不要なサブメニュー削除
  - [ ] レスポンシブナビゲーション対応

### 2.3 予約フロー簡素化
- [ ] **5ステップ→3ステップ化**
  - [ ] `mkdir -p components/booking/simple/`
  - [ ] `SimpleBookingWizard.tsx` 新規作成
    ```typescript
    const SIMPLIFIED_WIZARD = [
      { step: 1, title: "📅 基本情報", desc: "日程・人数・代表者" },
      { step: 2, title: "🏠 部屋・オプション", desc: "部屋選択とオプション統合" },
      { step: 3, title: "✅ 確認・完了", desc: "見積・予約確定" },
    ]
    ```
  - [ ] `BasicInfoStep.tsx` 作成（日程・人数・代表者統合）
  - [ ] `RoomAndOptionsStep.tsx` 作成（部屋選択とオプション統合）
  - [ ] `ConfirmationStep.tsx` 作成（確認画面）
- [ ] **既存BookingWizardとの置き換え**
  - [ ] `app/(dashboard)/booking/new/page.tsx` 更新
  - [ ] 古いウィザードコンポーネント削除

---

## 💰 フェーズ3: 料金計算エンジン最適化

### 3.1 料金体系簡素化
- [x] **固定料金表の実装**
  - [x] `mkdir -p lib/pricing/simple/`
  - [x] `SimplePriceCalculator.ts` 新規作成
  - [x] 料金表画像通りの固定料金テーブル実装
    ```typescript
    const FIXED_RATE_TABLE = {
      shared: {
        adult: { weekday: 4800, weekend: 5856, peak_weekday: 5520, peak_weekend: 6734 },
        student: { weekday: 4000, weekend: 4880, peak_weekday: 4600, peak_weekend: 5612 },
        // ...
      },
      private: {
        adult: { weekday: 8500, weekend: 10370, peak_weekday: 9775, peak_weekend: 11926 },
        // ...
      }
    }
    ```

### 3.2 計算ロジック簡素化
- [x] **複雑な係数計算の削除**
  - [x] 日別計算→期間一括計算に変更
  - [x] 動的係数→固定料金表に変更
  - [x] 340行の複雑計算→280行の直接計算に簡素化
- [x] **計算パフォーマンス向上**
  - [x] リアルタイム計算の高速化
  - [x] 不要な再計算処理の削除

---

## 🏠 フェーズ4: レスポンシブ・モダンUI実装

### 4.1 統一レスポンシブパターン適用
- [ ] **全コンポーネントのレスポンシブクラス統一**
  - [ ] `components/booking/room-selector.tsx` 修正
    ```typescript
    // 修正前: "grid gap-4 sm:grid-cols-2"
    // 修正後: "grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    ```
  - [ ] `components/dashboard/room-status-grid.tsx` 修正
  - [ ] `components/calendar/booking-calendar.tsx` 修正
  - [ ] 全UIコンポーネントの統一パターン適用

### 4.2 ダッシュボード再設計
- [ ] **カード型レイアウト実装**
  - [ ] 統計カードの再設計（売上・稼働率・予約数・空室状況）
  - [ ] チャートの見やすさ向上
  - [ ] モバイル対応の強化
- [ ] **情報密度の最適化**
  - [ ] 重要情報の優先表示
  - [ ] 不要な情報の除去

### 4.3 カレンダー表示の改善
- [ ] **13部屋表示の最適化**
  - [ ] モバイルでの部屋表示改善
  - [ ] 週次・月次表示の使いやすさ向上
  - [ ] 予約ブロックの視認性向上

---

## 🔧 フェーズ5: データベース最適化

### 5.1 Board関連テーブル削除
- [ ] **不要テーブルの完全削除**
  ```sql
  -- Board関連テーブル・カラム完全削除
  DROP TABLE IF EXISTS board_sync_log;
  DROP TABLE IF EXISTS board_projects;
  ALTER TABLE projects DROP COLUMN IF EXISTS board_project_id;
  ```
- [ ] **データ整合性確保**
  - [ ] 既存予約データの保護
  - [ ] 外部キー制約の整理

### 5.2 パフォーマンス最適化
- [ ] **事前計算料金ビューの作成**
  ```sql
  CREATE MATERIALIZED VIEW calculated_rates AS
  SELECT room_usage, age_group, day_type, season_type,
         (固定料金計算) as final_price
  FROM (料金パターン組み合わせ);
  ```
- [ ] **空室チェック最適化**
  - [ ] インデックス追加
  - [ ] クエリパフォーマンス改善

---

## 📱 フェーズ6: コードリファクタリング

### 6.1 TypeScript・エラーハンドリング強化
- [x] **型安全性の強化**
  - [x] Board関連型定義の削除
  - [x] 簡素化された型定義の整理
  - [x] 未使用import・型の削除
- [x] **エラーハンドリング改善**
  - [x] API呼び出しエラーの統一的処理
  - [x] ユーザーフレンドリーなエラーメッセージ
  - [x] フォールバック機能の実装

### 6.2 パフォーマンス最適化
- [x] **Bundle Size削減**
  - [x] 未使用ライブラリの削除
  - [x] 動的インポートの活用
  - [x] コードスプリッティング最適化
- [x] **ページロード改善**
  - [x] 遅延ローディングの実装
  - [x] 画像最適化
  - [x] キャッシュ戦略の改善

---

## 📊 フェーズ7: 品質保証・テスト

### 7.1 動作確認テスト
- [ ] **主要機能テスト**
  - [ ] 予約作成フローの全ステップ確認
  - [ ] 料金計算の正確性確認
  - [ ] カレンダー表示・操作確認
  - [ ] レスポンシブ表示確認
- [ ] **エラーケーステスト**
  - [ ] 不正入力に対する適切な処理
  - [ ] ネットワークエラーハンドリング
  - [ ] データ不整合時の処理

### 7.2 パフォーマンステスト
- [ ] **ページロード速度測定**
  - [ ] 各ページの読み込み時間確認
  - [ ] 大量データでのレスポンス確認
  - [ ] モバイルでのパフォーマンス確認
- [ ] **Lighthouse スコア確認**
  - [ ] Performance, Accessibility, Best Practices, SEO

---

## 📋 各フェーズの期待される効果

### 📊 定量的効果
- **コードベース削減**: 40%（120→72ファイル）
- **Bundle Size削減**: 35%（Board関連ライブラリ除去）
- **ページロード改善**: 50%高速化
- **開発効率向上**: 3倍（複雑度削減）

### 🎯 定性的効果
- **ユーザビリティ**: 直感的な3セクション構成
- **保守性**: 機能別ディレクトリで管理容易
- **拡張性**: シンプルな構造で新機能追加容易
- **安定性**: 依存関係削減でエラー激減

---

## ⚠️ 各フェーズでの注意事項

### プロダクション環境での安全な開発
- [ ] **小さな変更単位**: 各タスクを1-2ファイルずつコミット
- [ ] **バックアップ確認**: 重要変更前のSupabase手動バックアップ
- [ ] **段階的デプロイ**: フェーズごとの動作確認
- [ ] **ロールバック計画**: 問題発生時の復旧手順準備

### データ保護
- [ ] **既存データ保護**: 予約データの整合性維持
- [ ] **段階的適用**: データベーススキーマ変更の慎重な実行
- [ ] **エラー監視**: Vercel・Supabaseの管理画面で常時監視

---

**総タスク数**: 87項目  
**実装期間目安**: 3-4週間  
**優先度**: フェーズ1 > フェーズ2 > フェーズ3 > フェーズ4 > フェーズ5 > フェーズ6 > フェーズ7  
**完成目標**: 直感的で使いやすいコア予約システム