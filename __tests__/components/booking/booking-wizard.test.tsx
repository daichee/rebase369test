import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookingWizard } from '@/components/booking/booking-wizard'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        data: [],
        error: null
      }),
      insert: jest.fn().mockReturnValue({
        data: { id: 1 },
        error: null
      })
    })
  })
}))

describe('BookingWizard', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  describe('Wizard navigation', () => {
    it('should render initial step correctly', () => {
      render(<BookingWizard />)
      
      expect(screen.getByText(/基本情報/)).toBeInTheDocument()
      expect(screen.getByText(/日程・人数/)).toBeInTheDocument()
    })

    it('should navigate to next step when form is valid', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      // Fill out basic information
      const checkInInput = screen.getByLabelText(/チェックイン/)
      const checkOutInput = screen.getByLabelText(/チェックアウト/)
      const guestCountInput = screen.getByLabelText(/人数/)

      await user.type(checkInInput, '2025-06-15')
      await user.type(checkOutInput, '2025-06-17')
      await user.type(guestCountInput, '2')

      // Click next button
      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      // Should move to room selection step
      await waitFor(() => {
        expect(screen.getByText(/部屋選択/)).toBeInTheDocument()
      })
    })

    it('should prevent navigation with invalid form data', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      // Try to proceed without filling required fields
      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      // Should stay on the same step and show validation errors
      expect(screen.getByText(/基本情報/)).toBeInTheDocument()
      expect(screen.getByText(/必須項目/)).toBeInTheDocument()
    })

    it('should allow navigation back to previous steps', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      // Complete first step
      const checkInInput = screen.getByLabelText(/チェックイン/)
      await user.type(checkInInput, '2025-06-15')
      
      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      // Go to next step, then back
      await waitFor(() => {
        const backButton = screen.getByText(/戻る/)
        return user.click(backButton)
      })

      // Should be back on first step
      expect(screen.getByText(/基本情報/)).toBeInTheDocument()
    })
  })

  describe('Form validation', () => {
    it('should validate date ranges', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      const checkInInput = screen.getByLabelText(/チェックイン/)
      const checkOutInput = screen.getByLabelText(/チェックアウト/)

      // Set check-out before check-in
      await user.type(checkInInput, '2025-06-17')
      await user.type(checkOutInput, '2025-06-15')

      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      // Should show validation error
      expect(screen.getByText(/チェックアウトはチェックインより後/)).toBeInTheDocument()
    })

    it('should validate guest count', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      const guestCountInput = screen.getByLabelText(/人数/)

      // Set invalid guest count
      await user.type(guestCountInput, '0')

      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      // Should show validation error
      expect(screen.getByText(/1人以上/)).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      // Leave all fields empty and try to proceed
      const nextButton = screen.getByText(/次へ/)
      await user.click(nextButton)

      // Should show multiple validation errors
      expect(screen.getByText(/チェックイン日は必須/)).toBeInTheDocument()
      expect(screen.getByText(/チェックアウト日は必須/)).toBeInTheDocument()
      expect(screen.getByText(/人数は必須/)).toBeInTheDocument()
    })
  })

  describe('Room selection', () => {
    it('should display available rooms', async () => {
      // Mock room data
      const mockRooms = [
        { id: '201', name: '201号室', type: 'shared', capacity: 4 },
        { id: '202', name: '202号室', type: 'private', capacity: 2 }
      ]

      // This would require proper mocking of the room data fetch
      render(<BookingWizard />)
      
      // Navigate to room selection step
      // ... (complete first step navigation)
      
      // Verify rooms are displayed
      await waitFor(() => {
        mockRooms.forEach(room => {
          expect(screen.getByText(room.name)).toBeInTheDocument()
        })
      })
    })

    it('should calculate price when room is selected', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      // Complete navigation to room selection
      // ... (navigation steps)

      // Select a room
      const roomCard = screen.getByTestId('room-201')
      await user.click(roomCard)

      // Should display calculated price
      await waitFor(() => {
        expect(screen.getByText(/料金:/)).toBeInTheDocument()
        expect(screen.getByText(/¥/)).toBeInTheDocument()
      })
    })
  })

  describe('Booking submission', () => {
    it('should submit booking with all required data', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      // Complete all steps
      // ... (complete all form steps)

      // Submit booking
      const submitButton = screen.getByText(/予約を確定/)
      await user.click(submitButton)

      // Should show success message or redirect
      await waitFor(() => {
        expect(screen.getByText(/予約が完了/)).toBeInTheDocument()
      })
    })

    it('should handle submission errors gracefully', async () => {
      // Mock API error
      jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const user = userEvent.setup()
      render(<BookingWizard />)

      // Complete all steps and submit
      // ... (complete form)

      const submitButton = screen.getByText(/予約を確定/)
      await user.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/エラーが発生/)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<BookingWizard />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByLabelText(/チェックイン/)).toBeInTheDocument()
      expect(screen.getByLabelText(/チェックアウト/)).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<BookingWizard />)

      // Test tab navigation
      await user.tab()
      expect(screen.getByLabelText(/チェックイン/)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/チェックアウト/)).toHaveFocus()
    })
  })

  describe('Responsive behavior', () => {
    it('should render appropriately on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<BookingWizard />)

      // Verify mobile-specific classes are applied
      const wizard = screen.getByTestId('booking-wizard')
      expect(wizard).toHaveClass('mobile-layout')
    })

    it('should render appropriately on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      render(<BookingWizard />)

      // Verify desktop-specific classes are applied
      const wizard = screen.getByTestId('booking-wizard')
      expect(wizard).toHaveClass('desktop-layout')
    })
  })
})