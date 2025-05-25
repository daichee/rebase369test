import type { BoardEstimate, BoardEstimateItem, CreateEstimateRequest } from "./types"
import { format } from "date-fns"

// 予約データの型（簡略化）
interface Booking {
  id: string
  customerId: string
  guestName: string
  email: string
  phone: string
  address: string
  startDate: string
  endDate: string
  nights: number
  status: string
  totalAmount: number
  rooms: {
    roomId: string
    roomName: string
    guests: number
    roomRate: number
  }[]
  guests: {
    ageGroup: string
    count: number
    rate: number
  }[]
  addons: {
    addonId: string
    name: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * 予約データからBoard見積もりデータへの変換を行うクラス
 */
export class EstimateConverter {
  /**
   * 予約データから見積もり作成リクエストを生成する
   */
  static bookingToCreateEstimateRequest(booking: Booking, customerId: string): CreateEstimateRequest {
    // 見積もりタイトル
    const title = `ReBASE369 宿泊予約 ${format(new Date(booking.startDate), "yyyy/MM/dd")}～${format(new Date(booking.endDate), "yyyy/MM/dd")}`

    // 発行日（今日）
    const issueDate = format(new Date(), "yyyy-MM-dd")

    // 有効期限（チェックイン日）
    const expireDate = booking.startDate

    // 見積もり項目の作成
    const items: CreateEstimateRequest["items"] = []

    // 1. 室料
    booking.rooms.forEach((room) => {
      items.push({
        title: `室料: ${room.roomName}`,
        unit_price: room.roomRate,
        quantity: booking.nights,
        unit: "泊",
        tax_rate: 10, // 消費税10%
        tax_type: "excluded", // 税抜き価格
        description: `${room.guests}名利用 × ${booking.nights}泊`,
      })
    })

    // 2. 宿泊者料金
    const guestGroups: Record<string, { label: string; count: number; rate: number }> = {}

    booking.guests.forEach((guest) => {
      const label = this.getAgeGroupLabel(guest.ageGroup)
      guestGroups[guest.ageGroup] = {
        label,
        count: guest.count,
        rate: guest.rate,
      }
    })

    Object.values(guestGroups).forEach((group) => {
      items.push({
        title: `宿泊料: ${group.label}`,
        unit_price: group.rate,
        quantity: group.count * booking.nights,
        unit: "人泊",
        tax_rate: 10, // 消費税10%
        tax_type: "excluded", // 税抜き価格
        description: `${group.count}名 × ${booking.nights}泊`,
      })
    })

    // 3. オプション
    booking.addons.forEach((addon) => {
      items.push({
        title: `オプション: ${addon.name}`,
        unit_price: addon.unitPrice,
        quantity: addon.quantity,
        unit: "個",
        tax_rate: 10, // 消費税10%
        tax_type: "excluded", // 税抜き価格
      })
    })

    return {
      title,
      issue_date: issueDate,
      expire_date: expireDate,
      customer_id: customerId,
      memo: booking.notes,
      items,
    }
  }

  /**
   * 年齢区分のラベルを取得する
   */
  private static getAgeGroupLabel(ageGroup: string): string {
    const labels: Record<string, string> = {
      adult: "大人",
      adult_leader: "大人合宿付添",
      student: "中高大学生",
      child: "小学生",
      infant: "未就学児",
      baby: "乳幼児",
    }
    return labels[ageGroup] || ageGroup
  }

  /**
   * Board見積もりデータから予約データへの変換（未実装）
   */
  static estimateToBooking(estimate: BoardEstimate, items: BoardEstimateItem[]): Partial<Booking> {
    // 実装予定
    return {}
  }
}
