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

// GET /api/admin/options - Get all options
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

// POST /api/admin/options - Create new option
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