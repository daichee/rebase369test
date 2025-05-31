-- Phase 5: データベース最適化
-- Board関連テーブル・カラム完全削除とパフォーマンス最適化

-- 5.1 Board関連テーブル削除
-- Board関連テーブル・カラム完全削除
DROP TABLE IF EXISTS board_sync_log;
DROP TABLE IF EXISTS board_projects;
ALTER TABLE projects DROP COLUMN IF EXISTS board_project_id;

-- Board関連インデックスの削除
DROP INDEX IF EXISTS idx_projects_board_id;
DROP INDEX IF EXISTS idx_board_sync_log_project;
DROP INDEX IF EXISTS idx_board_sync_log_status;

-- 5.2 パフォーマンス最適化
-- 事前計算料金ビューの作成
CREATE MATERIALIZED VIEW calculated_rates AS
SELECT 
  r.season_id,
  r.day_type,
  r.room_usage,
  r.age_group,
  r.base_price as final_price,
  s.name as season_name,
  s.season_type,
  s.start_date as season_start,
  s.end_date as season_end,
  r.is_active
FROM rates r
LEFT JOIN seasons s ON r.season_id = s.season_id
WHERE r.is_active = true AND s.is_active = true;

-- 料金ビューのインデックス
CREATE UNIQUE INDEX idx_calculated_rates_lookup 
ON calculated_rates(season_id, day_type, room_usage, age_group);

CREATE INDEX idx_calculated_rates_season_date 
ON calculated_rates(season_start, season_end);

-- 空室チェック最適化のためのインデックス追加
-- 部屋の空室状況を効率的にチェックするためのインデックス
CREATE INDEX IF NOT EXISTS idx_project_rooms_availability 
ON project_rooms(room_id, project_id);

-- 予約期間での重複チェック最適化
CREATE INDEX IF NOT EXISTS idx_projects_date_range 
ON projects USING GIST (daterange(start_date, end_date, '[)'));

-- プロジェクト検索最適化
CREATE INDEX IF NOT EXISTS idx_projects_guest_info 
ON projects(guest_name, guest_org, guest_email);

-- 部屋検索最適化
CREATE INDEX IF NOT EXISTS idx_rooms_search 
ON rooms(room_type, usage_type, is_active) WHERE is_active = true;

-- 料金計算最適化のためのビュー
CREATE OR REPLACE VIEW room_availability AS
SELECT 
  r.room_id,
  r.name,
  r.floor,
  r.capacity,
  r.room_type,
  r.usage_type,
  r.room_rate,
  COALESCE(
    (SELECT COUNT(*) 
     FROM project_rooms pr 
     JOIN projects p ON pr.project_id = p.id 
     WHERE pr.room_id = r.room_id 
     AND p.status IN ('confirmed', 'draft')
    ), 0
  ) as active_bookings
FROM rooms r
WHERE r.is_active = true;

-- マテリアライズドビューの自動更新のための関数
CREATE OR REPLACE FUNCTION refresh_calculated_rates()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY calculated_rates;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- マテリアライズドビューの自動更新トリガー
CREATE TRIGGER refresh_rates_on_rates_change
  AFTER INSERT OR UPDATE OR DELETE ON rates
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_calculated_rates();

CREATE TRIGGER refresh_rates_on_seasons_change
  AFTER INSERT OR UPDATE OR DELETE ON seasons
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_calculated_rates();

-- 定期的なビュー更新のためのコメント
COMMENT ON MATERIALIZED VIEW calculated_rates IS 
'事前計算された料金ビュー。rates/seasonsテーブル更新時に自動更新される。';

COMMENT ON VIEW room_availability IS 
'部屋の稼働状況を含む可用性ビュー。空室チェックの高速化に使用。';