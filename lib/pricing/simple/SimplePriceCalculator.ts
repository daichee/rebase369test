/**
 * Simple Fixed Rate Price Calculator
 * 
 * Based on the official pricing table image, this calculator implements
 * a simplified fixed-rate pricing system to replace the complex 340-line
 * multiplier-based calculations.
 */

import { addDays, format, parseISO } from 'date-fns';
import { GuestCount, PriceBreakdown, DailyPrice, AddonItem } from '../types';

// Fixed rate table based on pricing image
const FIXED_RATE_TABLE = {
  // Shared rooms (大部屋・中部屋) - ドミトリー
  shared: {
    adult: { 
      weekday: 4800, 
      weekend: 5856, 
      peak_weekday: 5520, 
      peak_weekend: 6734 
    },
    student: { 
      weekday: 4000, 
      weekend: 4880, 
      peak_weekday: 4600, 
      peak_weekend: 5612 
    },
    child: { 
      weekday: 3200, 
      weekend: 3904, 
      peak_weekday: 3680, 
      peak_weekend: 4490 
    },
    infant: { 
      weekday: 1600, 
      weekend: 1952, 
      peak_weekday: 1840, 
      peak_weekend: 2245 
    },
    baby: { 
      weekday: 0, 
      weekend: 0, 
      peak_weekday: 0, 
      peak_weekend: 0 
    }
  },
  // Private rooms (個室)
  private: {
    adult: { 
      weekday: 8500, 
      weekend: 10370, 
      peak_weekday: 9775, 
      peak_weekend: 11926 
    },
    student: { 
      weekday: 7083, 
      weekend: 8641, 
      peak_weekday: 8146, 
      peak_weekend: 9938 
    },
    child: { 
      weekday: 5667, 
      weekend: 6913, 
      peak_weekday: 6518, 
      peak_weekend: 7951 
    },
    infant: { 
      weekday: 2833, 
      weekend: 3457, 
      peak_weekday: 3259, 
      peak_weekend: 3975 
    },
    baby: { 
      weekday: 0, 
      weekend: 0, 
      peak_weekday: 0, 
      peak_weekend: 0 
    }
  }
};

// Room base rates (per night)
const ROOM_RATES = {
  large: 20000,      // 大部屋（作法室・被服室）
  medium_a: 13000,   // 中部屋（視聴覚室）
  medium_b: 8000,    // 中部屋（図書室）
  small_a: 7000,     // 個室（1年1組・1年2組）
  small_b: 6000,     // 個室（理科室）
  small_c: 5000      // 個室（2年組・3年組）
};

// Fixed addon pricing
const ADDON_RATES = {
  meals: {
    breakfast: 600,
    lunch: 1000,
    dinner: 1500,
    bbq: 2000
  },
  facilities: {
    projector: 2000,
    sound_system: 3000,
    flipchart: 500
  },
  equipment: {
    bedding: 500,
    towel: 200,
    pillow: 300
  }
};

type DayType = 'weekday' | 'weekend';
type SeasonType = 'off_season' | 'on_season';
type RoomUsageType = 'shared' | 'private';

export class SimplePriceCalculator {
  
  /**
   * Calculate total price for a booking
   */
  static calculatePrice(
    checkIn: string,
    checkOut: string,
    guestCount: GuestCount,
    roomIds: string[],
    addons: AddonItem[] = []
  ): PriceBreakdown {
    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine room usage type (simplified)
    const roomUsage: RoomUsageType = this.determineRoomUsage(roomIds);
    
    // Calculate daily prices
    const dailyPrices: DailyPrice[] = [];
    let totalGuestFee = 0;
    let totalRoomFee = 0;
    
    for (let i = 0; i < nights; i++) {
      const currentDate = addDays(checkInDate, i);
      const dayType = this.getDayType(currentDate);
      const seasonType = this.getSeasonType(currentDate);
      
      const dailyGuestFee = this.calculateDailyGuestFee(guestCount, roomUsage, dayType, seasonType);
      const dailyRoomFee = this.calculateDailyRoomFee(roomIds);
      
      dailyPrices.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        guestFee: dailyGuestFee,
        roomFee: dailyRoomFee,
        total: dailyGuestFee + dailyRoomFee
      });
      
