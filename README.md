# ReBASE 369 予約システム

淡路Reベース369の予約台帳管理・見積自動生成システム



## 🎯 プロジェクト概要

### システム目的
**淡路Reベース369（廃校活用宿泊施設）の予約台帳管理 + 見積自動生成システム**

### 解決する課題
1. **予約台帳管理**: 13部屋の稼働状況をカレンダーで一元管理し、空室確認を瞬時に行う
2. **見積自動生成**: 複雑な料金体系（シーズン×曜日×年齢区分×オプション）を自動計算し、Board APIで見積データ同期

### システム価値
- **予約問い合わせ**: 電話での空室確認を即座に回答（現在：数分→数秒）
- **見積作成**: 複雑な料金計算を自動化（現在：数時間→数分）
- **請求漏れ防止**: Board APIとの見積データ同期でヒューマンエラー撲滅

---

## 🛠 技術構成

### アーキテクチャ
```
Frontend: Next.js 14 + shadcn/ui (v0.dev生成)
Backend: Supabase (PostgreSQL + Edge Functions)
External API: Board API (見積データ同期)
Development: v0.dev → Claude Code → Production
```

### 技術スタック
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + TailwindCSS
- **Language**: TypeScript (strict mode)
- **Database**: Supabase PostgreSQL
- **State**: TanStack Query + Zustand
- **Validation**: Zod
- **Deployment**: Vercel

---

## 🎨 v0.dev 画面生成指示

### 1. 予約台帳カレンダー
```typescript
"Create a hotel booking calendar component with:
- Monthly/weekly/daily view toggle
- 13 rooms displayed as rows (2F: 5 rooms, 3F: 8 rooms)
- Booking blocks showing occupied periods with guest names
- Available periods highlighted in green
- Quick booking functionality with click-to-create
- Room capacity indicators (5, 10, 21, 25, 35 guests)
- Occupancy rate display per room and overall
- TypeScript + shadcn/ui + TailwindCSS"
```

### 2. 予約作成ウィザード
```typescript
"Create a 5-step booking wizard with:
- Step 1: Date range picker (start/end dates) with availability check
- Step 2: Guest count input (adults/students/children/infants/babies)
- Step 3: Room selection with availability display and capacity matching
- Step 4: Add-on services selection (meals, facilities, equipment)
- Step 5: Booking confirmation with price breakdown + Board project selection
- Real-time price calculation display
- Progress indicator and navigation
- Form validation with Zod
- Mobile-responsive design"
```

### 3. ダッシュボード
```typescript
"Create a hotel dashboard with:
- Occupancy rate summary cards (today/week/month)
- Revenue charts (daily/weekly/monthly breakdown)
- Today's bookings list with guest details
- Board sync status alerts and error notifications
- Quick action buttons (new booking, calendar view)
- Room status grid showing current occupancy
- Responsive grid layout with dark mode support"
```

### 4. Board案件選択画面
```typescript
"Create a Board project selection interface with:
- Search and filter functionality (client name, project number, date range)
- Project list table with selection radio buttons
- Project details display (client info, status, dates, amount)
- Sync status indicators with success/error states
- External link buttons to Board editing pages
- Sync history log with timestamps
- Modal layout with responsive design"
```

### 5. マスタ管理画面
```typescript
"Create admin CRUD interfaces with:
- Room management table (13 rooms with capacity, rates, amenities)
- Rate management with seasonal pricing matrix
- Add-on services by category (meals, facilities, equipment)
- Season management with date ranges and multipliers
- Modal forms for create/edit operations
- Data tables with sorting/filtering/pagination
- Bulk operations support (activate/deactivate)
- Import/export functionality"
```

---

## 📋 コア機能仕様

### 🗓 コア機能1: 予約台帳管理

#### カレンダー表示 (`/calendar`)
- **13部屋の稼働状況**: 月次・週次・日次表示切替
- **予約ブロック表示**: 宿泊期間を視覚的に表示
- **空室識別**: 空室期間の明確な色分け
- **稼働率表示**: 部屋別・期間別の稼働率

#### 空室検索機能
- **検索条件**: 期間・人数・部屋タイプ・オプション
- **即座確認**: リアルタイム空室状況表示
- **代替提案**: 近接日程・類似条件の提案

#### 予約重複防止
- **ダブルブッキング防止**: 同一部屋・期間の排他制御
- **整合性チェック**: 人数と定員の自動チェック
- **リアルタイム更新**: 複数ユーザー同時アクセス対応

### 💰 コア機能2: 見積自動生成

#### 複雑料金体系の自動計算

**基本計算式**: `総額 = 室料 + 個人料金 + オプション料金`（すべて税込み）

