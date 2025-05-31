import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookingCalendar } from '@/components/calendar/booking-calendar'

// Mock date functions
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  isToday: jest.fn((date) => {
    const today = new Date('2025-06-15')
    return date.toDateString() === today.toDateString()
  }),
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2025-06-15'
    if (formatStr === 'MMMM yyyy') return 'June 2025'
    return date.toString()
  })
}))

// Mock booking data
const mockBookings = [
  {
    id: 1,
    room_id: '201',
    check_in: '2025-06-15',
    check_out: '2025-06-17',
    customer_name: '田中太郎',
    status: 'confirmed'
  },
  {
    id: 2,
    room_id: '202',
    check_in: '2025-06-20',
    check_out: '2025-06-22',
    customer_name: '佐藤花子',
    status: 'confirmed'
  },
  {
    id: 3,
    room_id: '203',
    check_in: '2025-06-18',
    check_out: '2025-06-19',
    customer_name: '鈴木次郎',
    status: 'pending'
  }
]

const mockRooms = [
  { id: '201', name: '201号室', type: 'shared', floor: 2 },
  { id: '202', name: '202号室', type: 'private', floor: 2 },
  { id: '203', name: '203号室', type: 'shared', floor: 2 },
  { id: '301', name: '301号室', type: 'private', floor: 3 },
  { id: '302', name: '302号室', type: 'shared', floor: 3 }
]

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          lte: jest.fn().mockResolvedValue({
            data: mockBookings,
            error: null
          })
        })
      })
    })
  })
}))

