import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/booking/route'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 1, status: 'confirmed' }],
          error: null
        })
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 1, room_id: '201', status: 'confirmed' },
            error: null
          })
        })
      })
    })
  })
}))

describe('/api/booking', () => {
  describe('POST /api/booking', () => {
    it('should create a new booking successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          checkIn: '2025-06-15',
          checkOut: '2025-06-17',
          guestCount: 2,
          roomId: '201',
          customerInfo: {
            name: '田中太郎',
            email: 'tanaka@example.com',
            phone: '090-1234-5678'
          },
          totalPrice: 9600
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.booking).toHaveProperty('id')
      expect(data.booking.status).toBe('confirmed')
    })

    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required fields
          guestCount: 2
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('必須項目')
    })

    it('should validate date format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          checkIn: 'invalid-date',
          checkOut: '2025-06-17',
          guestCount: 2,
          roomId: '201',
          customerInfo: {
            name: '田中太郎',
            email: 'tanaka@example.com'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('日付形式')
    })

    it('should validate date range', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          checkIn: '2025-06-17',
          checkOut: '2025-06-15', // Invalid: checkout before checkin
          guestCount: 2,
          roomId: '201',
          customerInfo: {
            name: '田中太郎',
            email: 'tanaka@example.com'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('チェックアウト')
    })

    it('should validate guest count', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          checkIn: '2025-06-15',
          checkOut: '2025-06-17',
          guestCount: 0, // Invalid
          roomId: '201',
          customerInfo: {
            name: '田中太郎',
            email: 'tanaka@example.com'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('人数')
    })

    it('should validate email format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          checkIn: '2025-06-15',
          checkOut: '2025-06-17',
          guestCount: 2,
          roomId: '201',
          customerInfo: {
            name: '田中太郎',
            email: 'invalid-email' // Invalid email
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('メールアドレス')
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection error' }
            })
          })
        })
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          checkIn: '2025-06-15',
          checkOut: '2025-06-17',
          guestCount: 2,
          roomId: '201',
          customerInfo: {
            name: '田中太郎',
            email: 'tanaka@example.com'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('エラー')
    })
  })

  describe('GET /api/booking', () => {
    it('should return bookings list', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(Array.isArray(data.bookings)).toBe(true)
    })

    it('should filter bookings by date range', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          startDate: '2025-06-01',
          endDate: '2025-06-30'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(Array.isArray(data.bookings)).toBe(true)
    })

    it('should filter bookings by room', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          roomId: '201'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(Array.isArray(data.bookings)).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle unsupported HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'DELETE'
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('Method not allowed')
    })

    it('should handle malformed JSON', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: 'invalid json'
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('JSON')
    })

    it('should handle missing request body', async () => {
      const { req, res } = createMocks({
        method: 'POST'
        // No body
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('リクエスト')
    })
  })

  describe('Security', () => {
    it('should sanitize input data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          checkIn: '2025-06-15',
          checkOut: '2025-06-17',
          guestCount: 2,
          roomId: '201',
          customerInfo: {
            name: '<script>alert("xss")</script>',
            email: 'tanaka@example.com'
          }
        }
      })

      await handler(req, res)

      // Should sanitize or reject malicious input
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(400)
    })

    it('should validate room exists', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          checkIn: '2025-06-15',
          checkOut: '2025-06-17',
          guestCount: 2,
          roomId: 'non-existent-room',
          customerInfo: {
            name: '田中太郎',
            email: 'tanaka@example.com'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('部屋')
    })
  })
})