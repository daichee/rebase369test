-- Double Booking Prevention System Migration
-- This migration adds the complete double booking prevention system with RPC functions

-- 排他制御付き予約競合チェック関数
CREATE OR REPLACE FUNCTION check_booking_conflicts_exclusive(
    p_room_ids TEXT[],
    p_start_date DATE,
    p_end_date DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
    room_id TEXT,
    conflicting_booking_id UUID,
    guest_name TEXT,
    overlap_start DATE,
    overlap_end DATE,
    overlap_nights INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- 対象部屋をロック（FOR UPDATE）
    PERFORM 1 FROM rooms r WHERE r.room_id = ANY(p_room_ids) FOR UPDATE;
    
    RETURN QUERY
    SELECT 
        pr.room_id,
        p.id AS conflicting_booking_id,
        p.guest_name,
        GREATEST(p.start_date, p_start_date) AS overlap_start,
        LEAST(p.end_date, p_end_date) AS overlap_end,
        EXTRACT(
            DAY FROM LEAST(p.end_date, p_end_date) - GREATEST(p.start_date, p_start_date)
        )::INTEGER AS overlap_nights
    FROM project_rooms pr
    INNER JOIN projects p ON pr.project_id = p.id
    WHERE pr.room_id = ANY(p_room_ids)
        AND p.status != 'cancelled'
        AND (p_exclude_booking_id IS NULL OR p.id != p_exclude_booking_id)
        AND p.start_date < p_end_date
        AND p.end_date > p_start_date
    ORDER BY pr.room_id, p.start_date;
END;
$$;

-- 予約ロック管理テーブル
CREATE TABLE IF NOT EXISTS booking_locks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    lock_expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_booking_locks_session ON booking_locks(session_id);
CREATE INDEX IF NOT EXISTS idx_booking_locks_room_date ON booking_locks(room_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_booking_locks_expires ON booking_locks(lock_expires_at);

-- 予約ロック取得関数
CREATE OR REPLACE FUNCTION acquire_booking_lock(
    p_session_id TEXT,
    p_room_ids TEXT[],
    p_start_date DATE,
    p_end_date DATE,
    p_lock_expires_at TIMESTAMP
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    existing_locks INTEGER;
    lock_acquired BOOLEAN := FALSE;
    other_sessions INTEGER := 0;
BEGIN
    -- 既存のロックをチェック
    SELECT COUNT(*) INTO existing_locks
    FROM booking_locks bl
    WHERE bl.room_id = ANY(p_room_ids)
        AND bl.lock_expires_at > NOW()
        AND bl.session_id != p_session_id
        AND (
            (bl.start_date < p_end_date AND bl.end_date > p_start_date)
        );
    
    -- 他のアクティブセッション数を取得
    SELECT COUNT(DISTINCT session_id) INTO other_sessions
    FROM booking_locks bl
    WHERE bl.room_id = ANY(p_room_ids)
        AND bl.lock_expires_at > NOW()
        AND bl.session_id != p_session_id;
    
    -- ロックが取得可能な場合
    IF existing_locks = 0 THEN
        -- 既存の期限切れロックを削除
        DELETE FROM booking_locks 
        WHERE session_id = p_session_id OR lock_expires_at <= NOW();
        
        -- 新しいロックを作成
        INSERT INTO booking_locks (session_id, room_id, start_date, end_date, lock_expires_at)
        SELECT p_session_id, room_id, p_start_date, p_end_date, p_lock_expires_at
        FROM unnest(p_room_ids) AS room_id;
        
        lock_acquired := TRUE;
    END IF;
    
    RETURN json_build_object(
        'lock_acquired', lock_acquired,
        'other_sessions', other_sessions,
        'existing_locks', existing_locks
    );
END;
$$;

-- 代替部屋検索関数
CREATE OR REPLACE FUNCTION find_alternative_rooms(
    p_original_room_ids TEXT[],
    p_start_date DATE,
    p_end_date DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
    room_id TEXT,
    name TEXT,
    capacity INTEGER,
    price_per_night INTEGER,
    floor TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.room_id,
        r.name,
        r.capacity,
        r.price_per_night,
        r.floor
    FROM rooms r
    WHERE r.is_active = TRUE
        AND r.room_id != ALL(p_original_room_ids)
        AND NOT EXISTS (
            SELECT 1 
            FROM project_rooms pr
            INNER JOIN projects p ON pr.project_id = p.id
            WHERE pr.room_id = r.room_id
                AND p.status != 'cancelled'
                AND (p_exclude_booking_id IS NULL OR p.id != p_exclude_booking_id)
                AND p.start_date < p_end_date
                AND p.end_date > p_start_date
        )
    ORDER BY r.capacity ASC, r.price_per_night ASC;
END;
$$;

-- 代替日程検索関数
CREATE OR REPLACE FUNCTION find_alternative_dates(
    p_room_ids TEXT[],
    p_original_start DATE,
    p_original_end DATE,
    p_exclude_booking_id UUID DEFAULT NULL,
    p_search_days INTEGER DEFAULT 14
)
RETURNS TABLE (
    start_date DATE,
    end_date DATE,
    days_offset INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    nights INTEGER;
    check_start DATE;
    check_end DATE;
    offset_days INTEGER;
BEGIN
    nights := p_original_end - p_original_start;
    
    -- 前の日程をチェック
    FOR offset_days IN 1..p_search_days LOOP
        check_start := p_original_start - offset_days;
        check_end := check_start + nights;
        
        -- 過去の日付はスキップ
        IF check_start >= CURRENT_DATE THEN
            -- 競合がないかチェック
            IF NOT EXISTS (
                SELECT 1 
                FROM project_rooms pr
                INNER JOIN projects p ON pr.project_id = p.id
                WHERE pr.room_id = ANY(p_room_ids)
                    AND p.status != 'cancelled'
                    AND (p_exclude_booking_id IS NULL OR p.id != p_exclude_booking_id)
                    AND p.start_date < check_end
                    AND p.end_date > check_start
            ) THEN
                start_date := check_start;
                end_date := check_end;
                days_offset := -offset_days;
                RETURN NEXT;
            END IF;
        END IF;
        
        -- 後の日程をチェック
        check_start := p_original_start + offset_days;
        check_end := check_start + nights;
        
        -- 競合がないかチェック
        IF NOT EXISTS (
            SELECT 1 
            FROM project_rooms pr
            INNER JOIN projects p ON pr.project_id = p.id
            WHERE pr.room_id = ANY(p_room_ids)
                AND p.status != 'cancelled'
                AND (p_exclude_booking_id IS NULL OR p.id != p_exclude_booking_id)
                AND p.start_date < check_end
                AND p.end_date > check_start
        ) THEN
            start_date := check_start;
            end_date := check_end;
            days_offset := offset_days;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

-- リアルタイム競合検知とユーザー通知用関数
CREATE OR REPLACE FUNCTION get_active_sessions_for_period(
    p_room_ids TEXT[],
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    session_id TEXT,
    active_since TIMESTAMP,
    room_count INTEGER,
    lock_expires_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bl.session_id,
        MIN(bl.created_at) AS active_since,
        COUNT(DISTINCT bl.room_id)::INTEGER AS room_count,
        MAX(bl.lock_expires_at) AS lock_expires_at
    FROM booking_locks bl
    WHERE bl.room_id = ANY(p_room_ids)
        AND bl.lock_expires_at > NOW()
        AND (
            (bl.start_date < p_end_date AND bl.end_date > p_start_date)
        )
    GROUP BY bl.session_id
    ORDER BY active_since ASC;
END;
$$;

-- 競合解決のための詳細情報取得
CREATE OR REPLACE FUNCTION get_conflict_resolution_data(
    p_room_ids TEXT[],
    p_start_date DATE,
    p_end_date DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    conflicts_data JSON;
    alternative_rooms JSON;
    alternative_dates JSON;
    result JSON;
BEGIN
    -- 競合情報を取得
    SELECT json_agg(
        json_build_object(
            'roomId', pr.room_id,
            'conflictingBookingId', p.id,
            'guestName', p.guest_name,
            'overlapStart', GREATEST(p.start_date, p_start_date),
            'overlapEnd', LEAST(p.end_date, p_end_date),
            'overlapNights', EXTRACT(DAY FROM LEAST(p.end_date, p_end_date) - GREATEST(p.start_date, p_start_date)),
            'priority', CASE 
                WHEN p.status = 'confirmed' THEN 'high'
                WHEN p.status = 'pending' THEN 'medium'
                ELSE 'low'
            END
        )
    ) INTO conflicts_data
    FROM project_rooms pr
    INNER JOIN projects p ON pr.project_id = p.id
    WHERE pr.room_id = ANY(p_room_ids)
        AND p.status != 'cancelled'
        AND (p_exclude_booking_id IS NULL OR p.id != p_exclude_booking_id)
        AND p.start_date < p_end_date
        AND p.end_date > p_start_date;

    -- 代替部屋情報を取得
    SELECT json_agg(
        json_build_object(
            'roomId', r.room_id,
            'name', r.name,
            'capacity', r.capacity,
            'pricePerNight', r.price_per_night,
            'floor', r.floor,
            'availability', 'full'
        )
    ) INTO alternative_rooms
    FROM rooms r
    WHERE r.is_active = TRUE
        AND r.room_id != ALL(p_room_ids)
        AND NOT EXISTS (
            SELECT 1 
            FROM project_rooms pr
            INNER JOIN projects p ON pr.project_id = p.id
            WHERE pr.room_id = r.room_id
                AND p.status != 'cancelled'
                AND (p_exclude_booking_id IS NULL OR p.id != p_exclude_booking_id)
                AND p.start_date < p_end_date
                AND p.end_date > p_start_date
        )
    LIMIT 5;

    -- 代替日程情報を取得（簡易版）
    SELECT json_agg(
        json_build_object(
            'startDate', check_date,
            'endDate', check_date + (p_end_date - p_start_date),
            'daysOffset', check_date - p_start_date,
            'availability', 'full'
        )
    ) INTO alternative_dates
    FROM generate_series(
        GREATEST(p_start_date - INTERVAL '7 days', CURRENT_DATE), 
        p_start_date + INTERVAL '14 days', 
        INTERVAL '1 day'
    ) AS check_date
    WHERE check_date != p_start_date
        AND NOT EXISTS (
            SELECT 1 
            FROM project_rooms pr
            INNER JOIN projects p ON pr.project_id = p.id
            WHERE pr.room_id = ANY(p_room_ids)
                AND p.status != 'cancelled'
                AND (p_exclude_booking_id IS NULL OR p.id != p_exclude_booking_id)
                AND p.start_date < (check_date + (p_end_date - p_start_date))
                AND p.end_date > check_date
        )
    LIMIT 5;

    -- 結果をまとめる
    result := json_build_object(
        'conflicts', COALESCE(conflicts_data, '[]'::json),
        'alternativeRooms', COALESCE(alternative_rooms, '[]'::json),
        'alternativeDates', COALESCE(alternative_dates, '[]'::json),
        'timestamp', NOW(),
        'hasConflicts', (conflicts_data IS NOT NULL AND json_array_length(conflicts_data) > 0)
    );

    RETURN result;
END;
$$;

-- 予約ロック状態の詳細情報取得
CREATE OR REPLACE FUNCTION get_booking_lock_status(
    p_session_id TEXT,
    p_room_ids TEXT[],
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    lock_info JSON;
    other_sessions JSON;
    result JSON;
BEGIN
    -- 現在のセッションのロック情報
    SELECT json_build_object(
        'hasLock', COUNT(*) > 0,
        'lockExpiresAt', MAX(lock_expires_at),
        'lockedRooms', json_agg(room_id),
        'lockDuration', EXTRACT(EPOCH FROM (MAX(lock_expires_at) - NOW()))
    ) INTO lock_info
    FROM booking_locks
    WHERE session_id = p_session_id
        AND room_id = ANY(p_room_ids)
        AND lock_expires_at > NOW();

    -- 他のセッション情報
    SELECT json_agg(
        json_build_object(
            'sessionId', session_id,
            'activeSince', active_since,
            'roomCount', room_count,
            'lockExpiresAt', lock_expires_at
        )
    ) INTO other_sessions
    FROM get_active_sessions_for_period(p_room_ids, p_start_date, p_end_date)
    WHERE session_id != p_session_id;

    result := json_build_object(
        'currentSession', COALESCE(lock_info, json_build_object('hasLock', false)),
        'otherSessions', COALESCE(other_sessions, '[]'::json),
        'otherActiveCount', COALESCE(json_array_length(other_sessions), 0),
        'timestamp', NOW()
    );

    RETURN result;
END;
$$;

-- 予約システム統計情報取得
CREATE OR REPLACE FUNCTION get_booking_system_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'totalActiveLocks', (
            SELECT COUNT(*) 
            FROM booking_locks 
            WHERE lock_expires_at > NOW()
        ),
        'uniqueActiveSessions', (
            SELECT COUNT(DISTINCT session_id) 
            FROM booking_locks 
            WHERE lock_expires_at > NOW()
        ),
        'averageLockDuration', (
            SELECT AVG(EXTRACT(EPOCH FROM (lock_expires_at - created_at)))
            FROM booking_locks 
            WHERE lock_expires_at > NOW()
        ),
        'systemLoad', CASE 
            WHEN (SELECT COUNT(*) FROM booking_locks WHERE lock_expires_at > NOW()) > 10 THEN 'high'
            WHEN (SELECT COUNT(*) FROM booking_locks WHERE lock_expires_at > NOW()) > 5 THEN 'medium'
            ELSE 'low'
        END,
        'timestamp', NOW()
    ) INTO stats;

    RETURN stats;
END;
$$;

-- 期限切れロック自動削除のクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM booking_locks WHERE lock_expires_at <= NOW();
END;
$$;

-- 期限切れロック自動削除ジョブ（PostgreSQL拡張機能pg_cronが必要）
-- SELECT cron.schedule('cleanup-expired-locks', '*/5 * * * *', 'SELECT cleanup_expired_locks();');