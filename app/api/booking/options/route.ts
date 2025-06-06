import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database/service';
import { createClient } from '@/lib/supabase/server';

// GET /api/booking/options - Get options for booking system
export async function GET() {
  try {
    const supabase = createClient();
    const dbService = new DatabaseService(supabase);
    
    const options = await dbService.getAllAddOns();
    
    // Transform database format to booking system format
    const transformedOptions = options.map(option => {
      const baseOption = {
        id: option.add_on_id,
        category: option.category,
        name: option.name,
        description: `${option.name} - ${option.unit}`,
        unit: option.unit,
        minQuantity: option.min_quantity,
        maxQuantity: option.max_quantity,
      };

      if (option.category === 'meal') {
        return {
          ...baseOption,
          rates: {
            adult: option.adult_fee,
            student: option.student_fee,
            child: option.child_fee,
            infant: option.infant_fee,
          }
        };
      }

      if (option.category === 'facility') {
        return {
          ...baseOption,
          personalFees: {
            under5h: option.personal_fee_5h,
            under10h: option.personal_fee_10h,
            over10h: option.personal_fee_over,
          },
          roomFees: {
            weekdayGuest: option.room_fee_weekday_guest,
            weekdayOther: option.room_fee_weekday_other,
            weekendGuest: option.room_fee_weekend_guest,
            weekendOther: option.room_fee_weekend_other,
          },
          airconFee: option.aircon_fee_per_hour,
        };
      }

      if (option.category === 'equipment') {
        return {
          ...baseOption,
          rate: option.adult_fee, // Use adult_fee as the base rate for equipment
        };
      }

      return baseOption;
    });
    
    return NextResponse.json({
      success: true,
      data: transformedOptions
    });
  } catch (error) {
    console.error('Error fetching booking options:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'オプションの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}