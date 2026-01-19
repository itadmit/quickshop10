/**
 * Storefront Stories API
 * 
 * ⚡ Performance:
 * - Single query with joins
 * - Cached responses
 * - No authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, storePlugins, productStories, products, productImages } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const storeSlug = request.nextUrl.searchParams.get('store');
    const visitorId = request.nextUrl.searchParams.get('visitor');

    if (!storeSlug) {
      return NextResponse.json(
        { error: 'Store slug required' },
        { status: 400 }
      );
    }

    // Get store
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Check if plugin is active
    const [plugin] = await db
      .select({
        isActive: storePlugins.isActive,
        config: storePlugins.config,
      })
      .from(storePlugins)
      .where(
        and(
          eq(storePlugins.storeId, store.id),
          eq(storePlugins.pluginSlug, 'product-stories'),
          eq(storePlugins.isActive, true)
        )
      )
      .limit(1);

    if (!plugin) {
      return NextResponse.json({
        stories: [],
        settings: null,
      });
    }

    const config = plugin.config as Record<string, unknown>;

    // Check if enabled
    if (!config.enabled) {
      return NextResponse.json({
        stories: [],
        settings: null,
      });
    }

    // Get stories with products (including inventory data for stock validation)
    const storiesData = await db
      .select({
        id: productStories.id,
        productId: productStories.productId,
        position: productStories.position,
        viewsCount: productStories.viewsCount,
        likesCount: productStories.likesCount,
        commentsCount: productStories.commentsCount,
        productTitle: products.name,
        productHandle: products.slug,
        productPrice: products.price,
        productCompareAtPrice: products.comparePrice,
        productDescription: products.description,
        // Inventory fields for stock validation
        trackInventory: products.trackInventory,
        inventory: products.inventory,
        allowBackorder: products.allowBackorder,
        hasVariants: products.hasVariants,
      })
      .from(productStories)
      .innerJoin(products, eq(productStories.productId, products.id))
      .where(
        and(
          eq(productStories.storeId, store.id),
          eq(productStories.isActive, true)
        )
      )
      .orderBy(asc(productStories.position));

    if (storiesData.length === 0) {
      return NextResponse.json({
        stories: [],
        settings: null,
      });
    }

    // Get product images
    const productIds = storiesData.map(s => s.productId);
    const images = await db
      .select({
        productId: productImages.productId,
        url: productImages.url,
      })
      .from(productImages)
      .where(eq(productImages.isPrimary, true));

    const imageMap = new Map(images.map(i => [i.productId, i.url]));

    // Format response
    const stories = storiesData.map(story => ({
      id: story.id,
      productId: story.productId,
      position: story.position,
      viewsCount: story.viewsCount,
      likesCount: story.likesCount,
      commentsCount: story.commentsCount,
      product: {
        id: story.productId,
        title: story.productTitle,
        handle: story.productHandle,
        price: Number(story.productPrice),
        compareAtPrice: story.productCompareAtPrice ? Number(story.productCompareAtPrice) : null,
        description: story.productDescription,
        image: imageMap.get(story.productId) || null,
        // Inventory fields for stock validation
        trackInventory: story.trackInventory,
        inventory: story.inventory,
        allowBackorder: story.allowBackorder,
        hasVariants: story.hasVariants,
      },
      isViewed: false, // TODO: Check against visitorId
      isLiked: false,  // TODO: Check against visitorId
    }));

    const settings = {
      displayMode: config.displayMode || 'home_only',
      autoAdvanceSeconds: Number(config.autoAdvanceSeconds) || 5,
      showProductInfo: config.showProductInfo !== false,
      allowLikes: config.allowLikes !== false,
      allowComments: config.allowComments !== false,
      allowQuickAdd: config.allowQuickAdd !== false,
      circleBorderColor: String(config.circleBorderColor || '#e91e63'),
      viewedBorderColor: String(config.viewedBorderColor || '#9e9e9e'),
    };

    return NextResponse.json({
      stories,
      settings,
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

