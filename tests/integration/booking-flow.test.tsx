import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookingPage } from '@/app/(dashboard)/booking/new/page'

// Mock the entire booking flow
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        data: [
          { id: '201', name: '201号室', type: 'shared', capacity: 4, price: 4800 },
          { id: '202', name: '202号室', type: 'private', capacity: 2, price: 8500 }
        ],
        error: null
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 1, status: 'confirmed' }],
          error: null
        })
      })
    })
  })
}))

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('Complete Booking Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should complete entire booking flow successfully', async () => {
    const user = userEvent.setup()
    render(<BookingPage />)

    // Step 1: Basic Information
    expect(screen.getByText(/基本情報/)).toBeInTheDocument()

    // Fill out dates and guest count
    const checkInInput = screen.getByLabelText(/チェックイン/)
    const checkOutInput = screen.getByLabelText(/チェックアウト/)
    const guestCountInput = screen.getByLabelText(/人数/)

    await user.type(checkInInput, '2025-06-15')
    await user.type(checkOutInput, '2025-06-17')
    await user.type(guestCountInput, '2')

    // Proceed to next step
    const nextButton = screen.getByText(/次へ/)
    await user.click(nextButton)

    // Step 2: Customer Information
    await waitFor(() => {
      expect(screen.getByText(/お客様情報/)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/代表者名/)
    const emailInput = screen.getByLabelText(/メールアドレス/)
    const phoneInput = screen.getByLabelText(/電話番号/)
    const organizationInput = screen.getByLabelText(/団体名/)

    await user.type(nameInput, '田中太郎')
    await user.type(emailInput, 'tanaka@example.com')
    await user.type(phoneInput, '090-1234-5678')
    await user.type(organizationInput, 'テスト会社')

    await user.click(screen.getByText(/次へ/))

    // Step 3: Room Selection
    await waitFor(() => {
      expect(screen.getByText(/部屋選択/)).toBeInTheDocument()
    })

    // Select a room
    const roomCard = screen.getByText(/201号室/)
    await user.click(roomCard)

    // Verify price calculation
    await waitFor(() => {
      expect(screen.getByText(/料金:/)).toBeInTheDocument()
      expect(screen.getByText(/¥19,200/)).toBeInTheDocument() // 4800 * 2 guests * 2 nights
    })

    await user.click(screen.getByText(/次へ/))

    // Step 4: Options Selection
    await waitFor(() => {
      expect(screen.getByText(/オプション/)).toBeInTheDocument()
    })

    // Select some options
    const breakfastOption = screen.getByLabelText(/朝食/)
    const dinnerOption = screen.getByLabelText(/夕食/)
    
    await user.click(breakfastOption)
    await user.click(dinnerOption)

    // Verify updated price calculation
    await waitFor(() => {
      // Base price + option prices
      expect(screen.getByText(/¥27,200/)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/次へ/))

    // Step 5: Confirmation
    await waitFor(() => {
      expect(screen.getByText(/予約確認/)).toBeInTheDocument()
    })

    // Verify all information is displayed
    expect(screen.getByText(/田中太郎/)).toBeInTheDocument()
    expect(screen.getByText(/tanaka@example.com/)).toBeInTheDocument()
    expect(screen.getByText(/201号室/)).toBeInTheDocument()
    expect(screen.getByText(/2025-06-15/)).toBeInTheDocument()
    expect(screen.getByText(/2025-06-17/)).toBeInTheDocument()
    expect(screen.getByText(/2名/)).toBeInTheDocument()

    // Submit booking
    const submitButton = screen.getByText(/予約を確定する/)
    await user.click(submitButton)

    // Success confirmation
    await waitFor(() => {
      expect(screen.getByText(/予約が完了しました/)).toBeInTheDocument()
    })
  }, 30000) // Extended timeout for integration test

  it('should handle validation errors throughout the flow', async () => {
    const user = userEvent.setup()
    render(<BookingPage />)

    // Try to proceed without filling required fields
    const nextButton = screen.getByText(/次へ/)
    await user.click(nextButton)

    // Should show validation errors
    expect(screen.getByText(/チェックイン日は必須/)).toBeInTheDocument()
    expect(screen.getByText(/チェックアウト日は必須/)).toBeInTheDocument()

    // Fill with invalid dates
    const checkInInput = screen.getByLabelText(/チェックイン/)
    const checkOutInput = screen.getByLabelText(/チェックアウト/)

    await user.type(checkInInput, '2025-06-17')
    await user.type(checkOutInput, '2025-06-15') // Invalid: before check-in

    await user.click(nextButton)

    expect(screen.getByText(/チェックアウトはチェックインより後/)).toBeInTheDocument()
  })

  it('should allow navigation back and forth between steps', async () => {
    const user = userEvent.setup()
    render(<BookingPage />)

    // Complete first step
    const checkInInput = screen.getByLabelText(/チェックイン/)
    const checkOutInput = screen.getByLabelText(/チェックアウト/)
    const guestCountInput = screen.getByLabelText(/人数/)

    await user.type(checkInInput, '2025-06-15')
    await user.type(checkOutInput, '2025-06-17')
    await user.type(guestCountInput, '2')

    await user.click(screen.getByText(/次へ/))

    // Go to next step, then back
    await waitFor(() => {
      expect(screen.getByText(/お客様情報/)).toBeInTheDocument()
    })

    const backButton = screen.getByText(/戻る/)
    await user.click(backButton)

    // Should be back on first step with data preserved
    expect(screen.getByText(/基本情報/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('2025-06-15')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2025-06-17')).toBeInTheDocument()
  })

  it('should handle room unavailability', async () => {
    const user = userEvent.setup()
    
    // Mock room availability check to return conflict
    jest.mocked(require('@/lib/supabase/client').createClient).mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [
            {
              id: 1,
              room_id: '201',
              check_in: '2025-06-15',
              check_out: '2025-06-17',
              status: 'confirmed'
            }
          ],
          error: null
        })
      })
    })

    render(<BookingPage />)

    // Complete steps up to room selection
    const checkInInput = screen.getByLabelText(/チェックイン/)
    await user.type(checkInInput, '2025-06-15')
    // ... complete other fields

    // When trying to select unavailable room
    await waitFor(() => {
      expect(screen.getByText(/この部屋は選択した日程では利用できません/)).toBeInTheDocument()
    })
  })

  it('should preserve form data on page refresh', async () => {
    const user = userEvent.setup()
    render(<BookingPage />)

    // Fill out some data
    const checkInInput = screen.getByLabelText(/チェックイン/)
    await user.type(checkInInput, '2025-06-15')

    // Simulate page refresh by re-rendering
    render(<BookingPage />)

    // Data should be preserved (if store persists)
    expect(screen.getByDisplayValue('2025-06-15')).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock API to return error
    jest.mocked(require('@/lib/supabase/client').createClient).mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    })

    render(<BookingPage />)

    // Complete entire flow
    // ... (complete all steps)

    // Submit booking - should show error
    const submitButton = screen.getByText(/予約を確定する/)
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument()
    })
  })

  it('should calculate prices correctly throughout the flow', async () => {
    const user = userEvent.setup()
    render(<BookingPage />)

    // Set up booking for 2 guests, 2 nights
    const checkInInput = screen.getByLabelText(/チェックイン/)
    const checkOutInput = screen.getByLabelText(/チェックアウト/)
    const guestCountInput = screen.getByLabelText(/人数/)

    await user.type(checkInInput, '2025-06-15')
    await user.type(checkOutInput, '2025-06-17')
    await user.type(guestCountInput, '2')

    // Navigate through steps and verify price updates
    await user.click(screen.getByText(/次へ/))
    await user.click(screen.getByText(/次へ/)) // Skip customer info for this test

    // Select shared room (4800/night)
    await waitFor(() => {
      const roomCard = screen.getByText(/201号室/)
      await user.click(roomCard)
    })

    // Should show base price: 4800 * 2 guests * 2 nights = 19,200
    await waitFor(() => {
      expect(screen.getByText(/¥19,200/)).toBeInTheDocument()
    })

    // Add options
    await user.click(screen.getByText(/次へ/))
    
    await waitFor(() => {
      const breakfastOption = screen.getByLabelText(/朝食/) // 800/person/night
      await user.click(breakfastOption)
    })

    // Should update price: 19,200 + (800 * 2 guests * 2 nights) = 22,400
    await waitFor(() => {
      expect(screen.getByText(/¥22,400/)).toBeInTheDocument()
    })
  })
})