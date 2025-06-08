-- Pricing System Unification Migration
-- Phase 4: Database schema extension for unified pricing system

-- 料金計算詳細保存テーブル
CREATE TABLE booking_price_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  calculation_timestamp timestamptz DEFAULT now(),
  
  -- 計算入力パラメータ
  rooms_used jsonb NOT NULL,           -- 使用部屋詳細
  guest_breakdown jsonb NOT NULL,      -- 人数内訳
  date_range jsonb NOT NULL,           -- 日程・泊数
  addons_selected jsonb DEFAULT '[]',  -- 選択オプション
  season_config jsonb NOT NULL,       -- 計算時のシーズン設定
  
  -- 計算結果詳細  
  room_amount decimal(10,2) NOT NULL,
  guest_amount decimal(10,2) NOT NULL,
  addon_amount decimal(10,2) NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  daily_breakdown jsonb NOT NULL,      -- 日別内訳
  calculation_method text DEFAULT 'unified_calculator',
  
  -- メタデータ
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 動的料金設定管理テーブル  
CREATE TABLE pricing_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_name text UNIQUE NOT NULL,
  config_data jsonb NOT NULL,          -- 料金設定JSON
  is_active boolean DEFAULT false,     -- アクティブ設定フラグ
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- インデックス作成
CREATE INDEX idx_booking_price_details_booking ON booking_price_details(booking_id);
CREATE INDEX idx_booking_price_details_created_at ON booking_price_details(created_at);
CREATE INDEX idx_pricing_config_active ON pricing_config(is_active, valid_from, valid_until);
CREATE INDEX idx_pricing_config_name ON pricing_config(config_name);

-- RLS（Row Level Security）設定
ALTER TABLE booking_price_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- booking_price_details のRLSポリシー
CREATE POLICY "Users can view booking price details they own" ON booking_price_details
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert booking price details for their bookings" ON booking_price_details
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    ) AND
    created_by = auth.uid()
  );

CREATE POLICY "Admins can view all booking price details" ON booking_price_details
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- pricing_config のRLSポリシー
CREATE POLICY "All users can view active pricing config" ON pricing_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage pricing config" ON pricing_config
  FOR ALL USING (
    auth.uid() IS NOT NULL
  ) WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 初期設定データ投入（フォールバック設定）
INSERT INTO pricing_config (
  config_name,
  config_data,
  is_active,
  valid_from,
  created_by
) VALUES (
  'default_pricing_2025',
  '{
    "personalRates": {
      "shared": {
        "adult": {"weekday": 4800, "weekend": 5856, "peak_weekday": 5520, "peak_weekend": 6734},
        "student": {"weekday": 4000, "weekend": 4880, "peak_weekday": 4600, "peak_weekend": 5612},
        "child": {"weekday": 3200, "weekend": 3904, "peak_weekday": 3680, "peak_weekend": 4490},
        "infant": {"weekday": 1600, "weekend": 1952, "peak_weekday": 1840, "peak_weekend": 2245},
        "baby": {"weekday": 0, "weekend": 0, "peak_weekday": 0, "peak_weekend": 0}
      },
      "private": {
        "adult": {"weekday": 8500, "weekend": 10370, "peak_weekday": 9775, "peak_weekend": 11926},
        "student": {"weekday": 7083, "weekend": 8641, "peak_weekday": 8146, "peak_weekend": 9938},
        "child": {"weekday": 5667, "weekend": 6913, "peak_weekday": 6518, "peak_weekend": 7951},
        "infant": {"weekday": 2833, "weekend": 3457, "peak_weekday": 3259, "peak_weekend": 3975},
        "baby": {"weekday": 0, "weekend": 0, "peak_weekday": 0, "peak_weekend": 0}
      }
    },
    "roomRates": {
      "large": 20000,
      "medium_a": 13000,
      "medium_b": 8000,
      "small_a": 7000,
      "small_b": 6000,
      "small_c": 5000
    },
    "addonRates": {
      "meal": {
        "breakfast": 600,
        "lunch": 1000,
        "dinner": 1500,
        "bbq": 2000
      },
      "facility": {
        "projector": 2000,
        "sound_system": 3000,
        "flipchart": 500
      },
      "equipment": {
        "bedding": 500,
        "towel": 200,
        "pillow": 300
      }
    },
    "peakMonths": [3, 4, 5, 7, 8, 9, 12],
    "configName": "default_pricing_2025",
    "version": "v1.0.0",
    "lastUpdated": "' || now()::text || '"
  }',
  true,
  now(),
  (SELECT id FROM auth.users LIMIT 1)
);

-- 料金設定更新用関数
CREATE OR REPLACE FUNCTION update_pricing_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
CREATE TRIGGER pricing_config_updated_at
  BEFORE UPDATE ON pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_pricing_config_timestamp();

-- コメント追加
COMMENT ON TABLE booking_price_details IS '予約料金計算詳細保存テーブル - 計算結果と過程の完全な記録';
COMMENT ON TABLE pricing_config IS '動的料金設定管理テーブル - 管理画面から変更可能な料金体系';

COMMENT ON COLUMN booking_price_details.rooms_used IS '使用部屋の詳細情報（JSON形式）';
COMMENT ON COLUMN booking_price_details.guest_breakdown IS '人数内訳詳細（JSON形式）';
COMMENT ON COLUMN booking_price_details.date_range IS '宿泊日程と泊数（JSON形式）';
COMMENT ON COLUMN booking_price_details.addons_selected IS '選択オプション一覧（JSON形式）';
COMMENT ON COLUMN booking_price_details.season_config IS '計算時のシーズン・料金設定（JSON形式）';
COMMENT ON COLUMN booking_price_details.daily_breakdown IS '日別料金明細（JSON形式）';

COMMENT ON COLUMN pricing_config.config_data IS '料金設定データ（個人料金・部屋料金・オプション料金・シーズン設定を含むJSON）';
COMMENT ON COLUMN pricing_config.is_active IS 'アクティブ設定フラグ（trueは1つのみ）';
COMMENT ON COLUMN pricing_config.valid_from IS '設定有効開始日時';
COMMENT ON COLUMN pricing_config.valid_until IS '設定有効終了日時（nullは無期限）';