**1. 室料計算**
```
室料 = 部屋タイプ別単価 × 利用部屋数 × 宿泊日数

部屋タイプ別単価（固定・シーズン変動なし）:
【大部屋】
- 2F作法室（25名）: 20,000円/部屋/泊
- 3F被服室（35名）: 20,000円/部屋/泊

【中部屋】
- 3F視聴覚室（21名）: 13,000円/部屋/泊  
- 3F図書室（10名）: 8,000円/部屋/泊

【個室】
- 2F 1年1組（5名）: 7,000円/部屋/泊
- 2F 1年2組（5名）: 7,000円/部屋/泊
- 3F理科室（10名）: 6,000円/部屋/泊
- 2F 2年1組（5名）: 5,000円/部屋/泊
- 2F 2年2組（5名）: 5,000円/部屋/泊
- 3F 3年1組（5名）: 5,000円/部屋/泊
- 3F 3年2組（5名）: 5,000円/部屋/泊
- 3F 3年3組（5名）: 5,000円/部屋/泊
```

**2. 個人料金計算**
```
個人料金 = Σ(年齢区分別人数 × 年齢区分別単価 × 宿泊日数)

年齢区分別単価 = 基本単価 × 曜日係数 × シーズン係数

基本単価（大部屋・中部屋利用時）:
- 大人: 4,800円/人/泊
- 中高大学生: 4,000円/人/泊
- 小学生: 3,200円/人/泊
- 未就学児(3歳～): 2,500円/人/泊
- 乳幼児(0～2歳): 0円（無料）

基本単価（個室利用時）:
- 大人: 8,500円/人/泊
- 大人合宿付添: 6,800円/人/泊
- 中高大学生: 5,900円/人/泊
- 小学生: 5,000円/人/泊
- 未就学児(3歳～): 4,200円/人/泊
- 乳幼児(0～2歳): 0円（無料）

曜日係数:
- 平日（月～木）: 1.0
- 休日（金土日祝）: 1.22（約22%割増）

シーズン係数:
- 通常期: 1.0
- 繁忙期（3月/4月/5月GW/7月/8月/9月/12月）: 1.15（15%割増）
```

**3. オプション料金計算**
```
オプション料金 = Σ(オプション種別単価 × 数量 × 適用日数 × 曜日係数)

食事オプション（年齢区分別）:
- 朝食: 大人700円、中高大700円、小学生700円、未就学児700円
- 夕食: 大人1,500円、中高大1,000円、小学生800円
- BBQ: 大人3,000円、中高大2,200円、小学生1,500円

施設利用オプション:
- 会議室: 個人料金200円～600円/人/日 + 室料(平日1,000円、休日1,500円)/時間 + エアコン代500円/時間
- 体育館: 個人料金500円/人/日 + 室料(平日2,000円、休日2,500円)/時間 + エアコン代1,500円/時間
- プロジェクター: 3,000円/台/泊
```

#### リアルタイム料金表示
- **即座再計算**: 条件変更時の自動再計算
- **明細表示**: 室料・個人料金・オプション料金の詳細内訳表示
- **日別明細**: 宿泊期間中の日別料金内訳
- **複数パターン**: 異なる条件での料金比較

#### 見積書生成・管理
- **Board案件連携**: 既存Board案件への見積データ同期
- **バージョン管理**: 見積変更履歴・比較
- **外部連携**: Board書類編集ページへの遷移

### 🔄 コア機能3: Board API連携

#### Board案件管理
- **案件一覧同期**: Board側で作成済み案件の取得・表示
- **案件選択**: 予約に該当するBoard案件の選択機能
- **案件情報表示**: 顧客名・案件番号・ステータス等の確認

#### 見積データ同期
- **明細データ送信**: 予約システムで計算した料金明細をBoard見積書へPOST
- **項目マッピング**: 室料・個人料金・オプション→Board明細項目への変換
- **差分更新**: 予約変更時の見積データ自動更新

#### Board連携UI
- **案件選択画面**: 該当案件の検索・選択インターフェース
- **同期状況表示**: 最終同期日時・ステータス・エラー表示
- **外部リンク**: Board該当案件の書類編集ページへの直接遷移ボタン

---

## 📁 ディレクトリ構造

