/**
 * タイムゾーン安全な日付処理ユーティリティ
 * 日付をローカルタイムゾーンで一貫して処理し、UTCによる日付ズレを防ぐ
 */

/**
 * 日付文字列をローカルタイムゾーンのDateオブジェクトとして解析
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns ローカルタイムゾーンでのDateオブジェクト
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) throw new Error('日付文字列が必要です')
  
  const [year, month, day] = dateString.split('-').map(Number)
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error('無効な日付形式です。YYYY-MM-DD形式で入力してください')
  }
  
  // monthは0ベースなので-1
  return new Date(year, month - 1, day)
}

/**
 * DateオブジェクトをYYYY-MM-DD形式の文字列に変換（ローカルタイムゾーン）
 * @param date Dateオブジェクト
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function formatLocalDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('有効なDateオブジェクトが必要です')
  }
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 2つの日付間の夜数を計算（チェックアウト日は含まない）
 * @param startDate 開始日（YYYY-MM-DD または Dateオブジェクト）
 * @param endDate 終了日（YYYY-MM-DD または Dateオブジェクト）
 * @returns 宿泊夜数
 */
export function calculateNights(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? parseLocalDate(startDate) : startDate
  const end = typeof endDate === 'string' ? parseLocalDate(endDate) : endDate
  
  if (start >= end) {
    throw new Error('開始日は終了日より前である必要があります')
  }
  
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(1, diffDays)
}

/**
 * 日付範囲を生成（開始日から終了日の前日まで）
 * @param startDate 開始日
 * @param endDate 終了日（含まない）
 * @returns Date配列
 */
export function generateDateRange(startDate: string | Date, endDate: string | Date): Date[] {
  const start = typeof startDate === 'string' ? parseLocalDate(startDate) : startDate
  const end = typeof endDate === 'string' ? parseLocalDate(endDate) : endDate
  
  const dates: Date[] = []
  const current = new Date(start)
  
  while (current < end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

/**
 * 2つの日付範囲が重複しているかチェック
 * @param start1 範囲1開始日
 * @param end1 範囲1終了日
 * @param start2 範囲2開始日
 * @param end2 範囲2終了日
 * @returns 重複している場合true
 */
export function isDateRangeOverlap(
  start1: string | Date, 
  end1: string | Date, 
  start2: string | Date, 
  end2: string | Date
): boolean {
  const s1 = typeof start1 === 'string' ? parseLocalDate(start1) : start1
  const e1 = typeof end1 === 'string' ? parseLocalDate(end1) : end1
  const s2 = typeof start2 === 'string' ? parseLocalDate(start2) : start2
  const e2 = typeof end2 === 'string' ? parseLocalDate(end2) : end2
  
  return s1 < e2 && s2 < e1
}

/**
 * 日付が指定された範囲内にあるかチェック
 * @param date チェックする日付
 * @param startDate 範囲開始日（含む）
 * @param endDate 範囲終了日（含まない）
 * @returns 範囲内の場合true
 */
export function isDateInRange(
  date: string | Date, 
  startDate: string | Date, 
  endDate: string | Date
): boolean {
  const d = typeof date === 'string' ? parseLocalDate(date) : date
  const start = typeof startDate === 'string' ? parseLocalDate(startDate) : startDate
  const end = typeof endDate === 'string' ? parseLocalDate(endDate) : endDate
  
  return d >= start && d < end
}

/**
 * 今日の日付をYYYY-MM-DD形式で取得
 * @returns 今日の日付文字列
 */
export function getTodayString(): string {
  return formatLocalDate(new Date())
}

/**
 * 今日の日付をDateオブジェクトとして取得（時刻は00:00:00）
 * @returns 今日のDateオブジェクト
 */
export function getTodayDate(): Date {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

/**
 * 日付文字列の妥当性チェック
 * @param dateString チェックする日付文字列
 * @returns 有効な場合true
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false
  
  try {
    const date = parseLocalDate(dateString)
    return formatLocalDate(date) === dateString
  } catch {
    return false
  }
}