-- 部屋データ投入
INSERT INTO rooms (room_id, name, floor, capacity, room_type, room_rate, usage_type, amenities, description) VALUES
-- 2F（5部屋）
('R201', '1年1組', '2F', 5, 'small_a', 7000, 'private', '{"エアコン","照明"}', '5名定員の個室'),
('R202', '1年2組', '2F', 5, 'small_a', 7000, 'private', '{"エアコン","照明"}', '5名定員の個室'),
('R203', '2年1組', '2F', 5, 'small_c', 5000, 'private', '{"エアコン","照明"}', '5名定員の個室'),
('R204', '2年2組', '2F', 5, 'small_c', 5000, 'private', '{"エアコン","照明"}', '5名定員の個室'),
('R205', '作法室', '2F', 25, 'large', 20000, 'shared', '{"エアコン","照明","和室"}', '25名定員の大部屋'),

-- 3F（8部屋）
('R301', '3年1組', '3F', 5, 'small_c', 5000, 'private', '{"エアコン","照明"}', '5名定員の個室'),
('R302', '3年2組', '3F', 5, 'small_c', 5000, 'private', '{"エアコン","照明"}', '5名定員の個室'),
('R303', '3年3組', '3F', 5, 'small_c', 5000, 'private', '{"エアコン","照明"}', '5名定員の個室'),
('R304', '理科室', '3F', 10, 'small_b', 6000, 'private', '{"エアコン","照明","実験台"}', '10名定員の個室'),
('R305', '図書室', '3F', 10, 'medium_b', 8000, 'shared', '{"エアコン","照明","書棚"}', '10名定員の中部屋'),
('R306', '視聴覚室', '3F', 21, 'medium_a', 13000, 'shared', '{"エアコン","照明","プロジェクター"}', '21名定員の中部屋'),
('R307', '被服室', '3F', 35, 'large', 20000, 'shared', '{"エアコン","照明","作業台"}', '35名定員の大部屋');

-- シーズンデータ投入
INSERT INTO seasons (season_id, name, season_type, start_date, end_date, pax_rate_multiplier) VALUES
('peak_spring_2025', '春期繁忙期', 'peak', '2025-03-01', '2025-04-30', 1.15),
('peak_summer_2025', '夏期繁忙期', 'peak', '2025-07-01', '2025-09-30', 1.15),
('peak_winter_2025', '年末年始', 'peak', '2025-12-01', '2025-12-31', 1.15),
('on_regular_2025', '通常期', 'regular', '2025-01-01', '2025-12-31', 1.0);

-- 料金データ投入（料金表画像に基づく正確な料金）
INSERT INTO rates (season_id, day_type, room_usage, age_group, base_price) VALUES
-- 通常期・平日・大部屋中部屋
('on_regular_2025', 'weekday', 'shared', 'adult', 4800),
('on_regular_2025', 'weekday', 'shared', 'student', 4000),
('on_regular_2025', 'weekday', 'shared', 'child', 3200),
('on_regular_2025', 'weekday', 'shared', 'infant', 2500),
('on_regular_2025', 'weekday', 'shared', 'baby', 0),

-- 通常期・休日・大部屋中部屋
('on_regular_2025', 'weekend', 'shared', 'adult', 5856),
('on_regular_2025', 'weekend', 'shared', 'student', 4880),
('on_regular_2025', 'weekend', 'shared', 'child', 3904),
('on_regular_2025', 'weekend', 'shared', 'infant', 3050),
('on_regular_2025', 'weekend', 'shared', 'baby', 0),

-- 通常期・平日・個室
('on_regular_2025', 'weekday', 'private', 'adult', 8500),
('on_regular_2025', 'weekday', 'private', 'adult_leader', 6800),
('on_regular_2025', 'weekday', 'private', 'student', 5900),
('on_regular_2025', 'weekday', 'private', 'child', 5000),
('on_regular_2025', 'weekday', 'private', 'infant', 4200),
('on_regular_2025', 'weekday', 'private', 'baby', 0),

-- 通常期・休日・個室
('on_regular_2025', 'weekend', 'private', 'adult', 10370),
('on_regular_2025', 'weekend', 'private', 'adult_leader', 8296),
('on_regular_2025', 'weekend', 'private', 'student', 7198),
('on_regular_2025', 'weekend', 'private', 'child', 6100),
('on_regular_2025', 'weekend', 'private', 'infant', 5124),
('on_regular_2025', 'weekend', 'private', 'baby', 0);

-- オプションデータ投入（料金表画像に基づく正確な料金）
INSERT INTO add_ons (add_on_id, category, name, unit, adult_fee, student_fee, child_fee, infant_fee) VALUES
-- 食事（年齢区分別）
('breakfast', 'meal', '朝食', '人・回', 700, 700, 700, 700),
('dinner', 'meal', '夕食', '人・回', 1500, 1000, 800, 800),
('bbq', 'meal', 'BBQ', '人・回', 3000, 2200, 1500, 1500);

-- 施設利用
INSERT INTO add_ons (
  add_on_id, category, name, unit,
  personal_fee_5h, personal_fee_10h, personal_fee_over,
  room_fee_weekday_guest, room_fee_weekday_other,
  room_fee_weekend_guest, room_fee_weekend_other,
  aircon_fee_per_hour
) VALUES
('meeting_room', 'facility', '会議室', '人・日', 200, 400, 600, 1000, 1500, 1500, 2000, 500),
('gymnasium', 'facility', '体育館', '人・日', 500, 500, 500, 2000, 3500, 2500, 4500, 1500);

-- 備品
INSERT INTO add_ons (add_on_id, category, name, unit, adult_fee, student_fee, child_fee, infant_fee, min_quantity, max_quantity) VALUES
('projector', 'equipment', 'プロジェクター', '台・泊', 3000, 3000, 3000, 3000, 1, 3);