describe('BookingCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Calendar Rendering', () => {
    it('should render calendar with correct month and year', () => {
      render(<BookingCalendar />)
      
      expect(screen.getByText('June 2025')).toBeInTheDocument()
      expect(screen.getByText('日')).toBeInTheDocument() // Sunday header
      expect(screen.getByText('月')).toBeInTheDocument() // Monday header
    })

    it('should display all rooms in the room list', () => {
      render(<BookingCalendar rooms={mockRooms} />)
      
      mockRooms.forEach(room => {
        expect(screen.getByText(room.name)).toBeInTheDocument()
      })
    })

    it('should organize rooms by floor', () => {
      render(<BookingCalendar rooms={mockRooms} />)
      
      expect(screen.getByText('2F')).toBeInTheDocument()
      expect(screen.getByText('3F')).toBeInTheDocument()
      
      // Check that rooms are grouped correctly
      const floor2Section = screen.getByTestId('floor-2')
      const floor3Section = screen.getByTestId('floor-3')
      
      expect(floor2Section).toContainElement(screen.getByText('201号室'))
      expect(floor2Section).toContainElement(screen.getByText('202号室'))
      expect(floor3Section).toContainElement(screen.getByText('301号室'))
    })

    it('should render calendar grid correctly', () => {
      render(<BookingCalendar />)
      
      const calendarGrid = screen.getByTestId('calendar-grid')
      expect(calendarGrid).toBeInTheDocument()
      
      // Should have days of week headers
      const dayHeaders = screen.getAllByTestId(/day-header/)
      expect(dayHeaders).toHaveLength(7)
    })
  })

  describe('Booking Display', () => {
    it('should display bookings on correct dates', async () => {
      render(<BookingCalendar bookings={mockBookings} rooms={mockRooms} />)
      
      await waitFor(() => {
        // Check for booking blocks
        expect(screen.getByTestId('booking-1')).toBeInTheDocument()
        expect(screen.getByTestId('booking-2')).toBeInTheDocument()
      })
      
      // Bookings should appear on their respective dates
      const june15Cell = screen.getByTestId('date-2025-06-15')
      const june20Cell = screen.getByTestId('date-2025-06-20')
      
      expect(june15Cell).toContainElement(screen.getByTestId('booking-1'))
      expect(june20Cell).toContainElement(screen.getByTestId('booking-2'))
    })

    it('should show booking details in blocks', () => {
      render(<BookingCalendar bookings={mockBookings} rooms={mockRooms} />)
      
      // Should display customer names
      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.getByText('佐藤花子')).toBeInTheDocument()
      
      // Should show booking duration
      const booking1 = screen.getByTestId('booking-1')
      expect(booking1).toHaveAttribute('data-duration', '2') // 2 nights
    })

    it('should differentiate booking statuses visually', () => {
      render(<BookingCalendar bookings={mockBookings} rooms={mockRooms} />)
      
      const confirmedBooking = screen.getByTestId('booking-1') // status: confirmed
      const pendingBooking = screen.getByTestId('booking-3') // status: pending
      
      expect(confirmedBooking).toHaveClass('booking-confirmed')
      expect(pendingBooking).toHaveClass('booking-pending')
    })

    it('should handle overlapping bookings', () => {
      const overlappingBookings = [
        ...mockBookings,
        {
          id: 4,
          room_id: '201', // Same room as booking 1
          check_in: '2025-06-16',
          check_out: '2025-06-18',
          customer_name: '重複予約',
          status: 'conflict'
        }
      ]
      
      render(<BookingCalendar bookings={overlappingBookings} rooms={mockRooms} />)
      
      const conflictBooking = screen.getByTestId('booking-4')
      expect(conflictBooking).toHaveClass('booking-conflict')
      
      // Should show conflict indicator
      expect(screen.getByTestId('conflict-indicator')).toBeInTheDocument()
    })
  })

  describe('Calendar Navigation', () => {
    it('should navigate to previous month', async () => {
      const user = userEvent.setup()
      render(<BookingCalendar />)
      
      const prevButton = screen.getByTestId('prev-month')
      await user.click(prevButton)
      
      // Should show previous month (mocked to show May 2025)
      await waitFor(() => {
        expect(screen.getByText('May 2025')).toBeInTheDocument()
      })
    })

    it('should navigate to next month', async () => {
      const user = userEvent.setup()
      render(<BookingCalendar />)
      
      const nextButton = screen.getByTestId('next-month')
      await user.click(nextButton)
      
      // Should show next month (mocked to show July 2025)
      await waitFor(() => {
        expect(screen.getByText('July 2025')).toBeInTheDocument()
      })
    })

    it('should jump to specific month/year', async () => {
      const user = userEvent.setup()
      render(<BookingCalendar />)
      
      const monthSelect = screen.getByTestId('month-select')
      const yearSelect = screen.getByTestId('year-select')
      
      await user.selectOptions(monthSelect, '12') // December
      await user.selectOptions(yearSelect, '2025')
      
      await waitFor(() => {
        expect(screen.getByText('December 2025')).toBeInTheDocument()
      })
    })

    it('should return to today when "Today" button is clicked', async () => {
      const user = userEvent.setup()
      render(<BookingCalendar />)
      
      // Navigate away from current month
      const nextButton = screen.getByTestId('next-month')
      await user.click(nextButton)
      
      // Click Today button
      const todayButton = screen.getByText('今日')
      await user.click(todayButton)
      
      // Should return to current month
      await waitFor(() => {
        expect(screen.getByText('June 2025')).toBeInTheDocument()
      })
      
      // Today should be highlighted
      const todayCell = screen.getByTestId('date-2025-06-15')
      expect(todayCell).toHaveClass('today')
    })
  })

  describe('Interactive Features', () => {
    it('should highlight date on hover', async () => {
      const user = userEvent.setup()
      render(<BookingCalendar />)
      
      const dateCell = screen.getByTestId('date-2025-06-18')
      await user.hover(dateCell)
      
      expect(dateCell).toHaveClass('hover:bg-gray-100')
    })

    it('should allow date selection for new booking', async () => {
      const user = userEvent.setup()
      const onDateSelect = jest.fn()
      
      render(<BookingCalendar onDateSelect={onDateSelect} />)
      
      const dateCell = screen.getByTestId('date-2025-06-18')
      await user.click(dateCell)
      
      expect(onDateSelect).toHaveBeenCalledWith('2025-06-18')
    })

    it('should show booking details on click', async () => {
      const user = userEvent.setup()
      render(<BookingCalendar bookings={mockBookings} rooms={mockRooms} />)
      
      const bookingBlock = screen.getByTestId('booking-1')
      await user.click(bookingBlock)
      
      // Should open booking details modal/popover
      await waitFor(() => {
        expect(screen.getByTestId('booking-details-modal')).toBeInTheDocument()
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
        expect(screen.getByText('201号室')).toBeInTheDocument()
        expect(screen.getByText('2025-06-15 〜 2025-06-17')).toBeInTheDocument()
      })
    })

    it('should allow room filtering', async () => {
      const user = userEvent.setup()
      render(<BookingCalendar bookings={mockBookings} rooms={mockRooms} />)
      
      // Filter by room type
      const filterSelect = screen.getByTestId('room-type-filter')
      await user.selectOptions(filterSelect, 'private')
      
      // Should only show private rooms
      expect(screen.getByText('202号室')).toBeInTheDocument()
      expect(screen.getByText('301号室')).toBeInTheDocument()
      expect(screen.queryByText('201号室')).not.toBeInTheDocument()
    })

    it('should allow floor filtering', async () => {
      const user = userEvent.setup()
      render(<BookingCalendar bookings={mockBookings} rooms={mockRooms} />)
      
      // Filter by floor
      const floorFilter = screen.getByTestId('floor-filter')
      await user.selectOptions(floorFilter, '2')
      
      // Should only show 2F rooms
      expect(screen.getByText('201号室')).toBeInTheDocument()
      expect(screen.getByText('202号室')).toBeInTheDocument()
      expect(screen.queryByText('301号室')).not.toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should adapt layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<BookingCalendar />)
      
      const calendar = screen.getByTestId('booking-calendar')
      expect(calendar).toHaveClass('mobile-layout')
      
      // Should show compact month view
      expect(screen.getByTestId('compact-month-view')).toBeInTheDocument()
    })

    it('should show full layout on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      })
      
      render(<BookingCalendar />)
      
      const calendar = screen.getByTestId('booking-calendar')
      expect(calendar).toHaveClass('desktop-layout')
      
      // Should show full calendar grid
      expect(screen.getByTestId('full-calendar-grid')).toBeInTheDocument()
    })

    it('should handle touch gestures on mobile', async () => {
      // Mock mobile environment
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<BookingCalendar />)
      
      const calendar = screen.getByTestId('booking-calendar')
      
      // Simulate swipe left (next month)
      fireEvent.touchStart(calendar, {
        touches: [{ clientX: 200, clientY: 200 }]
      })
      fireEvent.touchEnd(calendar, {
        changedTouches: [{ clientX: 100, clientY: 200 }]
      })
      
      // Should navigate to next month
      await waitFor(() => {
        expect(screen.getByText('July 2025')).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should render large datasets efficiently', () => {
      // Create large dataset
      const largeBookingSet = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        room_id: `room-${(i % 13) + 1}`,
        check_in: `2025-06-${(i % 28) + 1}`,
        check_out: `2025-06-${(i % 28) + 2}`,
        customer_name: `Customer ${i + 1}`,
        status: i % 3 === 0 ? 'confirmed' : 'pending'
      }))
      
      const startTime = performance.now()
      render(<BookingCalendar bookings={largeBookingSet} rooms={mockRooms} />)
      const endTime = performance.now()
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should implement virtualization for large room lists', () => {
      // Create large room dataset
      const largeRoomSet = Array.from({ length: 100 }, (_, i) => ({
        id: `room-${i + 1}`,
        name: `Room ${i + 1}`,
        type: i % 2 === 0 ? 'shared' : 'private',
        floor: Math.floor(i / 20) + 1
      }))
      
      render(<BookingCalendar rooms={largeRoomSet} />)
      
      // Should only render visible rooms
      const visibleRooms = screen.getAllByTestId(/room-card/)
      expect(visibleRooms.length).toBeLessThanOrEqual(20) // Virtual window
    })
  })

  describe('Accessibility', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<BookingCalendar />)
      
      // Should be able to navigate with arrow keys
      const firstDateCell = screen.getByTestId('date-2025-06-01')
      firstDateCell.focus()
      
      await user.keyboard('{ArrowRight}')
      expect(screen.getByTestId('date-2025-06-02')).toHaveFocus()
      
      await user.keyboard('{ArrowDown}')
      expect(screen.getByTestId('date-2025-06-09')).toHaveFocus() // Next week
    })

    it('should provide proper ARIA labels', () => {
      render(<BookingCalendar bookings={mockBookings} rooms={mockRooms} />)
      
      // Calendar should have proper labels
      expect(screen.getByRole('grid')).toHaveAttribute('aria-label', 'Calendar')
      
      // Booking blocks should have descriptive labels
      const booking = screen.getByTestId('booking-1')
      expect(booking).toHaveAttribute('aria-label', '田中太郎の予約 201号室 2025-06-15から2025-06-17まで')
    })

    it('should announce calendar changes to screen readers', async () => {
      const user = userEvent.setup()
      render(<BookingCalendar />)
      
      const nextButton = screen.getByTestId('next-month')
      await user.click(nextButton)
      
      // Should have aria-live region for announcements
      const liveRegion = screen.getByTestId('calendar-announcements')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      expect(liveRegion).toHaveTextContent('July 2025に移動しました')
    })
  })
})