```
rebase369-booking-system/
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── components.json                    # shadcn/ui設定
├── next.config.js
├── .env.local.example
├── .env.local
├── 
├── app/                              # Next.js 14 App Router
│   ├── globals.css
│   ├── layout.tsx                    # Root Layout
│   ├── page.tsx                      # Home Page
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   │
│   ├── (auth)/                       # 認証グループ
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/                  # メインアプリグループ
│   │   ├── layout.tsx               # Dashboard Layout
│   │   ├── dashboard/
│   │   │   └── page.tsx             # ダッシュボード
│   │   │
│   │   ├── calendar/
│   │   │   └── page.tsx             # 予約台帳カレンダー
│   │   │
│   │   ├── booking/
│   │   │   ├── page.tsx             # 予約一覧
│   │   │   ├── new/
│   │   │   │   └── page.tsx         # 予約作成ウィザード
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # 予約詳細・編集
│   │   │       ├── edit/
│   │   │       │   └── page.tsx     # 予約編集
│   │   │       └── board-project/
│   │   │           └── page.tsx     # Board案件選択
│   │   │
│   │   └── admin/                   # 管理画面グループ
│   │       ├── layout.tsx
│   │       ├── rooms/
│   │       │   └── page.tsx
│   │       ├── rates/
│   │       │   └── page.tsx
│   │       ├── addons/
│   │       │   └── page.tsx
│   │       └── seasons/
│   │           └── page.tsx
│   │
│   └── api/                         # API Routes
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts
│       ├── bookings/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── rooms/
│       │   └── route.ts
│       ├── rates/
│       │   └── route.ts
│       ├── board/
│       │   ├── projects/
│       │   │   └── route.ts         # Board案件一覧
│       │   ├── sync/
│       │   │   └── route.ts         # Board同期
│       │   └── estimates/
│       │       └── [id]/
│       │           └── route.ts     # 見積明細更新
│       └── webhooks/
│           └── board/
│               └── route.ts
│
├── components/                       # React Components
│   ├── ui/                          # shadcn/ui Components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   │
│   ├── layout/                      # Layout Components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── navigation.tsx
│   │   └── footer.tsx
│   │
│   ├── calendar/                    # カレンダー関連
│   │   ├── booking-calendar.tsx     # メインカレンダー
│   │   ├── room-grid.tsx           # 部屋グリッド
│   │   ├── booking-block.tsx       # 予約ブロック
│   │   ├── availability-indicator.tsx
│   │   └── calendar-controls.tsx
│   │
│   ├── booking/                     # 予約関連
│   │   ├── booking-wizard.tsx       # 予約ウィザード
│   │   ├── date-selector.tsx        # 日程選択
│   │   ├── guest-selector.tsx       # 人数選択
│   │   ├── room-selector.tsx        # 部屋選択
│   │   ├── addon-selector.tsx       # オプション選択
│   │   ├── booking-confirmation.tsx # 確認画面
│   │   ├── board-project-selector.tsx # Board案件選択
│   │   ├── price-calculator.tsx     # 料金計算表示
│   │   └── booking-summary.tsx      # 予約サマリー
│   │
│   ├── dashboard/                   # ダッシュボード
│   │   ├── occupancy-chart.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── booking-list.tsx
│   │   ├── alert-panel.tsx
│   │   └── stats-cards.tsx
│   │
│   ├── board/                       # Board連携
│   │   ├── project-list.tsx
│   │   ├── project-search.tsx
│   │   ├── sync-status.tsx
│   │   └── external-link-button.tsx
│   │
│   ├── admin/                       # 管理画面
│   │   ├── room-table.tsx
│   │   ├── rate-table.tsx
│   │   ├── addon-table.tsx
│   │   ├── season-table.tsx
│   │   └── crud-modal.tsx
│   │
│   └── common/                      # 共通コンポーネント
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       ├── confirmation-dialog.tsx
│       ├── data-table.tsx
│       └── form-field.tsx
│
├── lib/                             # Utility Functions
│   ├── utils.ts                     # 汎用ユーティリティ
│   ├── constants.ts                 # 定数定義
│   ├── validations.ts               # Zod スキーマ
│   │
│   ├── supabase/                    # Supabase関連
│   │   ├── client.ts               # Supabase クライアント
│   │   ├── server.ts               # サーバーサイド クライアント
│   │   ├── middleware.ts           # Middleware用
│   │   └── types.ts                # Supabase型定義
│   │
│   ├── board/                       # Board API関連
│   │   ├── client.ts               # Board API クライアント
│   │   ├── types.ts                # Board API型定義
│   │   ├── mapper.ts               # データマッピング
│   │   └── sync.ts                 # 同期処理
│   │
│   ├── pricing/                     # 料金計算
│   │   ├── calculator.ts           # 料金計算エンジン
│   │   ├── season-checker.ts       # シーズン判定
│   │   ├── day-type-checker.ts     # 曜日判定
│   │   └── types.ts                # 料金計算型定義
│   │
│   ├── availability/                # 稼働管理
│   │   ├── checker.ts              # 空室チェック
│   │   ├── conflict-detector.ts    # 重複検知
│   │   └── occupancy-calculator.ts # 稼働率計算
│   │
│   └── hooks/                       # Custom Hooks
│       ├── use-bookings.ts
│       ├── use-rooms.ts
│       ├── use-rates.ts
│       ├── use-board-projects.ts
│       ├── use-pricing.ts
│       └── use-availability.ts
│
├── types/                           # TypeScript型定義
│   ├── index.ts                     # 共通型エクスポート
│   ├── booking.ts                   # 予約関連型
│   ├── room.ts                      # 部屋関連型
│   ├── pricing.ts                   # 料金関連型
│   ├── board.ts                     # Board API型
│   ├── availability.ts              # 稼働状況型
│   └── api.ts                       # API レスポンス型

// types/pricing.ts - 料金計算関連型定義
export interface GuestCount {
  adult: number           // 大人
  adult_leader?: number   // 大人合宿付添（個室時のみ）
  student: number         // 中高大学生
  child: number          // 小学生
  infant: number         // 未就学児(3歳～)
  baby: number           // 乳幼児(0～2歳) - 常に0円
}

export interface PriceBreakdown {
  roomAmount: number      // 室料合計
  guestAmount: number     // 個人料金合計
  addonAmount: number     // オプション料金合計
  subtotal: number        // 小計
  total: number          // 総額（税込み）
  dailyBreakdown: DailyPrice[]  // 日別明細
}

export interface DailyPrice {
  date: string
  dayType: 'weekday' | 'weekend'
  season: 'regular' | 'peak'
  roomAmount: number
  guestAmount: number
  addonAmount: number
  total: number
}

export interface RoomUsage {
  roomId: string
  roomType: 'large' | 'medium_a' | 'medium_b' | 'small_a' | 'small_b' | 'small_c'
  usageType: 'shared' | 'private'  // 大部屋中部屋/個室
  roomRate: number                 // 室料単価
  assignedGuests: number
}

export interface AddonItem {
  addonId: string
  category: 'meal' | 'facility' | 'equipment'
  name: string
  quantity: number
  ageBreakdown?: {           // 食事系の年齢区分別数量
    adult: number
    student: number
    child: number
    infant: number
  }
  facilityUsage?: {          // 施設系の利用時間
    hours: number
    guestType: 'guest' | 'other'
  }
  unitPrice: number
  totalPrice: number
}
│
├── store/                           # State Management (Zustand)
│   ├── booking-store.ts             # 予約状態管理
│   ├── calendar-store.ts            # カレンダー状態管理
│   ├── ui-store.ts                  # UI状態管理
│   └── board-store.ts               # Board連携状態管理
│
├── supabase/                        # Supabase設定
│   ├── migrations/                  # データベースマイグレーション
│   │   ├── 20250101000000_initial_schema.sql
│   │   ├── 20250101000001_rooms_setup.sql
│   │   ├── 20250101000002_rates_setup.sql
│   │   ├── 20250101000003_addons_setup.sql
│   │   ├── 20250101000004_seasons_setup.sql
│   │   └── 20250101000005_board_integration.sql
│   │
│   ├── functions/                   # Edge Functions
│   │   ├── calculate-pricing/
│   │   │   └── index.ts
│   │   ├── sync-board-projects/
│   │   │   └── index.ts
│   │   └── check-availability/
│   │       └── index.ts
│   │
│   ├── seed.sql                     # 初期データ投入
│   └── config.toml                  # Supabase設定
│
├── docs/                            # ドキュメント
│   ├── api/                         # API仕様書
│   │   ├── bookings.md
│   │   ├── rooms.md
│   │   ├── pricing.md
│   │   └── board-integration.md
│   ├── database/                    # データベース設計書
│   │   ├── schema.md
│   │   ├── migrations.md
│   │   └── indexing.md
│   └── deployment/                  # デプロイ手順
│       ├── vercel.md
│       ├── supabase.md
│       └── environment.md
│
└── public/                          # 静的ファイル
    ├── favicon.ico
    ├── images/
    │   ├── logo.svg
    │   └── rooms/
    └── icons/
```

