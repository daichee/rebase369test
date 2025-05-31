import { useBookingStore } from '@/store/booking-store'
import { act, renderHook } from '@testing-library/react'

describe('BookingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useBookingStore())
    act(() => {
      result.current.reset()
    })
  })

  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useBookingStore())
      
      expect(result.current.step).toBe(1)
      expect(result.current.formData).toEqual({
        checkIn: '',
        checkOut: '',
        guestCount: 1,
        customerInfo: null,
        selectedRoom: null,
        selectedOptions: [],
        totalPrice: 0
      })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.errors).toEqual({})
    })
  })

  describe('Step navigation', () => {
    it('should advance to next step', () => {
      const { result } = renderHook(() => useBookingStore())
      
      act(() => {
        result.current.nextStep()
      })
      
      expect(result.current.step).toBe(2)
    })

    it('should go back to previous step', () => {
      const { result } = renderHook(() => useBookingStore())
      
      act(() => {
        result.current.nextStep()
        result.current.previousStep()
      })
      
      expect(result.current.step).toBe(1)
    })

    it('should not go below step 1', () => {
      const { result } = renderHook(() => useBookingStore())
      
      act(() => {
        result.current.previousStep()
      })
      
      expect(result.current.step).toBe(1)
    })

    it('should not exceed maximum steps', () => {
      const { result } = renderHook(() => useBookingStore())
      
      // Try to go beyond max steps
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.nextStep()
        }
      })
      
      expect(result.current.step).toBeLessThanOrEqual(5) // Assuming 5 max steps
    })

    it('should set specific step', () => {
      const { result } = renderHook(() => useBookingStore())
      
      act(() => {
        result.current.setStep(3)
      })
      
      expect(result.current.step).toBe(3)
    })
  })

  describe('Form data management', () => {
    it('should update basic info', () => {
      const { result } = renderHook(() => useBookingStore())
      
      const basicInfo = {
        checkIn: '2025-06-15',
        checkOut: '2025-06-17',
        guestCount: 2
      }
      
      act(() => {
        result.current.updateBasicInfo(basicInfo)
      })
      
      expect(result.current.formData.checkIn).toBe('2025-06-15')
      expect(result.current.formData.checkOut).toBe('2025-06-17')
      expect(result.current.formData.guestCount).toBe(2)
    })

    it('should update customer info', () => {
      const { result } = renderHook(() => useBookingStore())
      
      const customerInfo = {
        name: '田中太郎',
        email: 'tanaka@example.com',
        phone: '090-1234-5678',
        organization: 'テスト会社'
      }
      
      act(() => {
        result.current.updateCustomerInfo(customerInfo)
      })
      
      expect(result.current.formData.customerInfo).toEqual(customerInfo)
    })

    it('should select room', () => {
      const { result } = renderHook(() => useBookingStore())
      
      const room = {
        id: '201',
        name: '201号室',
        type: 'shared',
        capacity: 4,
        price: 4800
      }
      
      act(() => {
        result.current.selectRoom(room)
      })
      
      expect(result.current.formData.selectedRoom).toEqual(room)
    })

    it('should update selected options', () => {
      const { result } = renderHook(() => useBookingStore())
      
      const options = [
        { id: 'breakfast', name: '朝食', price: 800 },
        { id: 'dinner', name: '夕食', price: 1200 }
      ]
      
      act(() => {
        result.current.updateSelectedOptions(options)
      })
      
      expect(result.current.formData.selectedOptions).toEqual(options)
    })

    it('should calculate total price correctly', () => {
      const { result } = renderHook(() => useBookingStore())
      
      const room = {
        id: '201',
        name: '201号室',
        type: 'shared',
        capacity: 4,
        price: 4800
      }
      
      const options = [
        { id: 'breakfast', name: '朝食', price: 800 },
        { id: 'dinner', name: '夕食', price: 1200 }
      ]
      
      act(() => {
        result.current.updateBasicInfo({
          checkIn: '2025-06-15',
          checkOut: '2025-06-17', // 2 nights
          guestCount: 2
        })
        result.current.selectRoom(room)
        result.current.updateSelectedOptions(options)
        result.current.calculateTotalPrice()
      })
      
      // Expected: (4800 * 2 nights * 2 guests) + (800 + 1200) * 2 nights * 2 guests
      const expectedPrice = (4800 * 2 * 2) + ((800 + 1200) * 2 * 2)
      expect(result.current.formData.totalPrice).toBe(expectedPrice)
    })
  })

  describe('Validation', () => {
    it('should validate required fields', () => {
      const { result } = renderHook(() => useBookingStore())
      
      act(() => {
        const isValid = result.current.validateStep(1)
        expect(isValid).toBe(false)
      })
      
      expect(Object.keys(result.current.errors)).toContain('checkIn')
      expect(Object.keys(result.current.errors)).toContain('checkOut')
    })

    it('should validate date range', () => {
      const { result } = renderHook(() => useBookingStore())
      
      act(() => {
        result.current.updateBasicInfo({
          checkIn: '2025-06-17',
          checkOut: '2025-06-15', // Invalid: checkout before checkin
          guestCount: 1
        })
        const isValid = result.current.validateStep(1)
        expect(isValid).toBe(false)
      })
      
      expect(result.current.errors.checkOut).toContain('チェックアウト')
    })

    it('should clear errors when valid data is provided', () => {
      const { result } = renderHook(() => useBookingStore())
      
      act(() => {
        // First set invalid data
        result.current.updateBasicInfo({
          checkIn: '',
          checkOut: '',
          guestCount: 0
        })
        result.current.validateStep(1)
      })
      
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)
      
      act(() => {
        // Then set valid data
        result.current.updateBasicInfo({
          checkIn: '2025-06-15',
          checkOut: '2025-06-17',
          guestCount: 2
        })
        result.current.validateStep(1)
      })
      
      expect(Object.keys(result.current.errors).length).toBe(0)
    })
  })

  describe('Loading states', () => {
    it('should handle loading state', () => {
      const { result } = renderHook(() => useBookingStore())
      
      act(() => {
        result.current.setLoading(true)
      })
      
      expect(result.current.isLoading).toBe(true)
      
      act(() => {
        result.current.setLoading(false)
      })
      
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Reset functionality', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useBookingStore())
      
      // Modify state
      act(() => {
        result.current.nextStep()
        result.current.updateBasicInfo({
          checkIn: '2025-06-15',
          checkOut: '2025-06-17',
          guestCount: 2
        })
        result.current.setLoading(true)
      })
      
      // Reset
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.step).toBe(1)
      expect(result.current.formData.checkIn).toBe('')
      expect(result.current.isLoading).toBe(false)
      expect(Object.keys(result.current.errors).length).toBe(0)
    })
  })

  describe('Persistence', () => {
    it('should persist form data across rerenders', () => {
      const { result, rerender } = renderHook(() => useBookingStore())
      
      const basicInfo = {
        checkIn: '2025-06-15',
        checkOut: '2025-06-17',
        guestCount: 2
      }
      
      act(() => {
        result.current.updateBasicInfo(basicInfo)
      })
      
      rerender()
      
      expect(result.current.formData.checkIn).toBe('2025-06-15')
      expect(result.current.formData.guestCount).toBe(2)
    })
  })
})