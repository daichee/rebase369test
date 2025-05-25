import type { Booking } from "@/store/booking-store"
import type { Room } from "@/store/room-store"

export class CSVExporter {
  /**
   * 予約データをCSVエクスポート
   */
  static exportBookings(bookings: Booking[], rooms: Room[]): void {
    const headers = [
      "予約ID",
      "顧客名",
      "メールアドレス",
      "電話番号",
      "チェックイン",
      "チェックアウト",
      "宿泊日数",
      "宿泊人数",
      "部屋名",
      "合計金額",
      "ステータス",
      "作成日",
      "備考",
    ]

    const rows = bookings.map((booking) => {
      const room = rooms.find((r) => r.id === booking.roomId)
      const nights = Math.ceil(
        (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24),
      )

      return [
        booking.id,
        booking.guestName || "",
        booking.guestEmail || "",
        booking.guestPhone || "",
        booking.checkIn,
        booking.checkOut,
        nights.toString(),
        booking.guestCount.toString(),
        room?.name || "",
        booking.totalAmount.toString(),
        this.getStatusLabel(booking.status),
        new Date(booking.createdAt).toLocaleDateString("ja-JP"),
        booking.notes || "",
      ]
    })

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    this.downloadCSV(csvContent, `予約一覧_${new Date().toISOString().split("T")[0]}.csv`)
  }

  /**
   * 部屋データをCSVエクスポート
   */
  static exportRooms(rooms: Room[]): void {
    const headers = [
      "部屋ID",
      "部屋名",
      "フロア",
      "定員",
      "部屋タイプ",
      "基本料金",
      "利用タイプ",
      "ステータス",
      "設備",
      "説明",
    ]

    const rows = rooms.map((room) => [
      room.id,
      room.name,
      room.type,
      room.capacity.toString(),
      room.type,
      room.basePrice.toString(),
      room.type.includes("large") || room.type.includes("medium") ? "大部屋・中部屋" : "個室",
      room.isActive ? "アクティブ" : "非アクティブ",
      room.amenities?.join(", ") || "",
      room.description || "",
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    this.downloadCSV(csvContent, `部屋一覧_${new Date().toISOString().split("T")[0]}.csv`)
  }

  /**
   * 稼働率レポートをCSVエクスポート
   */
  static exportOccupancyReport(startDate: string, endDate: string, rooms: Room[], bookings: Booking[]): void {
    const headers = ["日付", "曜日", ...rooms.map((room) => room.name), "全体稼働率"]
    const rows: string[][] = []

    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()]

      const row = [dateStr, dayOfWeek]
      let occupiedRooms = 0

      rooms.forEach((room) => {
        const isOccupied = bookings.some(
          (booking) =>
            booking.roomId === room.id &&
            booking.status === "confirmed" &&
            dateStr >= booking.checkIn &&
            dateStr < booking.checkOut,
        )

        row.push(isOccupied ? "○" : "×")
        if (isOccupied) occupiedRooms++
      })

      const occupancyRate = ((occupiedRooms / rooms.length) * 100).toFixed(1)
      row.push(`${occupancyRate}%`)

      rows.push(row)
    }

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    this.downloadCSV(csvContent, `稼働率レポート_${startDate}_${endDate}.csv`)
  }

  /**
   * CSVファイルダウンロード
   */
  private static downloadCSV(content: string, filename: string): void {
    const BOM = "\uFEFF" // UTF-8 BOM for Excel compatibility
    const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  /**
   * ステータスラベル取得
   */
  private static getStatusLabel(status: string): string {
    const labels = {
      pending: "保留中",
      confirmed: "確定",
      cancelled: "キャンセル",
      completed: "完了",
    }
    return labels[status as keyof typeof labels] || status
  }
}