---

## 🗄 データモデル

### 予約・台帳管理テーブル

#### projects - 予約メインテーブル
```sql
CREATE TABLE projects (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_project_id  bigint,                 -- Board側案件ID（選択済みの場合）
  status            text NOT NULL,          -- draft/confirmed/cancelled
  
  -- 宿泊情報
  start_date        date NOT NULL,
  end_date          date NOT NULL,
  nights            int GENERATED ALWAYS AS (end_date - start_date) STORED,
  
  -- 人数情報
  pax_total         int NOT NULL,
  pax_adults        int DEFAULT 0,
  pax_students      int DEFAULT 0,
  pax_children      int DEFAULT 0,
  pax_infants       int DEFAULT 0,
  pax_babies        int DEFAULT 0,
  
  -- 顧客情報
  guest_name        text NOT NULL,
  guest_email       text NOT NULL,
  guest_phone       text,
  guest_org         text,
  purpose           text,
  
  -- 金額情報
  room_amount       numeric DEFAULT 0,
  pax_amount        numeric DEFAULT 0,
  addon_amount      numeric DEFAULT 0,
  subtotal_amount   numeric DEFAULT 0,
  total_amount      numeric DEFAULT 0,
  
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_pax CHECK (pax_total > 0 AND pax_total = pax_adults + pax_students + pax_children + pax_infants + pax_babies)
);
```

