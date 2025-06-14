import { NextRequest, NextResponse } from "next/server"
import { PriceCalculator } from "@/lib/pricing/calculator"
import type { GuestCount, DateRange, RoomUsage, AddonItem } from "@/lib/pricing/types"

/**
 * Calculates total pricing for a booking including rooms, guests, and add-ons
 * 
 * @param request - Next.js request object containing pricing calculation parameters
 * @returns JSON response with detailed pricing breakdown and calculations
 * 
 * Required Body Fields:
 * - rooms: Array of RoomUsage objects with roomType, capacity, etc.
 * - guests: GuestCount object with adult, student, child, infant, baby counts
 * - dateRange: Object with startDate and endDate (ISO strings)
 * 
 * Optional Body Fields:
 * - addons: Array of AddonItem objects for additional services
 * 
 * Response Format:
 * {
 *   priceBreakdown: {
 *     roomAmount: number,     // Total room charges
 *     guestAmount: number,    // Total guest charges (varies by age/day type)
 *     addonAmount: number,    // Total add-on charges
 *     subtotal: number,       // Sum of all amounts
 *     total: number,          // Rounded final total
 *     dailyBreakdown: Array   // Day-by-day pricing details
 *   },
 *   priceDetails: Object,     // Detailed rate information by date
 *   calculation: Object,      // Individual calculation components
 *   input: Object            // Echo of input parameters for verification
 * }
 * 
 * Validation:
 * - Total guest count must be > 0
 * - Total guest count must not exceed room capacity
 * - Date range must be valid with startDate < endDate
 * 
 * Error Responses: 400 for validation/calculation errors, 500 for server errors
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 必須パラメータのバリデーション
    const { rooms, guests, dateRange, addons = [] } = body

    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return NextResponse.json(
        { error: "Rooms array is required and must not be empty" },
        { status: 400 }
      )
    }

    if (!guests || typeof guests !== "object") {
      return NextResponse.json(
        { error: "Guests object is required" },
        { status: 400 }
      )
    }

    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      return NextResponse.json(
        { error: "Date range with startDate and endDate is required" },
        { status: 400 }
      )
    }

    // 日数計算
    const startDate = new Date(dateRange.startDate)
    const endDate = new Date(dateRange.endDate)
    const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

    const dateRangeWithNights: DateRange = {
      ...dateRange,
      nights
    }

    // ゲスト数のバリデーション
    const totalGuests = Object.values(guests as GuestCount).reduce((sum: number, count: number) => sum + count, 0)
    if (totalGuests <= 0) {
      return NextResponse.json(
        { error: "Total guest count must be greater than 0" },
        { status: 400 }
      )
    }

    // 部屋の定員チェック
    const totalCapacity = rooms.reduce((sum: number, room: RoomUsage) => sum + room.capacity, 0)
    if (totalGuests > totalCapacity) {
      return NextResponse.json(
        { error: `Total guest count (${totalGuests}) exceeds room capacity (${totalCapacity})` },
        { status: 400 }
      )
    }

    // 料金計算実行
    const priceBreakdown = PriceCalculator.calculateTotalPrice(
      rooms as RoomUsage[],
      guests as GuestCount,
      dateRangeWithNights,
      addons as AddonItem[]
    )

    // 料金詳細情報も取得
    const priceDetails = PriceCalculator.getPriceDetails(
      guests as GuestCount,
      dateRangeWithNights,
      rooms as RoomUsage[]
    )

    // 個別計算結果も提供
    const roomAmount = PriceCalculator.calculateRoomPrice(rooms as RoomUsage[], nights)
    const guestAmount = PriceCalculator.calculateGuestPriceSimplified(
      guests as GuestCount,
      dateRangeWithNights,
      rooms as RoomUsage[]
    )
    const addonAmount = PriceCalculator.calculateAddonPriceSimplified(
      addons as AddonItem[],
      dateRangeWithNights
    )

    return NextResponse.json({
      priceBreakdown,
      priceDetails,
      calculation: {
        roomAmount,
        guestAmount,
        addonAmount,
        subtotal: roomAmount + guestAmount + addonAmount,
        total: Math.round(roomAmount + guestAmount + addonAmount)
      },
      input: {
        rooms,
        guests,
        dateRange: dateRangeWithNights,
        addons,
        totalGuests,
        totalCapacity,
        nights
      }
    })

  } catch (error) {
    console.error("Error in price calculation:", error)
    
    // エラーの種類に応じて適切なレスポンスを返す
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Calculation error: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error during price calculation" },
      { status: 500 }
    )
  }
}