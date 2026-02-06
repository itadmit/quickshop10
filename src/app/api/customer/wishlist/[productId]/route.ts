/**
 * Customer Wishlist Item API
 * DELETE /api/customer/wishlist/[productId]
 * 
 * Remove specific item from wishlist
 * Requires customer authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { removeFromWishlist } from '@/lib/actions/wishlist';

interface RouteParams {
  params: Promise<{ productId: string }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');
    
    // Use existing wishlist action
    const result = await removeFromWishlist(
      customer.id,
      productId,
      variantId || null
    );
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'שגיאה בהסרה מרשימת המשאלות' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'המוצר הוסר מרשימת המשאלות',
    });
    
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בהסרה מרשימת המשאלות' },
      { status: 500 }
    );
  }
}