-- サンプル予約データ投入（2025年6月-7月）
-- 顧客1社目：関西大学サークル（学生中心）
INSERT INTO projects (
  id, status, start_date, end_date, 
  pax_total, pax_adults, pax_adult_leaders, pax_students, pax_children, pax_infants, pax_babies,
  guest_name, guest_email, guest_phone, guest_org, purpose,
  room_amount, pax_amount, addon_amount, subtotal_amount, total_amount,
  notes, created_at, updated_at
) VALUES 
(
  uuid_generate_v4(), 'confirmed', '2025-06-15', '2025-06-17',
  18, 2, 2, 14, 0, 0, 0,
  '田中 健太', 'tanaka@kansai-u.ac.jp', '090-1234-5678', '関西大学 テニスサークル', '合宿',
  40000, 172800, 54000, 266800, 266800,
  'Board未同期のサンプルデータ', '2025-05-28 10:00:00+09', '2025-05-28 10:00:00+09'
),
(
  uuid_generate_v4(), 'confirmed', '2025-06-28', '2025-06-30',
  25, 3, 3, 19, 0, 0, 0,
  '佐藤 美咲', 'sato@kansai-u.ac.jp', '090-2345-6789', '関西大学 吹奏楽部', '夏合宿',
  40000, 240000, 75000, 355000, 355000,
  'Board未同期のサンプルデータ', '2025-05-28 11:00:00+09', '2025-05-28 11:00:00+09'
);

-- 顧客2社目：株式会社テックソリューション（企業研修）
INSERT INTO projects (
  id, status, start_date, end_date, 
  pax_total, pax_adults, pax_adult_leaders, pax_students, pax_children, pax_infants, pax_babies,
  guest_name, guest_email, guest_phone, guest_org, purpose,
  room_amount, pax_amount, addon_amount, subtotal_amount, total_amount,
  notes, created_at, updated_at
) VALUES 
(
  uuid_generate_v4(), 'confirmed', '2025-07-03', '2025-07-05',
  12, 12, 0, 0, 0, 0, 0,
  '山田 一郎', 'yamada@techsol.co.jp', '06-1234-5678', '株式会社テックソリューション', '新人研修',
  30000, 144000, 36000, 210000, 210000,
  'Board未同期のサンプルデータ', '2025-05-28 12:00:00+09', '2025-05-28 12:00:00+09'
),
(
  uuid_generate_v4(), 'confirmed', '2025-07-18', '2025-07-20',
  8, 8, 0, 0, 0, 0, 0,
  '鈴木 花子', 'suzuki@techsol.co.jp', '06-2345-6789', '株式会社テックソリューション', 'チームビルディング研修',
  20000, 96000, 24000, 140000, 140000,
  'Board未同期のサンプルデータ', '2025-05-28 13:00:00+09', '2025-05-28 13:00:00+09'
),
(
  uuid_generate_v4(), 'draft', '2025-07-25', '2025-07-27',
  15, 15, 0, 0, 0, 0, 0,
  '高橋 次郎', 'takahashi@techsol.co.jp', '06-3456-7890', '株式会社テックソリューション', '幹部合宿',
  35000, 180000, 45000, 260000, 260000,
  'Board未同期のサンプルデータ（未確定）', '2025-05-28 14:00:00+09', '2025-05-28 14:00:00+09'
);

-- サンプル予約の部屋割り当て
DO $$
DECLARE 
    project_rec RECORD;
    room_count INT;
BEGIN
    -- 各プロジェクトに対して部屋を割り当て
    FOR project_rec IN 
        SELECT id, pax_total, start_date, end_date, 
               EXTRACT(DOW FROM start_date) as start_dow,
               (end_date - start_date) as nights
        FROM projects 
        WHERE notes LIKE '%Board未同期%'
    LOOP
        -- 人数に応じて部屋を割り当て
        IF project_rec.pax_total <= 10 THEN
            -- 小グループ：個室を利用
            INSERT INTO project_rooms (project_id, room_id, assigned_pax, room_rate, nights)
            VALUES (project_rec.id, 'R201', project_rec.pax_total, 7000, project_rec.nights);
        ELSIF project_rec.pax_total <= 20 THEN
            -- 中グループ：中部屋を利用
            INSERT INTO project_rooms (project_id, room_id, assigned_pax, room_rate, nights)
            VALUES (project_rec.id, 'R306', project_rec.pax_total, 13000, project_rec.nights);
        ELSE
            -- 大グループ：大部屋を利用
            INSERT INTO project_rooms (project_id, room_id, assigned_pax, room_rate, nights)
            VALUES (project_rec.id, 'R307', project_rec.pax_total, 20000, project_rec.nights);
        END IF;
    END LOOP;
END $$;

-- サンプル予約のオプション追加
DO $$
DECLARE 
    project_rec RECORD;
BEGIN
    FOR project_rec IN 
        SELECT id, pax_total, (end_date - start_date) as nights
        FROM projects 
        WHERE notes LIKE '%Board未同期%'
    LOOP
        -- 朝食を追加（宿泊数分）
        INSERT INTO project_items (project_id, item_type, item_code, item_name, category, quantity, unit, unit_price)
        VALUES (project_rec.id, 'addon', 'breakfast', '朝食', 'meal', project_rec.pax_total * project_rec.nights, '人・回', 700);
        
        -- 夕食を追加（宿泊数分）
        INSERT INTO project_items (project_id, item_type, item_code, item_name, category, quantity, unit, unit_price)
        VALUES (project_rec.id, 'addon', 'dinner', '夕食', 'meal', project_rec.pax_total * project_rec.nights, '人・回', 1500);
    END LOOP;
END $$;