#### project_rooms - 部屋割り当て（稼働管理）
```sql
CREATE TABLE project_rooms (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_id     text NOT NULL REFERENCES rooms(room_id),
  
  assigned_pax    int NOT NULL,
  room_rate       numeric NOT NULL,
  nights          int NOT NULL,
  amount          numeric GENERATED ALWAYS AS (room_rate * nights) STORED,
  
  created_at      timestamptz DEFAULT now(),
  
  -- 重複予約防止
  UNIQUE(room_id, project_id)
);

-- 稼働状況高速検索用インデックス
CREATE INDEX idx_room_occupancy ON project_rooms (room_id, project_id);
```

#### project_items - 明細（オプション・個人料金）
```sql
CREATE TABLE project_items (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  item_type   text NOT NULL,                -- 'pax'/'addon'
  item_code   text NOT NULL,
  item_name   text NOT NULL,
  category    text,
  
  quantity    numeric NOT NULL,
  unit        text NOT NULL,
  unit_price  numeric NOT NULL,
  amount      numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  target_date date,                         -- 適用日
  created_at  timestamptz DEFAULT now()
);
```

### マスタデータテーブル

#### rooms - 部屋マスタ（13部屋）
```sql
CREATE TABLE rooms (
  room_id     text PRIMARY KEY,
  name        text NOT NULL,
  floor       text NOT NULL,                -- '2F'/'3F'
  capacity    int NOT NULL,
  room_type   text NOT NULL,                -- 'large'/'medium_a'/'medium_b'/'small_a'/'small_b'/'small_c'
  room_rate   numeric NOT NULL,             -- 室料（1部屋/1泊）
  usage_type  text NOT NULL,                -- 'shared'/'private'（大部屋中部屋/個室）
  
  is_active   boolean DEFAULT true,
  amenities   text[],
  description text,
  
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 実際の13部屋データ
INSERT INTO rooms VALUES
-- 2F（5部屋）
('R201', '1年1組', '2F', 5, 'small_a', 7000, 'private', true, '{"エアコン","照明"}', '5名定員の個室'),
('R202', '1年2組', '2F', 5, 'small_a', 7000, 'private', true, '{"エアコン","照明"}', '5名定員の個室'),
('R203', '2年1組', '2F', 5, 'small_c', 5000, 'private', true, '{"エアコン","照明"}', '5名定員の個室'),
('R204', '2年2組', '2F', 5, 'small_c', 5000, 'private', true, '{"エアコン","照明"}', '5名定員の個室'),
('R205', '作法室', '2F', 25, 'large', 20000, 'shared', true, '{"エアコン","照明","和室"}', '25名定員の大部屋'),

-- 3F（8部屋）
('R301', '3年1組', '3F', 5, 'small_c', 5000, 'private', true, '{"エアコン","照明"}', '5名定員の個室'),
('R302', '3年2組', '3F', 5, 'small_c', 5000, 'private', true, '{"エアコン","照明"}', '5名定員の個室'),
('R303', '3年3組', '3F', 5, 'small_c', 5000, 'private', true, '{"エアコン","照明"}', '5名定員の個室'),
('R304', '理科室', '3F', 10, 'small_b', 6000, 'private', true, '{"エアコン","照明","実験台"}', '10名定員の個室'),
('R305', '図書室', '3F', 10, 'medium_b', 8000, 'shared', true, '{"エアコン","照明","書棚"}', '10名定員の中部屋'),
('R306', '視聴覚室', '3F', 21, 'medium_a', 13000, 'shared', true, '{"エアコン","照明","プロジェクター"}', '21名定員の中部屋'),
('R307', '被服室', '3F', 35, 'large', 20000, 'shared', true, '{"エアコン","照明","作業台"}', '35名定員の大部屋');
```

#### seasons - シーズン設定
```sql
CREATE TABLE seasons (
  season_id   text PRIMARY KEY,
  name        text NOT NULL,
  season_type text NOT NULL,               -- 'peak'/'on'/'off'
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  
  room_rate_multiplier  numeric DEFAULT 1.0,
  pax_rate_multiplier   numeric DEFAULT 1.0,
  
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- 実際のシーズン設定
INSERT INTO seasons VALUES
('peak_spring_2025', '春期繁忙期', 'peak', '2025-03-01', '2025-04-30', 1.0, 1.15, true),
('peak_summer_2025', '夏期繁忙期', 'peak', '2025-07-01', '2025-09-30', 1.0, 1.15, true),
('peak_winter_2025', '年末年始', 'peak', '2025-12-01', '2025-12-31', 1.0, 1.15, true),
('on_regular_2025', '通常期', 'on', '2025-01-01', '2025-12-31', 1.0, 1.0, true);
```

