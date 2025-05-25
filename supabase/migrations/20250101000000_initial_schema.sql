-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -- Enable RLS
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE booking_status AS ENUM ('draft', 'confirmed', 'cancelled', 'completed');
CREATE TYPE room_type AS ENUM ('large', 'medium_a', 'medium_b', 'small_a', 'small_b', 'small_c');
CREATE TYPE usage_type AS ENUM ('shared', 'private');
CREATE TYPE season_type AS ENUM ('regular', 'peak');
CREATE TYPE day_type AS ENUM ('weekday', 'weekend');
CREATE TYPE addon_category AS ENUM ('meal', 'facility', 'equipment');
CREATE TYPE sync_status AS ENUM ('pending', 'success', 'error');

-- Projects table (予約メインテーブル)
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_project_id bigint,
  status booking_status NOT NULL DEFAULT 'draft',
  
  -- 宿泊情報
  start_date date NOT NULL,
  end_date date NOT NULL,
  nights int GENERATED ALWAYS AS (end_date - start_date) STORED,
  
  -- 人数情報
  pax_total int NOT NULL,
  pax_adults int DEFAULT 0,
  pax_adult_leaders int DEFAULT 0,
  pax_students int DEFAULT 0,
  pax_children int DEFAULT 0,
  pax_infants int DEFAULT 0,
  pax_babies int DEFAULT 0,
  
  -- 顧客情報
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  guest_org text,
  purpose text,
  
  -- 金額情報
  room_amount numeric DEFAULT 0,
  pax_amount numeric DEFAULT 0,
  addon_amount numeric DEFAULT 0,
  subtotal_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_pax CHECK (
    pax_total > 0 AND 
    pax_total = pax_adults + pax_adult_leaders + pax_students + pax_children + pax_infants + pax_babies
  )
);

-- Rooms table (部屋マスタ)
CREATE TABLE rooms (
  room_id text PRIMARY KEY,
  name text NOT NULL,
  floor text NOT NULL,
  capacity int NOT NULL,
  room_type room_type NOT NULL,
  room_rate numeric NOT NULL,
  usage_type usage_type NOT NULL,
  
  is_active boolean DEFAULT true,
  amenities text[],
  description text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project rooms table (部屋割り当て)
CREATE TABLE project_rooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_id text NOT NULL REFERENCES rooms(room_id),
  
  assigned_pax int NOT NULL,
  room_rate numeric NOT NULL,
  nights int NOT NULL,
  amount numeric GENERATED ALWAYS AS (room_rate * nights) STORED,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(room_id, project_id)
);

-- Seasons table (シーズン設定)
CREATE TABLE seasons (
  season_id text PRIMARY KEY,
  name text NOT NULL,
  season_type season_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  
  room_rate_multiplier numeric DEFAULT 1.0,
  pax_rate_multiplier numeric DEFAULT 1.0,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Rates table (料金マトリクス)
CREATE TABLE rates (
  rate_id serial PRIMARY KEY,
  season_id text REFERENCES seasons(season_id),
  day_type day_type NOT NULL,
  room_usage usage_type NOT NULL,
  age_group text NOT NULL,
  
  base_price numeric NOT NULL,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add-ons table (オプション・サービス)
CREATE TABLE add_ons (
  add_on_id text PRIMARY KEY,
  category addon_category NOT NULL,
  name text NOT NULL,
  unit text NOT NULL,
  
  -- 年齢区分別料金（食事系）
  adult_fee numeric DEFAULT 0,
  student_fee numeric DEFAULT 0,
  child_fee numeric DEFAULT 0,
  infant_fee numeric DEFAULT 0,
  
  -- 施設利用料金
  personal_fee_5h numeric DEFAULT 0,
  personal_fee_10h numeric DEFAULT 0,
  personal_fee_over numeric DEFAULT 0,
  
  -- 室料（平日/休日、宿泊者/宿泊者以外）
  room_fee_weekday_guest numeric DEFAULT 0,
  room_fee_weekday_other numeric DEFAULT 0,
  room_fee_weekend_guest numeric DEFAULT 0,
  room_fee_weekend_other numeric DEFAULT 0,
  
  -- エアコン代
  aircon_fee_per_hour numeric DEFAULT 0,
  
  min_quantity numeric DEFAULT 1,
  max_quantity numeric,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now()
);

-- Project items table (明細)
CREATE TABLE project_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  item_type text NOT NULL,
  item_code text NOT NULL,
  item_name text NOT NULL,
  category text,
  
  quantity numeric NOT NULL,
  unit text NOT NULL,
  unit_price numeric NOT NULL,
  amount numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  target_date date,
  created_at timestamptz DEFAULT now()
);

-- Board projects table (Board案件キャッシュ)
CREATE TABLE board_projects (
  board_project_id bigint PRIMARY KEY,
  project_no int NOT NULL,
  client_name text NOT NULL,
  title text,
  status text NOT NULL,
  
  last_synced_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Board sync log table (Board同期履歴)
CREATE TABLE board_sync_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id),
  board_project_id bigint REFERENCES board_projects(board_project_id),
  
  sync_type text NOT NULL,
  sync_status sync_status NOT NULL,
  
  request_data jsonb,
  response_data jsonb,
  error_message text,
  
  sync_started_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_board_id ON projects(board_project_id);
CREATE INDEX idx_project_rooms_occupancy ON project_rooms(room_id, project_id);
CREATE INDEX idx_project_rooms_dates ON project_rooms(project_id);
CREATE INDEX idx_rates_lookup ON rates(season_id, day_type, room_usage, age_group);
CREATE INDEX idx_board_sync_log_project ON board_sync_log(project_id);
CREATE INDEX idx_board_sync_log_status ON board_sync_log(sync_status);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Users can delete projects" ON projects FOR DELETE USING (true);

CREATE POLICY "Users can view project rooms" ON project_rooms FOR SELECT USING (true);
CREATE POLICY "Users can manage project rooms" ON project_rooms FOR ALL USING (true);

CREATE POLICY "Users can view project items" ON project_items FOR SELECT USING (true);
CREATE POLICY "Users can manage project items" ON project_items FOR ALL USING (true);

CREATE POLICY "Users can view sync logs" ON board_sync_log FOR SELECT USING (true);
CREATE POLICY "Users can insert sync logs" ON board_sync_log FOR INSERT WITH CHECK (true);

-- Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_projects_updated_at
  BEFORE UPDATE ON board_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
