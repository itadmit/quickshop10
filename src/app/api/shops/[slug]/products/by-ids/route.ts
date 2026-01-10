'use server';

import { NextResponse } from 'next/server';
import { getStoreBySlug, getProductsByIds } from '@/lib/db/queries';

// ============================================
// Get Products by IDs API for Editor Preview
// Fast, lightweight API for product picker preview
// ============================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');
  
  if (!idsParam) {
    return NextResponse.json({ products: [] });
  }

  const productIds = idsParam.split(',').filter(id => id.trim());
  
  if (productIds.length === 0) {
    return NextResponse.json({ products: [] });
  }

  try {
    const store = await getStoreBySlug(slug);
    if (!store) {
      return NextResponse.json({ products: [] });
    }

    const foundProducts = await getProductsByIds(store.id, productIds);

    // Format response for editor preview
    const result = foundProducts.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      image: p.image,
      shortDescription: p.shortDescription,
      inventory: p.inventory,
      trackInventory: p.trackInventory,
      allowBackorder: p.allowBackorder,
      isFeatured: p.isFeatured,
    }));

    return NextResponse.json({ products: result });
  } catch (error) {
    console.error('Get products by IDs error:', error);
    return NextResponse.json({ products: [] });
  }
}

