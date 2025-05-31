import { render, screen } from '@testing-library/react'
import { BookingWizard } from '@/components/booking/booking-wizard'
import { RoomStatusGrid } from '@/components/dashboard/room-status-grid'
import { BookingCalendar } from '@/components/calendar/booking-calendar'

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => {
      const matches = {
        '(max-width: 640px)': width <= 640,   // sm
        '(max-width: 768px)': width <= 768,   // md
        '(max-width: 1024px)': width <= 1024, // lg
        '(max-width: 1280px)': width <= 1280, // xl
        '(min-width: 641px)': width >= 641,
        '(min-width: 769px)': width >= 769,
        '(min-width: 1025px)': width >= 1025,
      }
      
      return {
        matches: matches[query] || false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }
    }),
  })
}

describe('Responsive Design Tests', () => {
  describe('Mobile Layout (320px - 640px)', () => {
    beforeEach(() => {
      mockMatchMedia(375) // iPhone SE width
    })

    it('should render booking wizard appropriately for mobile', () => {
      render(<BookingWizard />)
      
      const wizard = screen.getByTestId('booking-wizard')
      
      // Should have mobile classes
      expect(wizard).toHaveClass('mobile-layout')
      expect(wizard).toHaveClass('px-4') // Mobile padding
      
      // Forms should stack vertically
      const formGrid = screen.getByTestId('form-grid')
      expect(formGrid).toHaveClass('grid-cols-1')
      expect(formGrid).not.toHaveClass('grid-cols-2')
    })

    it('should display room grid in single column on mobile', () => {
      const mockRooms = [
        { id: '201', name: '201号室', type: 'shared' },
        { id: '202', name: '202号室', type: 'private' }
      ]
      
      render(<RoomStatusGrid rooms={mockRooms} />)
      
      const roomGrid = screen.getByTestId('room-grid')
      expect(roomGrid).toHaveClass('grid-cols-1')
      expect(roomGrid).toHaveClass('gap-4')
    })

    it('should adapt calendar for mobile viewing', () => {
      render(<BookingCalendar />)
      
      const calendar = screen.getByTestId('booking-calendar')
      
      // Should use mobile calendar layout
      expect(calendar).toHaveClass('mobile-calendar')
      
      // Navigation should be touch-friendly
      const navButtons = screen.getAllByRole('button')
      navButtons.forEach(button => {
        expect(button).toHaveClass('min-h-11') // Touch target size
      })
    })

    it('should have appropriate text sizes for mobile', () => {
      render(<BookingWizard />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-xl') // Mobile heading size
      
      const labels = screen.getAllByText(/チェックイン|チェックアウト|人数/)
      labels.forEach(label => {
        expect(label).toHaveClass('text-sm') // Mobile label size
      })
    })

    it('should hide non-essential elements on small screens', () => {
      render(<BookingWizard />)
      
      // Desktop-only elements should be hidden
      const desktopSidebar = screen.queryByTestId('desktop-sidebar')
      expect(desktopSidebar).toHaveClass('hidden', 'sm:block')
      
      // Mobile navigation should be visible
      const mobileNav = screen.getByTestId('mobile-navigation')
      expect(mobileNav).toHaveClass('block', 'sm:hidden')
    })
  })

  describe('Tablet Layout (641px - 1024px)', () => {
    beforeEach(() => {
      mockMatchMedia(768) // iPad width
    })

    it('should render booking wizard with tablet layout', () => {
      render(<BookingWizard />)
      
      const wizard = screen.getByTestId('booking-wizard')
      expect(wizard).toHaveClass('tablet-layout')
      
      // Should use 2-column grid for forms
      const formGrid = screen.getByTestId('form-grid')
      expect(formGrid).toHaveClass('md:grid-cols-2')
    })

    it('should display rooms in 2-column grid on tablet', () => {
      const mockRooms = Array.from({ length: 6 }, (_, i) => ({
        id: `20${i + 1}`,
        name: `20${i + 1}号室`,
        type: i % 2 === 0 ? 'shared' : 'private'
      }))
      
      render(<RoomStatusGrid rooms={mockRooms} />)
      
      const roomGrid = screen.getByTestId('room-grid')
      expect(roomGrid).toHaveClass('md:grid-cols-2')
    })

    it('should show partial sidebar on tablet', () => {
      render(<BookingWizard />)
      
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('md:block')
      expect(sidebar).toHaveClass('md:w-64') // Tablet sidebar width
    })
  })

  describe('Desktop Layout (1025px+)', () => {
    beforeEach(() => {
      mockMatchMedia(1440) // Desktop width
    })

    it('should render booking wizard with full desktop layout', () => {
      render(<BookingWizard />)
      
      const wizard = screen.getByTestId('booking-wizard')
      expect(wizard).toHaveClass('desktop-layout')
      
      // Should use 3-column grid for forms where appropriate
      const formGrid = screen.getByTestId('form-grid')
      expect(formGrid).toHaveClass('lg:grid-cols-3')
    })

    it('should display rooms in 3-column grid on desktop', () => {
      const mockRooms = Array.from({ length: 12 }, (_, i) => ({
        id: `20${i + 1}`,
        name: `20${i + 1}号室`,
        type: i % 2 === 0 ? 'shared' : 'private'
      }))
      
      render(<RoomStatusGrid rooms={mockRooms} />)
      
      const roomGrid = screen.getByTestId('room-grid')
      expect(roomGrid).toHaveClass('lg:grid-cols-3')
    })

    it('should show full sidebar on desktop', () => {
      render(<BookingWizard />)
      
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('lg:block')
      expect(sidebar).toHaveClass('lg:w-80') // Desktop sidebar width
    })

    it('should use larger text sizes on desktop', () => {
      render(<BookingWizard />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('lg:text-3xl') // Desktop heading size
    })
  })

  describe('Calendar Responsive Behavior', () => {
    it('should adapt calendar layout for different screen sizes', () => {
      // Test mobile
      mockMatchMedia(375)
      const { rerender } = render(<BookingCalendar />)
      
      let calendar = screen.getByTestId('booking-calendar')
      expect(calendar).toHaveClass('mobile-calendar')
      
      // Test tablet
      mockMatchMedia(768)
      rerender(<BookingCalendar />)
      
      calendar = screen.getByTestId('booking-calendar')
      expect(calendar).toHaveClass('tablet-calendar')
      
      // Test desktop
      mockMatchMedia(1440)
      rerender(<BookingCalendar />)
      
      calendar = screen.getByTestId('booking-calendar')
      expect(calendar).toHaveClass('desktop-calendar')
    })

    it('should show appropriate number of rooms per row', () => {
      const mockRooms = Array.from({ length: 13 }, (_, i) => ({
        id: `room-${i + 1}`,
        name: `Room ${i + 1}`
      }))
      
      // Mobile: 1 room per row
      mockMatchMedia(375)
      const { rerender } = render(<BookingCalendar rooms={mockRooms} />)
      
      let roomsContainer = screen.getByTestId('calendar-rooms')
      expect(roomsContainer).toHaveClass('grid-cols-1')
      
      // Tablet: 2 rooms per row
      mockMatchMedia(768)
      rerender(<BookingCalendar rooms={mockRooms} />)
      
      roomsContainer = screen.getByTestId('calendar-rooms')
      expect(roomsContainer).toHaveClass('md:grid-cols-2')
      
      // Desktop: All rooms visible
      mockMatchMedia(1440)
      rerender(<BookingCalendar rooms={mockRooms} />)
      
      roomsContainer = screen.getByTestId('calendar-rooms')
      expect(roomsContainer).toHaveClass('lg:grid-cols-13')
    })
  })

  describe('Touch and Interaction', () => {
    beforeEach(() => {
      mockMatchMedia(375) // Mobile
    })

    it('should have touch-friendly button sizes', () => {
      render(<BookingWizard />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // Minimum touch target size (44px)
        expect(button).toHaveClass('min-h-11')
        expect(button).toHaveClass('min-w-11')
      })
    })

    it('should have appropriate spacing for touch targets', () => {
      render(<BookingWizard />)
      
      const stepButtons = screen.getAllByTestId(/step-button/)
      const container = stepButtons[0].parentElement
      
      expect(container).toHaveClass('gap-4') // Adequate spacing between touch targets
    })

    it('should support swipe gestures on mobile calendar', () => {
      render(<BookingCalendar />)
      
      const calendar = screen.getByTestId('booking-calendar')
      expect(calendar).toHaveAttribute('data-swipeable', 'true')
    })
  })

  describe('Accessibility on Different Screen Sizes', () => {
    it('should maintain accessibility across breakpoints', () => {
      const screenSizes = [375, 768, 1440]
      
      screenSizes.forEach(width => {
        mockMatchMedia(width)
        const { rerender } = render(<BookingWizard />)
        
        // All form elements should have labels
        const inputs = screen.getAllByRole('textbox')
        inputs.forEach(input => {
          expect(input).toHaveAttribute('aria-label')
        })
        
        // Navigation should be accessible
        const nav = screen.getByRole('navigation')
        expect(nav).toBeInTheDocument()
        
        // Headings should maintain hierarchy
        const headings = screen.getAllByRole('heading')
        expect(headings.length).toBeGreaterThan(0)
        
        rerender(<BookingWizard />)
      })
    })

    it('should provide appropriate focus management on mobile', () => {
      mockMatchMedia(375)
      render(<BookingWizard />)
      
      // Focus should be clearly visible
      const firstInput = screen.getAllByRole('textbox')[0]
      firstInput.focus()
      
      expect(firstInput).toHaveClass('focus:ring-2')
      expect(firstInput).toHaveClass('focus:ring-offset-2')
    })
  })

  describe('Performance on Different Devices', () => {
    it('should load minimal resources on mobile', () => {
      mockMatchMedia(375)
      render(<BookingWizard />)
      
      // Check that mobile-specific optimizations are applied
      const lazyImages = screen.queryAllByTestId('lazy-image')
      expect(lazyImages.length).toBeGreaterThan(0)
      
      // Desktop-only components should not be rendered
      const desktopCharts = screen.queryByTestId('desktop-analytics-chart')
      expect(desktopCharts).not.toBeInTheDocument()
    })

    it('should optimize layout for tablet performance', () => {
      mockMatchMedia(768)
      render(<RoomStatusGrid />)
      
      // Should use efficient grid layout
      const roomGrid = screen.getByTestId('room-grid')
      expect(roomGrid).toHaveClass('md:grid-cols-2')
      
      // Should not render too many items at once
      const visibleRooms = screen.getAllByTestId(/room-card/)
      expect(visibleRooms.length).toBeLessThanOrEqual(12) // Reasonable limit
    })
  })
})