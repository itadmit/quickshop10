import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Slugify function to generate URL-friendly slugs
function slugify(text: string): string {
  return text
    .trim()
    .replace(/[\s\u200B-\u200D\uFEFF\u00A0\u2000-\u200A\u2028\u2029]+/g, '-')
    .replace(/[.,;:!?()[\]{}'"`~@#$%^&*+=|\\<>\/]+/g, '-')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const { slug: storeSlugOrId } = await params;
    const body = await request.json();

    const { name, parentId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'שם הקטגוריה הוא שדה חובה' }, { status: 400 });
    }

    // Get store - storeSlugOrId can be either slug or ID
    const store = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.id, storeSlugOrId))
      .limit(1);

    let storeId = storeSlugOrId;
    
    if (store.length === 0) {
      // Try by slug
      const storeBySlug = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.slug, storeSlugOrId))
        .limit(1);
      
      if (storeBySlug.length === 0) {
        return NextResponse.json({ error: 'החנות לא נמצאה' }, { status: 404 });
      }
      storeId = storeBySlug[0].id;
    } else {
      storeId = store[0].id;
    }

    // Generate slug from name
    let categorySlug = slugify(name);
    
    // Check if slug exists, add number if needed
    const existing = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(and(
        eq(categories.storeId, storeId),
        eq(categories.slug, categorySlug)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Add random suffix
      categorySlug = `${categorySlug}-${Date.now().toString(36)}`;
    }

    // Get max sort order
    const maxSort = await db
      .select({ sortOrder: categories.sortOrder })
      .from(categories)
      .where(eq(categories.storeId, storeId))
      .orderBy(categories.sortOrder)
      .limit(1);

    const nextSortOrder = (maxSort[0]?.sortOrder ?? 0) + 1;

    // Create category
    const [newCategory] = await db
      .insert(categories)
      .values({
        storeId,
        name: name.trim(),
        slug: categorySlug,
        parentId: parentId || null,
        isActive: true,
        sortOrder: nextSortOrder,
      })
      .returning({ id: categories.id, name: categories.name, parentId: categories.parentId });

    return NextResponse.json({
      id: newCategory.id,
      name: newCategory.name,
      parentId: newCategory.parentId,
      slug: categorySlug,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'אירעה שגיאה ביצירת הקטגוריה' }, { status: 500 });
  }
}

