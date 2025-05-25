import type { BoardEstimateItem, BookingToBoard } from "./types"
import type { Booking } from "@/store/booking-store"
import type { Room } from "@/store/room-store"

export class BookingToBoardMapper {
  // 予約データをBoard見積もり明細に変換
  static mapBookingToBoard(booking: Booking, rooms: Room[], priceBreakdown: any): BookingToBoard {
    const roomItems = this.createRoomItems(booking, rooms, priceBreakdown)
    const guestItems = this.createGuestItems(booking, priceBreakdown)
    const addonItems = this.createAddonItems(booking, priceBreakdown)

    return {
      booking_id: booking.id,
      board_project_id: 0, // 後で設定
      room_items: roomItems,
      guest_items: guestItems,
      addon_items: addonItems,
      total_amount: booking.totalAmount,
    }
  }

  // 室料明細の作成
  private static createRoomItems(booking: Booking, rooms: Room[], priceBreakdown: any): BoardEstimateItem[] {
    const room = rooms.find((r) => r.id === booking.roomId)
    if (!room) return []

    const nights = this.calculateNights(booking.checkIn, booking.checkOut)

    return [
      {
        item_code: `ROOM_${room.id}`,
        item_name: `${room.name} 室料`,
        category: "宿泊料金",
        quantity: nights,
        unit: "泊",
        unit_price: room.basePrice,
        amount: room.basePrice * nights,
        description: `${booking.checkIn} ～ ${booking.checkOut} (${nights}泊)`,
        sort_order: 1,
      },
    ]
  }

  // 個人料金明細の作成
  private static createGuestItems(booking: Booking, priceBreakdown: any): BoardEstimateItem[] {
    const items: BoardEstimateItem[] = []
    const nights = this.calculateNights(booking.checkIn, booking.checkOut)

    // 年齢区分別の料金を計算（実際の料金計算エンジンと連携）
    const guestTypes = [
      { code: "ADULT", name: "大人", count: 2 }, // サンプル
      { code: "STUDENT", name: "学生", count: 0 },
      { code: "CHILD", name: "小学生", count: 0 },
      { code: "INFANT", name: "未就学児", count: 0 },
    ]

    guestTypes.forEach((type, index) => {
      if (type.count > 0) {
        const unitPrice = this.getGuestUnitPrice(type.code, booking)
        items.push({
          item_code: `GUEST_${type.code}`,
          item_name: `${type.name} 宿泊料`,
          category: "個人料金",
          quantity: type.count * nights,
          unit: "人泊",
          unit_price: unitPrice,
          amount: unitPrice * type.count * nights,
          description: `${type.count}名 × ${nights}泊`,
          sort_order: 10 + index,
        })
      }
    })

    return items
  }

  // オプション料金明細の作成
  private static createAddonItems(booking: Booking, priceBreakdown: any): BoardEstimateItem[] {
    const items: BoardEstimateItem[] = []

    // サンプルオプション（実際のオプション選択機能と連携）
    const addons = [
      { code: "BREAKFAST", name: "朝食", quantity: 4, unitPrice: 700 },
      { code: "DINNER", name: "夕食", quantity: 4, unitPrice: 1500 },
    ]

    addons.forEach((addon, index) => {
      items.push({
        item_code: `ADDON_${addon.code}`,
        item_name: addon.name,
        category: "オプション",
        quantity: addon.quantity,
        unit: "人回",
        unit_price: addon.unitPrice,
        amount: addon.quantity * addon.unitPrice,
        sort_order: 20 + index,
      })
    })

    return items
  }

  // 宿泊日数計算
  private static calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  // 年齢区分別単価取得（仮実装）
  private static getGuestUnitPrice(ageCode: string, booking: Booking): number {
    const basePrices = {
      ADULT: 4800,
      STUDENT: 4000,
      CHILD: 3200,
      INFANT: 2500,
    }
    return basePrices[ageCode as keyof typeof basePrices] || 0
  }

  // Board明細から予約データへの逆変換
  static mapBoardToBooking(items: BoardEstimateItem[]): Partial<Booking> {
    const roomItems = items.filter((item) => item.category === "宿泊料金")
    const guestItems = items.filter((item) => item.category === "個人料金")
    const addonItems = items.filter((item) => item.category === "オプション")

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    return {
      totalAmount,
      // 他の必要なフィールドをマッピング
    }
  }
}
