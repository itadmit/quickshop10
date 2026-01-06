/**
 * Public API v1 - Customers
 * GET /api/v1/customers - List customers
 * 
 * Requires: X-API-Key header
 * Scopes: customers:read
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, and, desc, asc, sql, like, or, gte } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';

// GET /api/v1/customers
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const result = await requireApiAuth(request, 'customers:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const query = searchParams.get('query');
    const hasOrders = searchParams.get('has_orders');
    const createdAtMin = searchParams.get('created_at_min');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    
    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [eq(customers.storeId, auth.store.id)];
    
    if (query) {
      conditions.push(
        or(
          like(customers.email, `%${query}%`),
          like(customers.firstName, `%${query}%`),
          like(customers.lastName, `%${query}%`),
          like(customers.phone, `%${query}%`)
        )!
      );
    }
    
    if (hasOrders === 'true') {
      conditions.push(gte(customers.totalOrders, 1));
    } else if (hasOrders === 'false') {
      conditions.push(eq(customers.totalOrders, 0));
    }
    
    if (createdAtMin) {
      conditions.push(gte(customers.createdAt, new Date(createdAtMin)));
    }
    
    // Sort
    const orderColumn = sortBy === 'name' ? customers.firstName :
                       sortBy === 'total_spent' ? customers.totalSpent :
                       sortBy === 'total_orders' ? customers.totalOrders :
                       customers.createdAt;
    const orderDir = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);
    
    // Get customers
    const customersData = await db
      .select({
        id: customers.id,
        email: customers.email,
        first_name: customers.firstName,
        last_name: customers.lastName,
        phone: customers.phone,
        total_orders: customers.totalOrders,
        total_spent: customers.totalSpent,
        credit_balance: customers.creditBalance,
        accepts_marketing: customers.acceptsMarketing,
        created_at: customers.createdAt,
        updated_at: customers.updatedAt,
      })
      .from(customers)
      .where(and(...conditions))
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(and(...conditions));
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess(
      customersData.map(c => ({
        ...c,
        total_spent: Number(c.total_spent),
        credit_balance: Number(c.credit_balance),
      })),
      {
        pagination: {
          page,
          limit,
          total: Number(count),
          total_pages: Math.ceil(Number(count) / limit),
          has_next: page * limit < Number(count),
          has_prev: page > 1,
        },
      }
    );
    
  } catch (error) {
    console.error('API v1 customers list error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch customers', 500);
  }
}

