import { PriceCalculator } from "@/lib/pricing/calculator"

describe("PriceCalculator", () => {
  let calculator: PriceCalculator

  beforeEach(() => {
    calculator = new PriceCalculator()
  })

  it("should create calculator instance", () => {
    expect(calculator).toBeInstanceOf(PriceCalculator)
  })

  it("should calculate room price correctly", () => {
    const rooms = [
      {
        roomId: "test-room",
        roomType: "large" as const,
        usageType: "shared" as const,
        roomRate: 20000,
        assignedGuests: 10,
      },
    ]

    const result = calculator.calculateRoomPrice(rooms, 2)
    expect(result).toBe(40000) // 20000 * 2 nights
  })
})
