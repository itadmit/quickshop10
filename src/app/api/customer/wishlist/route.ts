/**
 * Customer Wishlist API
 * GET /api/customer/wishlist - Get wishlist
 * POST /api/customer/wishlist - Add to wishlist
 * PUT /api/customer/wishlist - Toggle wishlist item
 * 
 * Requires customer authentication
 * Uses existing wishlist actions from src/lib/actions/wishlist.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { 
  getWishlistItems, 
  addToWishlist, 
  toggleWishlist,
  getWishlistCount
} from '@/lib/actions/wishlist';

// GET: Get wishlist items
export async function GET(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    // Use existing wishlist action
    const items = await getWishlistItems(customer.id);
    const count = await getWishlistCount(customer.id);
    
    return NextResponse.json({
      success: true,
      data: {
        items,
        count,
      },
    });
    
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת רשימת המשאלות' },
      { status: 500 }
    );
  }
}

// POST: Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { productId, variantId } = body;
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'חסר מזהה מוצר' },
        { status: 400 }
      );
    }
    
    // Use existing wishlist action
    const result = await addToWishlist(
      customer.storeId,
      customer.id,
      productId,
      variantId || null
    );
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'שגיאה בהוספה לרשימת המשאלות' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'המוצר נוסף לרשימת המשאלות',
    });
    
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בהוספה לרשימת המשאלות' },
      { status: 500 }
    );
  }
}

// PUT: Toggle wishlist item (add if not exists, remove if exists)
export async function PUT(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { productId, variantId } = body;
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'חסר מזהה מוצר' },
        { status: 400 }
      );
    }
    
    // Use existing toggle action
    const result = await toggleWishlist(
      customer.storeId,
      customer.id,
      productId,
      variantId || null
    );
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'שגיאה בעדכון רשימת המשאלות' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      isInWishlist: result.isInWishlist,
      message: result.isInWishlist ? 'המוצר נוסף לרשימת המשאלות' : 'המוצר הוסר מרשימת המשאלות',
    });
    
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון רשימת המשאלות' },
      { status: 500 }
    );
  }
}
