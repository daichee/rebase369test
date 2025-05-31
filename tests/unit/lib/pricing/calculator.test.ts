import { calculateRoomPrice } from '@/lib/pricing/calculator'
import { calculateSimplePrice } from '@/lib/pricing/simple/SimplePriceCalculator'

describe('Pricing Calculator', () => {
  describe('calculateRoomPrice', () => {
    it('should calculate correct price for shared room weekday', () => {
      const result = calculateRoomPrice({
        roomUsage: 'shared',
        ageGroup: 'adult',
        checkIn: '2025-06-15', // Sunday (weekday for accommodation)
        checkOut: '2025-06-16',
        guestCount: 2,
        seasonType: 'regular'
      })

      expect(result.totalPrice).toBe(9600) // 4800 * 2 guests
      expect(result.pricePerNight).toBe(4800)
    })

    it('should calculate correct price for private room weekend', () => {
      const result = calculateRoomPrice({
        roomUsage: 'private',
        ageGroup: 'adult',
        checkIn: '2025-06-14', // Saturday (weekend)
        checkOut: '2025-06-15',
        guestCount: 1,
        seasonType: 'regular'
      })

      expect(result.totalPrice).toBe(10370) // Weekend rate for private adult
      expect(result.pricePerNight).toBe(10370)
    })

    it('should calculate correct price for student rates', () => {
      const result = calculateRoomPrice({
        roomUsage: 'shared',
        ageGroup: 'student',
        checkIn: '2025-06-15',
        checkOut: '2025-06-16',
        guestCount: 1,
        seasonType: 'regular'
      })

      expect(result.totalPrice).toBe(4000) // Student weekday rate
      expect(result.pricePerNight).toBe(4000)
    })

    it('should calculate correct price for peak season', () => {
      const result = calculateRoomPrice({
        roomUsage: 'shared',
        ageGroup: 'adult',
        checkIn: '2025-07-20', // Peak season weekday
        checkOut: '2025-07-21',
        guestCount: 1,
        seasonType: 'peak'
      })

      expect(result.totalPrice).toBe(5520) // Peak weekday rate
      expect(result.pricePerNight).toBe(5520)
    })

    it('should calculate correct price for multiple nights', () => {
      const result = calculateRoomPrice({
        roomUsage: 'shared',
        ageGroup: 'adult',
        checkIn: '2025-06-15',
        checkOut: '2025-06-17', // 2 nights
        guestCount: 1,
        seasonType: 'regular'
      })

      expect(result.nights).toBe(2)
      expect(result.totalPrice).toBe(9600) // 4800 * 2 nights
    })
  })

  describe('calculateSimplePrice', () => {
    it('should return consistent results with main calculator', () => {
      const mainResult = calculateRoomPrice({
        roomUsage: 'shared',
        ageGroup: 'adult',
        checkIn: '2025-06-15',
        checkOut: '2025-06-16',
        guestCount: 1,
        seasonType: 'regular'
      })

      const simpleResult = calculateSimplePrice({
        roomUsage: 'shared',
        ageGroup: 'adult',
        checkIn: '2025-06-15',
        checkOut: '2025-06-16',
        guestCount: 1,
        seasonType: 'regular'
      })

      expect(simpleResult.totalPrice).toBe(mainResult.totalPrice)
    })

    it('should handle edge cases gracefully', () => {
      expect(() => {
        calculateSimplePrice({
          roomUsage: 'shared',
          ageGroup: 'adult',
          checkIn: '2025-06-16',
          checkOut: '2025-06-15', // Invalid: checkout before checkin
          guestCount: 1,
          seasonType: 'regular'
        })
      }).toThrow()
    })

    it('should validate guest count limits', () => {
      expect(() => {
        calculateSimplePrice({
          roomUsage: 'shared',
          ageGroup: 'adult',
          checkIn: '2025-06-15',
          checkOut: '2025-06-16',
          guestCount: 0, // Invalid guest count
          seasonType: 'regular',
        })
      }).toThrow()
    })
  })

  describe('Price validation', () => {
    it('should always return positive prices', () => {
      const result = calculateRoomPrice({
        roomUsage: 'shared',
        ageGroup: 'adult',
        checkIn: '2025-06-15',
        checkOut: '2025-06-16',
        guestCount: 1,
        seasonType: 'regular'
      })

      expect(result.totalPrice).toBeGreaterThan(0)
      expect(result.pricePerNight).toBeGreaterThan(0)
    })

    it('should have consistent pricing structure', () => {
      const sharedPrice = calculateRoomPrice({
        roomUsage: 'shared',
        ageGroup: 'adult',
        checkIn: '2025-06-15',
        checkOut: '2025-06-16',
        guestCount: 1,
        seasonType: 'regular'
      })

      const privatePrice = calculateRoomPrice({
        roomUsage: 'private',
        ageGroup: 'adult',
        checkIn: '2025-06-15',
        checkOut: '2025-06-16',
        guestCount: 1,
        seasonType: 'regular'
      })

      // Private should be more expensive than shared
      expect(privatePrice.totalPrice).toBeGreaterThan(sharedPrice.totalPrice)
    })
  })
})