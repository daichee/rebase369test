import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database/service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for option creation/update
const OptionSchema = z.object({
  name: z.string().min(1, 'オプション名は必須です'),
  category: z.enum(['meal', 'facility', 'equipment'], {
    errorMap: () => ({ message: 'カテゴリは meal, facility, equipment のいずれかを選択してください' })
  }),
  unit: z.string().min(1, '単位は必須です'),
  adult_fee: z.number().min(0).optional(),
  student_fee: z.number().min(0).optional(),
  child_fee: z.number().min(0).optional(),
  infant_fee: z.number().min(0).optional(),
  personal_fee_5h: z.number().min(0).optional(),
  personal_fee_10h: z.number().min(0).optional(),
  personal_fee_over: z.number().min(0).optional(),
  room_fee_weekday_guest: z.number().min(0).optional(),
  room_fee_weekday_other: z.number().min(0).optional(),
  room_fee_weekend_guest: z.number().min(0).optional(),
  room_fee_weekend_other: z.number().min(0).optional(),
  aircon_fee_per_hour: z.number().min(0).optional(),
  min_quantity: z.number().min(1).optional(),
  max_quantity: z.number().min(1).optional(),
  is_active: z.boolean().optional()
});

/**
 * Retrieves all add-on options for admin management
 * 
 * @returns JSON response with complete add-on options data
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   data: AddOnOption[]
 * }
 * 
 * Each AddOnOption includes:
 * - name: Option display name
 * - category: 'meal', 'facility', or 'equipment'
 * - unit: Pricing unit (e.g., "per person", "per night")
 * - Fee structures for different guest types and scenarios
 * - Quantity constraints (min/max)
 * - Active status flag
 * 
 * Used by admin interface for:
 * - Viewing all available add-on services
 * - Managing option pricing and availability
 * - Configuring service constraints
 * 
 * Error Responses: 500 for server errors during data retrieval
 */
export async function GET() {
  try {
    const supabase = createClient();
    const dbService = new DatabaseService(supabase);
    
    const options = await dbService.getAllAddOns();
    
    return NextResponse.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Error fetching options:', error);
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

/**
 * Creates a new add-on option with comprehensive validation
 * 
 * @param request - Next.js request object containing new option data
 * @returns JSON response with created option data or validation errors
 * 
 * Request Body Fields (validated with Zod schema):
 * Required:
 * - name: Option display name (minimum 1 character)
 * - category: One of 'meal', 'facility', 'equipment'
 * - unit: Pricing unit description
 * 
 * Optional Fee Structures:
 * - adult_fee, student_fee, child_fee, infant_fee: Age-based pricing
 * - personal_fee_5h, personal_fee_10h, personal_fee_over: Duration-based pricing
 * - room_fee_*: Room-based pricing for weekday/weekend guest/other scenarios
 * - aircon_fee_per_hour: Additional facility fees
 * - min_quantity, max_quantity: Quantity constraints
 * - is_active: Availability flag (default: true)
 * 
 * Processing:
 * 1. Validates input against OptionSchema
 * 2. Generates unique add_on_id from category and name
 * 3. Creates option record in database
 * 4. Returns created option with generated ID
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   data: AddOnOption  // Created option with generated add_on_id
 * }
 * 
 * Error Responses:
 * - 400: Validation errors with detailed field information
 * - 500: Server error during option creation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = OptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'バリデーションエラー',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const dbService = new DatabaseService(supabase);
    
    // Generate unique add_on_id from name and category
    const addOnId = `${validation.data.category}_${validation.data.name.replace(/\s+/g, '_').toLowerCase()}`;
    
    const optionData = {
      add_on_id: addOnId,
      ...validation.data
    };
    
    const newOption = await dbService.createAddOn(optionData);
    
    if (!newOption) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'オプションの作成に失敗しました'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: newOption
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating option:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'オプションの作成に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/options - Update option
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { add_on_id, ...updateData } = body;
    
    if (!add_on_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'オプションIDが必要です'
        },
        { status: 400 }
      );
    }
    
    // Validate update data
    const validation = OptionSchema.partial().safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'バリデーションエラー',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const dbService = new DatabaseService(supabase);
    
    const updatedOption = await dbService.updateAddOn(add_on_id, validation.data);
    
    if (!updatedOption) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'オプションの更新に失敗しました'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedOption
    });
    
  } catch (error) {
    console.error('Error updating option:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'オプションの更新に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}