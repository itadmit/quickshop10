import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teamInvitations, users, storeMembers, influencers } from '@/lib/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'טוקן חסר' },
        { status: 400 }
      );
    }

    // Find valid invitation
    const invitation = await db.query.teamInvitations.findFirst({
      where: and(
        eq(teamInvitations.token, token),
        isNull(teamInvitations.acceptedAt),
        gt(teamInvitations.expiresAt, new Date())
      ),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'הזמנה לא תקפה או פגה תוקף' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await db.query.users.findFirst({
      where: eq(users.email, invitation.email),
    });

    if (user) {
      // Existing user - verify password
      if (!password) {
        return NextResponse.json(
          { error: 'יש להזין סיסמה' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(password, user.passwordHash || '');
      if (!isValid) {
        return NextResponse.json(
          { error: 'סיסמה שגויה' },
          { status: 400 }
        );
      }
    } else {
      // New user - create account
      if (!name || !password) {
        return NextResponse.json(
          { error: 'יש להזין שם וסיסמה' },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: 'הסיסמה חייבת להכיל לפחות 6 תווים' },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [newUser] = await db.insert(users).values({
        email: invitation.email,
        passwordHash,
        name,
        role: 'merchant',
        emailVerifiedAt: new Date(), // Auto-verify since they came from invitation
      }).returning();

      user = newUser;
    }

    // Check if already a member
    const existingMember = await db.query.storeMembers.findFirst({
      where: and(
        eq(storeMembers.storeId, invitation.storeId),
        eq(storeMembers.userId, user.id)
      ),
    });

    if (existingMember) {
      // Already a member, just mark invitation as accepted
      await db.update(teamInvitations)
        .set({ acceptedAt: new Date() })
        .where(eq(teamInvitations.id, invitation.id));

      return NextResponse.json({ success: true, alreadyMember: true });
    }

    // Add user to store members
    await db.insert(storeMembers).values({
      storeId: invitation.storeId,
      userId: user.id,
      role: invitation.role,
      permissions: getDefaultPermissions(invitation.role),
      invitedBy: invitation.invitedBy,
      acceptedAt: new Date(),
    });

    // If role is influencer, also create influencer record
    if (invitation.role === 'influencer') {
      // Check if influencer record already exists
      const existingInfluencer = await db.query.influencers.findFirst({
        where: and(
          eq(influencers.storeId, invitation.storeId),
          eq(influencers.email, invitation.email)
        ),
      });

      if (!existingInfluencer) {
        const passwordHash = await bcrypt.hash(password, 12);
        
        await db.insert(influencers).values({
          storeId: invitation.storeId,
          userId: user.id,
          name: user.name || name,
          email: invitation.email,
          passwordHash,
          commissionType: 'percentage',
          commissionValue: '10', // Default 10%
          isActive: true,
        });
      } else {
        // Link existing influencer to user
        await db.update(influencers)
          .set({ userId: user.id })
          .where(eq(influencers.id, existingInfluencer.id));
      }
    }

    // Mark invitation as accepted
    await db.update(teamInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(teamInvitations.id, invitation.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'שגיאה בקבלת ההזמנה' },
      { status: 500 }
    );
  }
}

function getDefaultPermissions(role: string): Record<string, boolean> {
  const permissions: Record<string, Record<string, boolean>> = {
    manager: {
      products: true,
      orders: true,
      customers: true,
      discounts: true,
      reports: true,
      settings: true,
      team: true,
      pos: true,
    },
    marketing: {
      products: true,
      orders: false,
      customers: true,
      discounts: true,
      reports: true,
      settings: false,
      team: false,
      pos: false,
    },
    developer: {
      products: true,
      orders: true,
      customers: false,
      discounts: false,
      reports: false,
      settings: true,
      team: false,
      pos: false,
    },
    influencer: {
      products: false,
      orders: false,
      customers: false,
      discounts: true,
      reports: true,
      settings: false,
      team: false,
      pos: false,
    },
    agent: {
      products: false,
      orders: true,
      customers: true,
      discounts: false,
      reports: true,
      settings: false,
      team: false,
      pos: true,
    },
  };
  return permissions[role] || {};
}






