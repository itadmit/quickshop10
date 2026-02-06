/**
 * Customer Addresses API
 * GET /api/customer/addresses
 * 
 * Returns customer's saved addresses
 * Currently returns only default address from customers table
 * Future: Can be extended with dedicated customer_addresses table
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customer-auth';

export async function GET(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    // Currently we only have defaultAddress in customers table
    // In the future, this can be extended to query a customer_addresses table
    const addresses = [];
    
    if (customer.defaultAddress) {
      const addr = customer.defaultAddress as Record<string, unknown>;
      addresses.push({
        id: 'default',
        isDefault: true,
        address: addr.address || null,
        city: addr.city || null,
        zipCode: addr.zipCode || null,
        country: addr.country || 'IL',
        state: addr.state || null,
      });
    }
    
    return NextResponse.json({
      success: true,
      data: addresses,
    });
    
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת הכתובות' },
      { status: 500 }
    );
  }
}
