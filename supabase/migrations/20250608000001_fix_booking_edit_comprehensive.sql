-- Comprehensive Booking Edit Fix Migration
-- This migration ensures booking edits work by creating missing tables and fixing all references
-- Created: 2025-06-08
-- Purpose: Fix booking edit save errors caused by missing booking_price_details table

-- 1. Create booking_price_details table if it doesn't exist
-- (Re-applying parts of 20250531000001_pricing_system_unification.sql with corrections)

-- Check if booking_price_details table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'booking_price_details') THEN
        
        -- Create the table
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

        -- Create indexes
        CREATE INDEX idx_booking_price_details_booking ON booking_price_details(booking_id);
        CREATE INDEX idx_booking_price_details_created_at ON booking_price_details(created_at);
        
        -- Enable RLS
        ALTER TABLE booking_price_details ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Created booking_price_details table with indexes and RLS enabled';
        
    ELSE
        RAISE NOTICE 'booking_price_details table already exists';
    END IF;
END$$;

-- 2. Create pricing_config table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'pricing_config') THEN
        
        -- Create the table
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

        -- Create indexes
        CREATE INDEX idx_pricing_config_active ON pricing_config(is_active, valid_from, valid_until);
        CREATE INDEX idx_pricing_config_name ON pricing_config(config_name);
        
        -- Enable RLS
        ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Created pricing_config table with indexes and RLS enabled';
        
    ELSE
        RAISE NOTICE 'pricing_config table already exists';
    END IF;
END$$;

-- 3. Safely drop existing problematic policies and create corrected ones
DO $$
BEGIN
    -- Drop existing policies if they exist (ignore errors for broken references)
    BEGIN
        DROP POLICY IF EXISTS "Users can view booking price details they own" ON booking_price_details;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "Users can view booking price details they own": %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can insert booking price details for their bookings" ON booking_price_details;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "Users can insert booking price details for their bookings": %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Admins can view all booking price details" ON booking_price_details;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "Admins can view all booking price details": %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can view all booking price details" ON booking_price_details;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "Users can view all booking price details": %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "All users can view active pricing config" ON pricing_config;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "All users can view active pricing config": %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Admins can manage pricing config" ON pricing_config;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "Admins can manage pricing config": %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can manage pricing config" ON pricing_config;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "Users can manage pricing config": %', SQLERRM;
    END;
    
    RAISE NOTICE 'Completed policy cleanup';
END$$;

-- 4. Create corrected RLS policies for booking_price_details
CREATE POLICY "Users can view booking price details they own" ON booking_price_details
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()  -- Fixed: use created_by instead of user_id
    )
  );

CREATE POLICY "Users can insert booking price details for their bookings" ON booking_price_details
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()  -- Fixed: use created_by instead of user_id
    ) AND
    created_by = auth.uid()
  );

-- Simplified admin policy without role check (since role column was removed)
CREATE POLICY "Users can view all booking price details" ON booking_price_details
  FOR SELECT USING (auth.uid() IS NOT NULL);  -- Allow all authenticated users to view

-- 5. Create corrected RLS policies for pricing_config
CREATE POLICY "All users can view active pricing config" ON pricing_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage pricing config" ON pricing_config
  FOR ALL USING (auth.uid() IS NOT NULL)  -- Allow all authenticated users
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Add initial pricing config data if none exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pricing_config WHERE is_active = true) THEN
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
        
        RAISE NOTICE 'Inserted default pricing configuration';
    ELSE
        RAISE NOTICE 'Active pricing configuration already exists';
    END IF;
END$$;

-- 7. Create pricing config update trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'update_pricing_config_timestamp'
    ) THEN
        CREATE OR REPLACE FUNCTION update_pricing_config_timestamp()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Created update_pricing_config_timestamp function';
    END IF;
    
    -- Drop trigger if exists and recreate
    DROP TRIGGER IF EXISTS pricing_config_updated_at ON pricing_config;
    CREATE TRIGGER pricing_config_updated_at
        BEFORE UPDATE ON pricing_config
        FOR EACH ROW EXECUTE FUNCTION update_pricing_config_timestamp();
        
    RAISE NOTICE 'Created pricing_config_updated_at trigger';
END$$;

-- 8. Add helpful comments
COMMENT ON TABLE booking_price_details IS '予約料金計算詳細保存テーブル - 計算結果と過程の完全な記録 (Fixed: 2025-06-08)';
COMMENT ON TABLE pricing_config IS '動的料金設定管理テーブル - 管理画面から変更可能な料金体系 (Fixed: 2025-06-08)';

-- 9. Final verification
DO $$
BEGIN
    -- Verify tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'booking_price_details') THEN
        RAISE NOTICE 'SUCCESS: booking_price_details table is ready';
    ELSE
        RAISE EXCEPTION 'FAILED: booking_price_details table was not created';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pricing_config') THEN
        RAISE NOTICE 'SUCCESS: pricing_config table is ready';
    ELSE
        RAISE EXCEPTION 'FAILED: pricing_config table was not created';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully - booking edit should now work!';
END$$;