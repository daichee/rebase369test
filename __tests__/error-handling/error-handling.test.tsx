import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookingWizard } from '@/components/booking/booking-wizard'
import { ErrorBoundary } from '@/components/common/error-boundary'

// Mock console.error to prevent noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary')
  }
  return <div>No error</div>
}

// Mock API responses
const mockAPIError = (errorType: string) => {
  switch (errorType) {
    case 'network':
      return Promise.reject(new Error('Network error'))
    case 'validation':
      return Promise.reject(new Error('Validation error: Invalid data'))
    case 'server':
      return Promise.reject(new Error('Internal server error'))
    case 'timeout':
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100)
      })
    default:
      return Promise.resolve({ success: true })
  }
}

describe('Error Handling Tests', () => {
  beforeEach(() => {
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('Form Validation Errors', () => {
    it('should display validation errors for empty required fields', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      // Try to submit without filling required fields
      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      // Should display specific validation errors
      expect(screen.getByText(/チェックイン日は必須です/)).toBeInTheDocument()
      expect(screen.getByText(/チェックアウト日は必須です/)).toBeInTheDocument()
      expect(screen.getByText(/人数を選択してください/)).toBeInTheDocument()
    })

    it('should display validation errors for invalid date range', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      const checkInInput = screen.getByLabelText(/チェックイン/)
      const checkOutInput = screen.getByLabelText(/チェックアウト/)

      // Set invalid date range (checkout before checkin)
      await user.type(checkInInput, '2025-06-17')
      await user.type(checkOutInput, '2025-06-15')

      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      expect(screen.getByText(/チェックアウト日はチェックイン日より後に設定してください/)).toBeInTheDocument()
    })

    it('should display validation errors for invalid guest count', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      const guestCountInput = screen.getByLabelText(/人数/)

      // Set invalid guest count
      await user.clear(guestCountInput)
      await user.type(guestCountInput, '0')

      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      expect(screen.getByText(/人数は1人以上で入力してください/)).toBeInTheDocument()
    })

    it('should display validation errors for invalid email format', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      // Navigate to customer info step
      // ... (complete previous steps)

      const emailInput = screen.getByLabelText(/メールアドレス/)
      await user.type(emailInput, 'invalid-email')

      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      expect(screen.getByText(/正しいメールアドレス形式で入力してください/)).toBeInTheDocument()
    })

    it('should clear validation errors when valid data is entered', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      // First trigger validation error
      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      expect(screen.getByText(/チェックイン日は必須です/)).toBeInTheDocument()

      // Then enter valid data
      const checkInInput = screen.getByLabelText(/チェックイン/)
      await user.type(checkInInput, '2025-06-15')

      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText(/チェックイン日は必須です/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Network Error Handling', () => {
    it('should handle network connection errors', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const user = userEvent.setup()
      render(<BookingWizard />)

      // Complete form and submit
      // ... (complete all steps)

      const submitButton = screen.getByText(/予約を確定する/)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/ネットワークエラーが発生しました。インターネット接続を確認してください。/)).toBeInTheDocument()
      })

      // Should provide retry option
      expect(screen.getByText(/再試行/)).toBeInTheDocument()
    })

    it('should handle server timeout errors', async () => {
      // Mock timeout error
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      const user = userEvent.setup()
      render(<BookingWizard />)

      // Complete and submit form
      const submitButton = screen.getByText(/予約を確定する/)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/リクエストがタイムアウトしました。しばらく待ってから再試行してください。/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should handle API validation errors', async () => {
      // Mock API validation error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'Validation failed',
          details: {
            checkIn: 'Selected date is not available',
            room: 'Room is already booked'
          }
        })
      })

      const user = userEvent.setup()
      render(<BookingWizard />)

      const submitButton = screen.getByText(/予約を確定する/)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/選択した日程は利用できません/)).toBeInTheDocument()
        expect(screen.getByText(/部屋が既に予約されています/)).toBeInTheDocument()
      })
    })

    it('should handle server errors gracefully', async () => {
      // Mock server error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'Internal server error'
        })
      })

      const user = userEvent.setup()
      render(<BookingWizard />)

      const submitButton = screen.getByText(/予約を確定する/)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/サーバーエラーが発生しました。しばらく待ってから再試行してください。/)).toBeInTheDocument()
      })

      // Should not expose technical details to user
      expect(screen.queryByText(/Internal server error/)).not.toBeInTheDocument()
    })
  })

  describe('Data Inconsistency Handling', () => {
    it('should handle missing room data', async () => {
      // Mock missing room data
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          rooms: [] // No rooms available
        })
      })

      render(<BookingWizard />)

      await waitFor(() => {
        expect(screen.getByText(/現在利用可能な部屋がありません/)).toBeInTheDocument()
      })

      // Should provide helpful message
      expect(screen.getByText(/管理者にお問い合わせください/)).toBeInTheDocument()
    })

    it('should handle corrupted price data', async () => {
      // Mock corrupted price data
      const mockCorruptedData = {
        room: { id: '201', name: '201号室' },
        price: null, // Corrupted price
        calculations: undefined
      }

      const user = userEvent.setup()
      render(<BookingWizard />)

      // When price calculation fails
      await waitFor(() => {
        expect(screen.getByText(/料金の計算中にエラーが発生しました/)).toBeInTheDocument()
      })

      // Should provide fallback
      expect(screen.getByText(/手動で料金をお問い合わせください/)).toBeInTheDocument()
    })

    it('should handle conflicting booking data', async () => {
      // Mock booking conflict
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            available: true // Initially shows as available
          })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            error: 'Room is no longer available',
            conflictingBooking: {
              id: 123,
              checkIn: '2025-06-15',
              checkOut: '2025-06-17'
            }
          })
        })

      const user = userEvent.setup()
      render(<BookingWizard />)

      // Select room (appears available)
      const roomCard = screen.getByTestId('room-201')
      await user.click(roomCard)

      // Try to book (conflict detected)
      const submitButton = screen.getByText(/予約を確定する/)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/申し訳ございません。選択した部屋は他のお客様により予約されました/)).toBeInTheDocument()
      })

      // Should suggest alternatives
      expect(screen.getByText(/他の部屋を選択してください/)).toBeInTheDocument()
    })
  })

  describe('Component Error Boundaries', () => {
    it('should catch and display component errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/申し訳ございません。エラーが発生しました/)).toBeInTheDocument()
      expect(screen.getByText(/ページを再読み込み/)).toBeInTheDocument()
    })

    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
      expect(screen.queryByText(/エラーが発生しました/)).not.toBeInTheDocument()
    })

    it('should allow recovery from errors', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument()

      const reloadButton = screen.getByText(/ページを再読み込み/)
      fireEvent.click(reloadButton)

      // Simulate component recovery
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })

  describe('User Input Sanitization', () => {
    it('should handle malicious input safely', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      const nameInput = screen.getByLabelText(/代表者名/)
      
      // Try to input script tag
      await user.type(nameInput, '<script>alert("xss")</script>')

      // Should sanitize or escape the input
      expect(nameInput).toHaveValue('&lt;script&gt;alert("xss")&lt;/script&gt;')
      
      // Or alternatively, should reject the input
      expect(screen.getByText(/使用できない文字が含まれています/)).toBeInTheDocument()
    })

    it('should handle extremely long input', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      const nameInput = screen.getByLabelText(/代表者名/)
      const longText = 'a'.repeat(1000) // Very long input

      await user.type(nameInput, longText)

      // Should limit input length
      expect(nameInput.value.length).toBeLessThanOrEqual(100)
      
      // Or show appropriate error
      expect(screen.getByText(/文字数が上限を超えています/)).toBeInTheDocument()
    })

    it('should handle special characters appropriately', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      const nameInput = screen.getByLabelText(/代表者名/)
      
      // Test various special characters
      await user.type(nameInput, '田中 太郎-Smith (株)')

      // Should accept valid special characters
      expect(nameInput).toHaveValue('田中 太郎-Smith (株)')
    })
  })

  describe('Error Recovery and Retry Logic', () => {
    it('should implement exponential backoff for retries', async () => {
      let attemptCount = 0
      global.fetch = jest.fn().mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      })

      const user = userEvent.setup()
      render(<BookingWizard />)

      const submitButton = screen.getByText(/予約を確定する/)
      await user.click(submitButton)

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByText(/予約が完了しました/)).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(attemptCount).toBe(3) // Should have retried
    })

    it('should limit retry attempts', async () => {
      let attemptCount = 0
      global.fetch = jest.fn().mockImplementation(() => {
        attemptCount++
        return Promise.reject(new Error('Persistent error'))
      })

      const user = userEvent.setup()
      render(<BookingWizard />)

      const submitButton = screen.getByText(/予約を確定する/)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/接続に問題が発生しています/)).toBeInTheDocument()
      }, { timeout: 10000 })

      // Should not retry indefinitely
      expect(attemptCount).toBeLessThanOrEqual(5)
    })
  })

  describe('Offline Handling', () => {
    it('should detect offline status', () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      render(<BookingWizard />)

      expect(screen.getByText(/オフラインです。インターネット接続を確認してください/)).toBeInTheDocument()
    })

    it('should queue actions when offline', async () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const user = userEvent.setup()
      render(<BookingWizard />)

      const submitButton = screen.getByText(/予約を確定する/)
      await user.click(submitButton)

      expect(screen.getByText(/オフライン中です。接続が復旧次第、予約を送信します/)).toBeInTheDocument()

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      // Trigger online event
      window.dispatchEvent(new Event('online'))

      await waitFor(() => {
        expect(screen.getByText(/接続が復旧しました。予約を送信中/)).toBeInTheDocument()
      })
    })
  })
})