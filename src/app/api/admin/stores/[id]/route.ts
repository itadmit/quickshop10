import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Get store details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, id),
  });

  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  return NextResponse.json(store);
}

// PATCH - Update store
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Check store exists
  const existingStore = await db.query.stores.findFirst({
    where: eq(stores.id, id),
  });

  if (!existingStore) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  // Check slug uniqueness if changed
  if (body.slug && body.slug !== existingStore.slug) {
    const slugExists = await db.query.stores.findFirst({
      where: eq(stores.slug, body.slug),
    });
    if (slugExists) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
  }

  // Prepare update data
  const updateData: Partial<typeof stores.$inferInsert> = {};
  
  if (body.name !== undefined) updateData.name = body.name;
  if (body.slug !== undefined) updateData.slug = body.slug;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.customDomain !== undefined) updateData.customDomain = body.customDomain || null;

  const [updatedStore] = await db
    .update(stores)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, id))
    .returning();

  return NextResponse.json(updatedStore);
}

// DELETE - Delete store
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check store exists
  const existingStore = await db.query.stores.findFirst({
    where: eq(stores.id, id),
  });

  if (!existingStore) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  await db.delete(stores).where(eq(stores.id, id));

  return NextResponse.json({ success: true });
}

