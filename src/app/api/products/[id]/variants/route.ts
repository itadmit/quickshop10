import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productVariants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const variants = await db
      .select({
        id: productVariants.id,
        title: productVariants.title,
        price: productVariants.price,
        inventory: productVariants.inventory,
      })
      .from(productVariants)
      .where(eq(productVariants.productId, id));
    
    return NextResponse.json({ variants });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json({ variants: [] }, { status: 500 });
  }
}