#### rates - 料金マトリクス
```sql
CREATE TABLE rates (
  rate_id     serial PRIMARY KEY,
  season_id   text REFERENCES seasons(season_id),
  day_type    text NOT NULL,               -- 'weekday'/'weekend'
  room_type   text NOT NULL,               -- 'shared'/'private'（大部屋中部屋/個室）
  age_group   text NOT NULL,               -- 'adult'/'student'/'child'/'infant'/'baby'
  
  base_price  numeric NOT NULL,            -- 基本単価
  
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- 実際の料金設定
INSERT INTO rates (season_id, day_type, room_type, age_group, base_price) VALUES
-- 大部屋・中部屋利用時（shared）
('on_regular_2025', 'weekday', 'shared', 'adult', 4800),
('on_regular_2025', 'weekday', 'shared', 'student', 4000),
('on_regular_2025', 'weekday', 'shared', 'child', 3200),
('on_regular_2025', 'weekday', 'shared', 'infant', 2500),
('on_regular_2025', 'weekday', 'shared', 'baby', 0),

('on_regular_2025', 'weekend', 'shared', 'adult', 5850),
('on_regular_2025', 'weekend', 'shared', 'student', 4900),
('on_regular_2025', 'weekend', 'shared', 'child', 3900),
('on_regular_2025', 'weekend', 'shared', 'infant', 3000),
('on_regular_2025', 'weekend', 'shared', 'baby', 0),

-- 繁忙期・大部屋中部屋
('peak_spring_2025', 'weekday', 'shared', 'adult', 5500),
('peak_spring_2025', 'weekday', 'shared', 'student', 4600),
('peak_spring_2025', 'weekday', 'shared', 'child', 3700),
('peak_spring_2025', 'weekday', 'shared', 'infant', 2900),
('peak_spring_2025', 'weekday', 'shared', 'baby', 0),

('peak_spring_2025', 'weekend', 'shared', 'adult', 6750),
('peak_spring_2025', 'weekend', 'shared', 'student', 5600),
('peak_spring_2025', 'weekend', 'shared', 'child', 4500),
('peak_spring_2025', 'weekend', 'shared', 'infant', 3450),
('peak_spring_2025', 'weekend', 'shared', 'baby', 0),

-- 個室利用時（private）
('on_regular_2025', 'weekday', 'private', 'adult', 8500),
('on_regular_2025', 'weekday', 'private', 'adult_leader', 6800),
('on_regular_2025', 'weekday', 'private', 'student', 5900),
('on_regular_2025', 'weekday', 'private', 'child', 5000),
('on_regular_2025', 'weekday', 'private', 'infant', 4200),
('on_regular_2025', 'weekday', 'private', 'baby', 0),

('on_regular_2025', 'weekend', 'private', 'adult', 10300),
('on_regular_2025', 'weekend', 'private', 'adult_leader', 8200),
('on_regular_2025', 'weekend', 'private', 'student', 7200),
('on_regular_2025', 'weekend', 'private', 'child', 6200),
('on_regular_2025', 'weekend', 'private', 'infant', 5200),
('on_regular_2025', 'weekend', 'private', 'baby', 0),

-- 繁忙期・個室
('peak_spring_2025', 'weekday', 'private', 'adult', 9800),
('peak_spring_2025', 'weekday', 'private', 'adult_leader', 7800),
('peak_spring_2025', 'weekday', 'private', 'student', 6800),
('peak_spring_2025', 'weekday', 'private', 'child', 5800),
('peak_spring_2025', 'weekday', 'private', 'infant', 4800),
('peak_spring_2025', 'weekday', 'private', 'baby', 0),

('peak_spring_2025', 'weekend', 'private', 'adult', 11800),
('peak_spring_2025', 'weekend', 'private', 'adult_leader', 9450),
('peak_spring_2025', 'weekend', 'private', 'student', 8300),
('peak_spring_2025', 'weekend', 'private', 'child', 7200),
('peak_spring_2025', 'weekend', 'private', 'infant', 6000),
('peak_spring_2025', 'weekend', 'private', 'baby', 0);
```

