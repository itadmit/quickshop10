/**
 * CRM Notes API
 * 
 * Manages notes for customers
 * GET - Get notes for a customer
 * POST - Add a new note
 * DELETE - Delete a note
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { crmNotes, users } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/crm/notes?customerId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const storeId = searchParams.get('storeId');

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const notes = await db
      .select({
        id: crmNotes.id,
        content: crmNotes.content,
        createdAt: crmNotes.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(crmNotes)
      .leftJoin(users, eq(crmNotes.userId, users.id))
      .where(eq(crmNotes.customerId, customerId))
      .orderBy(desc(crmNotes.createdAt));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('[CRM Notes API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get notes' },
      { status: 500 }
    );
  }
}

// POST /api/crm/notes - Add a new note
export async function POST(request: NextRequest) {
  try {
    const { storeId, customerId, userId, content } = await request.json();

    if (!storeId || !customerId || !content) {
      return NextResponse.json({ error: 'storeId, customerId, and content are required' }, { status: 400 });
    }

    const [note] = await db
      .insert(crmNotes)
      .values({
        storeId,
        customerId,
        userId: userId || null,
        content: content.trim(),
      })
      .returning();

    // Fetch with user info
    const [noteWithUser] = await db
      .select({
        id: crmNotes.id,
        content: crmNotes.content,
        createdAt: crmNotes.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(crmNotes)
      .leftJoin(users, eq(crmNotes.userId, users.id))
      .where(eq(crmNotes.id, note.id))
      .limit(1);

    return NextResponse.json({ success: true, note: noteWithUser });
  } catch (error) {
    console.error('[CRM Notes API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add note' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/notes?noteId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'noteId is required' }, { status: 400 });
    }

    await db.delete(crmNotes).where(eq(crmNotes.id, noteId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CRM Notes API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete note' },
      { status: 500 }
    );
  }
}

