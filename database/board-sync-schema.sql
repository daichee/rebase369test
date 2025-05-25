-- Board連携情報テーブル
CREATE TABLE board_sync_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  estimate_id TEXT NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('synced', 'pending', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_board_sync_info_booking_id ON board_sync_info(booking_id);
CREATE INDEX idx_board_sync_info_estimate_id ON board_sync_info(estimate_id);
CREATE INDEX idx_board_sync_info_status ON board_sync_info(status);

-- 更新日時の自動更新
CREATE TRIGGER set_board_sync_info_updated_at
BEFORE UPDATE ON board_sync_info
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