      totalGuestFee += dailyGuestFee;
      totalRoomFee += dailyRoomFee;
    }
    
    // Calculate addon fees
    const addonFee = this.calculateAddonFee(addons, nights);
    const totalBeforeTax = totalGuestFee + totalRoomFee + addonFee;
    const tax = Math.floor(totalBeforeTax * 0.1);
    
    return {
      guestFee: totalGuestFee,
      roomFee: totalRoomFee,
      addonFee,
      subtotal: totalBeforeTax,
      tax,
      total: totalBeforeTax + tax,
      dailyPrices
    };
  }
  
  /**
   * Calculate guest fee for one day
   */
  private static calculateDailyGuestFee(
    guestCount: GuestCount,
    roomUsage: RoomUsageType,
    dayType: DayType,
    seasonType: SeasonType
  ): number {
    const rateKey = seasonType === 'on_season' 
      ? (dayType === 'weekend' ? 'peak_weekend' : 'peak_weekday')
      : (dayType === 'weekend' ? 'weekend' : 'weekday');
    
    const rates = FIXED_RATE_TABLE[roomUsage];
    
    return (
      (guestCount.adult || 0) * rates.adult[rateKey] +
      (guestCount.student || 0) * rates.student[rateKey] +
      (guestCount.child || 0) * rates.child[rateKey] +
      (guestCount.infant || 0) * rates.infant[rateKey] +
      (guestCount.baby || 0) * rates.baby[rateKey]
    );
  }
  
  /**
   * Calculate room fee for one day
   */
  private static calculateDailyRoomFee(roomIds: string[]): number {
    return roomIds.reduce((total, roomId) => {
      const roomType = this.getRoomType(roomId);
      return total + (ROOM_RATES[roomType] || 0);
    }, 0);
  }
  
  /**
   * Calculate addon fees for entire stay
   */
  private static calculateAddonFee(addons: AddonItem[], nights: number): number {
    return addons.reduce((total, addon) => {
      const rate = this.getAddonRate(addon.type, addon.name);
      const quantity = addon.quantity || 1;
      
      // Daily addons are multiplied by nights, one-time addons are not
      const isDaily = ['breakfast', 'lunch', 'dinner'].includes(addon.name);
      const multiplier = isDaily ? nights : 1;
      
      return total + (rate * quantity * multiplier);
    }, 0);
  }
  
  /**
   * Determine room usage type based on room IDs
   */
  private static determineRoomUsage(roomIds: string[]): RoomUsageType {
    // Simplified logic: if any room is small (private), use private rates
    const hasPrivateRoom = roomIds.some(roomId => {
      const roomType = this.getRoomType(roomId);
      return ['small_a', 'small_b', 'small_c'].includes(roomType);
    });
    
    return hasPrivateRoom ? 'private' : 'shared';
  }
  
  /**
   * Get room type from room ID
   */
  private static getRoomType(roomId: string): keyof typeof ROOM_RATES {
    // Simplified mapping based on room naming convention
    if (roomId.includes('作法室') || roomId.includes('被服室')) return 'large';
    if (roomId.includes('視聴覚室')) return 'medium_a';
    if (roomId.includes('図書室')) return 'medium_b';
    if (roomId.includes('1年1組') || roomId.includes('1年2組')) return 'small_a';
    if (roomId.includes('理科室')) return 'small_b';
    if (roomId.includes('2年組') || roomId.includes('3年組')) return 'small_c';
    
    // Default to medium_b for unknown rooms
    return 'medium_b';
  }
  
  /**
   * Determine day type (weekday/weekend)
   */
  private static getDayType(date: Date): DayType {
    const dayOfWeek = date.getDay();
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';
  }
  
  /**
   * Determine season type (simplified)
   */
  private static getSeasonType(date: Date): SeasonType {
    const month = date.getMonth() + 1;
    
    // Peak season: July, August, December, January
    const peakMonths = [7, 8, 12, 1];
    return peakMonths.includes(month) ? 'on_season' : 'off_season';
  }
  
  /**
   * Get addon rate
   */
  private static getAddonRate(type: string, name: string): number {
    switch (type) {
      case 'meal':
        return ADDON_RATES.meals[name as keyof typeof ADDON_RATES.meals] || 0;
      case 'facility':
        return ADDON_RATES.facilities[name as keyof typeof ADDON_RATES.facilities] || 0;
      case 'equipment':
        return ADDON_RATES.equipment[name as keyof typeof ADDON_RATES.equipment] || 0;
      default:
        return 0;
    }
  }
}

export default SimplePriceCalculator;