#### add_ons - オプション・サービス
```sql
CREATE TABLE add_ons (
  add_on_id    text PRIMARY KEY,
  category     text NOT NULL,               -- 'meal'/'facility'/'equipment'
  name         text NOT NULL,
  unit         text NOT NULL,
  
  -- 年齢区分別料金（食事系）
  adult_fee    numeric DEFAULT 0,
  student_fee  numeric DEFAULT 0,
  child_fee    numeric DEFAULT 0,
  infant_fee   numeric DEFAULT 0,
  
  -- 施設利用料金
  personal_fee_5h    numeric DEFAULT 0,    -- 個人料金（5h未満）
  personal_fee_10h   numeric DEFAULT 0,    -- 個人料金（5h-10h）
  personal_fee_over  numeric DEFAULT 0,    -- 個人料金（10h以上）
  
  -- 室料（平日/休日、宿泊者/宿泊者以外）
  room_fee_weekday_guest    numeric DEFAULT 0,
  room_fee_weekday_other    numeric DEFAULT 0,
  room_fee_weekend_guest    numeric DEFAULT 0,
  room_fee_weekend_other    numeric DEFAULT 0,
  
  -- エアコン代
  aircon_fee_per_hour       numeric DEFAULT 0,
  
  min_quantity numeric DEFAULT 1,
  max_quantity numeric,
  is_active    boolean DEFAULT true,
  
  created_at   timestamptz DEFAULT now()
);

-- 実際のオプション設定
INSERT INTO add_ons VALUES
-- 食事（年齢区分別）
('A100', 'meal', '朝食', '人・回', 700, 700, 700, 700, 0, 0, 0, 0, 0, 0, 0, 0, 1, null, true),
('A110', 'meal', '夕食', '人・回', 1500, 1000, 800, 800, 0, 0, 0, 0, 0, 0, 0, 0, 1, null, true),
('A120', 'meal', 'BBQ', '人・回', 3000, 2200, 1500, 1500, 0, 0, 0, 0, 0, 0, 0, 0, 10, null, true),

-- 施設利用（個人料金＋室料＋エアコン代）
('B200', 'facility', '会議室', '人・日', 0, 0, 0, 0, 200, 400, 600, 1000, 1500, 1500, 2000, 500, 1, null, true),
('C300', 'facility', '体育館', '人・日', 0, 0, 0, 0, 500, 500, 500, 2000, 3500, 2500, 4500, 1500, 1, null, true),

-- 備品（固定料金）
('E500', 'equipment', 'プロジェクター', '台・泊', 3000, 3000, 3000, 3000, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, true);
```

### Board API連携テーブル

#### board_projects - Board案件キャッシュ
```sql
CREATE TABLE board_projects (
  board_project_id  bigint PRIMARY KEY,
  project_no        int NOT NULL,
  client_name       text NOT NULL,
  title            text,
  status           text NOT NULL,
  
  -- キャッシュデータ
  last_synced_at   timestamptz DEFAULT now(),
  is_active        boolean DEFAULT true,
  
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
```

#### board_sync_log - Board同期履歴
```sql
CREATE TABLE board_sync_log (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      uuid REFERENCES projects(id),
  board_project_id bigint REFERENCES board_projects(board_project_id),
  
  sync_type       text NOT NULL,            -- 'estimate_update'/'project_list'
  sync_status     text NOT NULL,            -- 'success'/'error'/'pending'
  
  request_data    jsonb,
  response_data   jsonb,
  error_message   text,
  
  sync_started_at timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);
```

---

## 🚀 Claude Code実装指示

