/**
 * CRM Tasks API
 * 
 * Manages tasks for customers and orders
 * GET - Get tasks for a store, customer, or order
 * POST - Create a new task
 * PUT - Update a task
 * DELETE - Delete a task
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { crmTasks, users, customers, orders } from '@/lib/db/schema';
import { eq, desc, and, or, isNull, lte } from 'drizzle-orm';

// GET /api/crm/tasks?storeId=xxx&customerId=xxx&orderId=xxx&status=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const customerId = searchParams.get('customerId');
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    // Build conditions
    const conditions = [eq(crmTasks.storeId, storeId)];
    
    if (customerId) {
      conditions.push(eq(crmTasks.customerId, customerId));
    }
    if (orderId) {
      conditions.push(eq(crmTasks.orderId, orderId));
    }
    if (status) {
      conditions.push(eq(crmTasks.status, status as 'pending' | 'in_progress' | 'completed' | 'cancelled'));
    }
    if (assignedTo) {
      conditions.push(eq(crmTasks.assignedTo, assignedTo));
    }

    const tasks = await db
      .select({
        id: crmTasks.id,
        title: crmTasks.title,
        description: crmTasks.description,
        dueDate: crmTasks.dueDate,
        priority: crmTasks.priority,
        status: crmTasks.status,
        completedAt: crmTasks.completedAt,
        createdAt: crmTasks.createdAt,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
        },
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
        },
        assignedToUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(crmTasks)
      .leftJoin(customers, eq(crmTasks.customerId, customers.id))
      .leftJoin(orders, eq(crmTasks.orderId, orders.id))
      .leftJoin(users, eq(crmTasks.assignedTo, users.id))
      .where(and(...conditions))
      .orderBy(desc(crmTasks.createdAt));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('[CRM Tasks API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get tasks' },
      { status: 500 }
    );
  }
}

// POST /api/crm/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const { 
      storeId, 
      customerId, 
      orderId, 
      assignedTo, 
      title, 
      description, 
      dueDate, 
      priority,
      createdBy 
    } = await request.json();

    if (!storeId || !title) {
      return NextResponse.json({ error: 'storeId and title are required' }, { status: 400 });
    }

    const [task] = await db
      .insert(crmTasks)
      .values({
        storeId,
        customerId: customerId || null,
        orderId: orderId || null,
        assignedTo: assignedTo || null,
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        createdBy: createdBy || null,
      })
      .returning();

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('[CRM Tasks API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/tasks - Update a task
export async function PUT(request: NextRequest) {
  try {
    const { 
      taskId,
      title, 
      description, 
      dueDate, 
      priority,
      status,
      assignedTo 
    } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const [task] = await db
      .update(crmTasks)
      .set(updateData)
      .where(eq(crmTasks.id, taskId))
      .returning();

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('[CRM Tasks API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/tasks?taskId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    await db.delete(crmTasks).where(eq(crmTasks.id, taskId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CRM Tasks API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete task' },
      { status: 500 }
    );
  }
}

