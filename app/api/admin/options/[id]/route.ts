import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database/service';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/admin/options/[id] - Delete option
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'オプションIDが必要です'
        },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const dbService = new DatabaseService(supabase);
    
    const success = await dbService.deleteAddOn(id);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'オプションの削除に失敗しました'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'オプションが正常に削除されました'
    });
    
  } catch (error) {
    console.error('Error deleting option:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'オプションの削除に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/options/[id] - Get single option
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'オプションIDが必要です'
        },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const dbService = new DatabaseService(supabase);
    
    const option = await dbService.getAddOn(id);
    
    if (!option) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'オプションが見つかりません'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: option
    });
    
  } catch (error) {
    console.error('Error fetching option:', error);
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