### 1. 料金計算エンジン
```typescript
// 実装すべき計算ロジック
interface PriceCalculation {
  calculateRoomPrice(rooms: Room[], nights: number): number
  calculateGuestPrice(
    guests: GuestCount, 
    dates: DateRange, 
    roomType: 'shared' | 'private'
  ): number
  calculateAddonPrice(addons: Addon[], dates: DateRange): number
  calculateTotalPrice(booking: BookingData): PriceBreakdown
}

// 詳細計算要件
class PriceCalculator {
  // 室料計算（部屋タイプ別固定単価）
  calculateRoomPrice(rooms: Room[], nights: number): number {
    const roomRates = {
      'large': 20000,    // 大部屋（作法室・被服室）
      'medium_a': 13000, // 中部屋（視聴覚室）
      'medium_b': 8000,  // 中部屋（図書室）
      'small_a': 7000,   // 個室（1年1組・1年2組）
      'small_b': 6000,   // 個室（理科室）
      'small_c': 5000    // 個室（2年組・3年組）
    }
    return rooms.reduce((total, room) => 
      total + (roomRates[room.type] * nights), 0
    )
  }

  // 個人料金計算（年齢区分×曜日×シーズン）
  calculateGuestPrice(
    guests: GuestCount, 
    dates: DateRange, 
    roomType: 'shared' | 'private'
  ): number {
    // 基本単価設定
    const baseRates = roomType === 'shared' ? {
      adult: 4800,
      student: 4000, 
      child: 3200,
      infant: 2500,
      baby: 0  // 0-2歳無料
    } : {
      adult: 8500,
      adult_leader: 6800,  // 合宿付添
      student: 5900,
      child: 5000, 
      infant: 4200,
      baby: 0  // 0-2歳無料
    }

    let total = 0
    for (const date of this.generateDateRange(dates)) {
      const dayType = this.getDayType(date)      // 平日/休日判定
      const season = this.getSeason(date)        // シーズン判定
      
      const dayMultiplier = dayType === 'weekend' ? 1.22 : 1.0
      const seasonMultiplier = season === 'peak' ? 1.15 : 1.0
      
      Object.entries(guests).forEach(([ageGroup, count]) => {
        const baseRate = baseRates[ageGroup]
        const dailyRate = baseRate * dayMultiplier * seasonMultiplier
        total += dailyRate * count
      })
    }
    return Math.round(total)
  }

  // オプション料金計算
  calculateAddonPrice(addons: Addon[], dates: DateRange): number {
    let total = 0
    
    addons.forEach(addon => {
      if (addon.type === 'meal') {
        // 食事：年齢区分別単価
        total += this.calculateMealPrice(addon, dates)
      } else if (addon.type === 'facility') {
        // 施設：個人料金＋室料＋エアコン代
        total += this.calculateFacilityPrice(addon, dates)
      } else {
        // 備品：固定単価
        total += addon.unitPrice * addon.quantity * dates.nights
      }
    })
    
    return Math.round(total)
  }

  // 曜日判定
  private getDayType(date: Date): 'weekday' | 'weekend' {
    const day = date.getDay()
    return (day === 0 || day === 5 || day === 6) ? 'weekend' : 'weekday'
  }

  // シーズン判定
  private getSeason(date: Date): 'regular' | 'peak' {
    const month = date.getMonth() + 1
    const peakMonths = [3, 4, 5, 7, 8, 9, 12]
    return peakMonths.includes(month) ? 'peak' : 'regular'
  }
}

// 実装上の重要ポイント
- すべて税込み表示（追加の税計算不要）
- 乳幼児（0-2歳）は完全無料
- 個室利用時の個人料金は大幅に高額設定
- 曜日判定：金土日祝を休日扱い（22%割増）
- シーズン判定：3,4,5,7,8,9,12月を繁忙期扱い（15%割増）
- 料金変更は日別に計算（宿泊期間中の曜日・シーズン変動に対応）
```

### 2. Board API連携
```typescript
// Board API連携実装
interface BoardApiClient {
  // Board案件一覧取得
  getProjects(params?: {
    clientName?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<BoardProject[]>
  
  // 見積書明細更新
  updateEstimate(
    projectId: number, 
    estimateId: number, 
    items: EstimateItem[]
  ): Promise<BoardEstimate>
  
  // 案件詳細取得
  getProject(projectId: number): Promise<BoardProject>
  
  // Board書類編集ページURL生成
  getEditUrl(projectId: number, documentType: 'estimate'): string
}

// 同期処理
- Board案件一覧の定期同期（1日1回）
- 見積明細の手動同期
- エラー処理・リトライ機能
- 同期状況の追跡・ログ
```

### 3. Supabase設定・認証
```typescript
// Supabase設定
- PostgreSQL全テーブル作成
- Row Level Security (RLS) 設定
- リアルタイム購読設定
- Edge Functions（料金計算・Board同期）

// 認証設定
- メール+パスワード認証
- セッション管理
- 権限制御（管理者のみ）
```

### 4. 稼働状況管理
```typescript
// 稼働管理機能
interface OccupancyManager {
  checkAvailability(rooms: string[], dateRange: DateRange): Promise<AvailabilityResult>
  preventDoubleBooking(booking: BookingData): Promise<ValidationResult>
  getOccupancyRate(period: DateRange): Promise<OccupancyStats>
  getOccupancyCalendar(month: Date): Promise<CalendarData>
}

// 高速検索・リアルタイム更新
- マテリアライズドビュー活用
- インデックス最適化
- キャッシュ戦略
```

---

## 📈 開発ロードマップ

**開発優先順位**
1. **v0.dev**: カレンダー→ウィザード→ダッシュボード→Board案件選択→管理画面
2. **Claude Code**: データベース→料金計算→Board連携→統合
3. **Integration**: UI・バックエンド統合→テスト→デプロイ

**重要な実装ポイント**
- **稼働管理**: ダブルブッキング完全防止
- **料金計算**: 
  - 室料（部屋タイプ別固定）＋個人料金（年齢区分×曜日×シーズン変動）の複雑な体系
  - 大部屋中部屋利用時と個室利用時で個人料金が大幅に異なる
  - 乳幼児（0-2歳）完全無料、未就学児（3歳～）は有料
  - 曜日判定（金土日祝=休日で22%割増）とシーズン判定（繁忙期15%割増）
  - 食事は年齢区分別、施設利用は個人料金＋室料＋エアコン代の複合計算
- **Board連携**: 案件選択と見積明細同期の確実な実行
- **UX**: 直感的で高速な操作性
