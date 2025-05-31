import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export interface RateConfig {
  // 個人料金設定
  personalRates: {
    shared: {
      adult: { weekday: number; weekend: number; peak_weekday: number; peak_weekend: number }
      student: { weekday: number; weekend: number; peak_weekday: number; peak_weekend: number }
      child: { weekday: number; weekend: number; peak_weekday: number; peak_weekend: number }
      infant: { weekday: number; weekend: number; peak_weekday: number; peak_weekend: number }
      baby: { weekday: number; weekend: number; peak_weekday: number; peak_weekend: number }
    }
    private: {
      adult: { weekday: number; weekend: number; peak_weekday: number; peak_weekend: number }
      student: { weekday: number; weekend: number; peak_weekday: number; peak_weekend: number }
      child: { weekday: number; weekend: number; peak_weekday: number; peak_weekend: number }
      infant: { weekday: number; weekend: number; peak_weekday: number; peak_weekend: number }
      baby: { weekday: number; weekend: number; peak_weekday: number; peak_weekend: number }
    }
  }
  
  // 部屋料金設定
  roomRates: {
    large: number
    medium_a: number
    medium_b: number
    small_a: number
    small_b: number
    small_c: number
  }
  
  // オプション料金設定
  addonRates: {
    meal: {
      breakfast: number
      lunch: number
      dinner: number
      bbq: number
    }
    facility: {
      projector: number
      sound_system: number
      flipchart: number
    }
    equipment: {
      bedding: number
      towel: number
      pillow: number
    }
  }
  
  // シーズン設定
  peakMonths: number[]
  
  // 設定メタデータ
  configName: string
  version: string
  lastUpdated: string
}

export interface EditableConfig extends RateConfig {
  id?: string
  isActive: boolean
  validFrom: string
  validUntil?: string
}

/**
 * 料金設定データベースサービス
 * 動的料金設定の管理とキャッシュを担当
 */
export class PriceConfigService {
  private static cache: RateConfig | null = null
  private static cacheTimestamp: number = 0
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5分

  /**
   * データベースから料金設定を読み込み
   */
  static async loadConfigFromDB(): Promise<RateConfig> {
    try {
      const supabase = createClient()
      
      // アクティブな設定を取得
      const { data: configData, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !configData) {
        console.warn('Database config not found, using fallback:', error?.message)
        return this.getFallbackConfig()
      }

      const config: RateConfig = JSON.parse(configData.config_data)
      this.cacheConfig(config)
      return config

    } catch (error) {
      console.error('Failed to load config from database:', error)
      return this.getFallbackConfig()
    }
  }

  /**
   * 料金設定をデータベースに保存
   */
  static async saveConfigToDB(config: EditableConfig): Promise<void> {
    try {
      const supabase = createClient()

      // 既存のアクティブ設定を無効化
      await supabase
        .from('pricing_config')
        .update({ is_active: false })
        .eq('is_active', true)

      // 新しい設定を保存
      const { error } = await supabase
        .from('pricing_config')
        .insert({
          config_name: config.configName,
          config_data: JSON.stringify(config),
          is_active: config.isActive,
          valid_from: config.validFrom,
          valid_until: config.validUntil || null
        })

      if (error) {
        throw new Error(`Failed to save config: ${error.message}`)
      }

      // キャッシュクリア
      this.clearCache()

    } catch (error) {
      console.error('Failed to save config to database:', error)
      throw error
    }
  }

  /**
   * 料金設定の妥当性検証
   */
  static validateConfig(config: RateConfig): boolean {
    try {
      // 必須フィールドの存在確認
      if (!config.personalRates || !config.roomRates || !config.addonRates) {
        return false
      }

      // 料金値の正数確認
      const checkPositiveValues = (obj: any): boolean => {
        for (const key in obj) {
          if (typeof obj[key] === 'number' && obj[key] < 0) {
            return false
          }
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (!checkPositiveValues(obj[key])) {
              return false
            }
          }
        }
        return true
      }

      return checkPositiveValues(config.personalRates) && 
             checkPositiveValues(config.roomRates) && 
             checkPositiveValues(config.addonRates)

    } catch (error) {
      console.error('Config validation error:', error)
      return false
    }
  }

  /**
   * キャッシュされた設定を取得
   */
  static getCachedConfig(): RateConfig | null {
    const now = Date.now()
    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.cache
    }
    return null
  }

  /**
   * 設定をメモリキャッシュに保存
   */
  static cacheConfig(config: RateConfig): void {
    this.cache = { ...config }
    this.cacheTimestamp = Date.now()
  }

  /**
   * キャッシュクリア
   */
  static clearCache(): void {
    this.cache = null
    this.cacheTimestamp = 0
  }

  /**
   * 管理画面用の編集可能設定を取得
   */
  static async getEditableConfig(): Promise<EditableConfig> {
    const config = await this.loadConfigFromDB()
    return {
      ...config,
      isActive: true,
      validFrom: new Date().toISOString(),
      validUntil: undefined
    }
  }

  /**
   * 管理画面からの設定更新
   */
  static async updateEditableConfig(config: EditableConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error('Invalid configuration provided')
    }

    config.lastUpdated = new Date().toISOString()
    config.version = `v${Date.now()}`

    await this.saveConfigToDB(config)
  }

  /**
   * フォールバック設定（データベース障害時）
   */
  private static getFallbackConfig(): RateConfig {
    return {
      personalRates: {
        shared: {
          adult: { weekday: 4800, weekend: 5856, peak_weekday: 5520, peak_weekend: 6734 },
          student: { weekday: 4000, weekend: 4880, peak_weekday: 4600, peak_weekend: 5612 },
          child: { weekday: 3200, weekend: 3904, peak_weekday: 3680, peak_weekend: 4490 },
          infant: { weekday: 1600, weekend: 1952, peak_weekday: 1840, peak_weekend: 2245 },
          baby: { weekday: 0, weekend: 0, peak_weekday: 0, peak_weekend: 0 }
        },
        private: {
          adult: { weekday: 8500, weekend: 10370, peak_weekday: 9775, peak_weekend: 11926 },
          student: { weekday: 7083, weekend: 8641, peak_weekday: 8146, peak_weekend: 9938 },
          child: { weekday: 5667, weekend: 6913, peak_weekday: 6518, peak_weekend: 7951 },
          infant: { weekday: 2833, weekend: 3457, peak_weekday: 3259, peak_weekend: 3975 },
          baby: { weekday: 0, weekend: 0, peak_weekday: 0, peak_weekend: 0 }
        }
      },
      roomRates: {
        large: 20000,
        medium_a: 13000,
        medium_b: 8000,
        small_a: 7000,
        small_b: 6000,
        small_c: 5000
      },
      addonRates: {
        meal: {
          breakfast: 600,
          lunch: 1000,
          dinner: 1500,
          bbq: 2000
        },
        facility: {
          projector: 2000,
          sound_system: 3000,
          flipchart: 500
        },
        equipment: {
          bedding: 500,
          towel: 200,
          pillow: 300
        }
      },
      peakMonths: [3, 4, 5, 7, 8, 9, 12],
      configName: 'fallback_config',
      version: 'v1.0.0',
      lastUpdated: new Date().toISOString()
    }
  }
}