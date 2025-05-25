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

-- 料金データ投入（大部屋・中部屋利用時）
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

-- オプションデータ投入
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
