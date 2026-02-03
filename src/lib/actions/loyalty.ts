'use server';

import { db } from '@/lib/db';
import { 
  loyaltyPrograms, 
  loyaltyTiers, 
  loyaltyMembers, 
  loyaltyTransactions,
  loyaltyTierProducts,
  type LoyaltyProgram,
  type LoyaltyTier,
  type LoyaltyMember,
} from '@/lib/db/schema-loyalty';
import { customers, contacts, orders, discounts } from '@/lib/db/schema';
import { eq, and, desc, asc, gte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============ PROGRAM MANAGEMENT ============

/**
 * קבלת או יצירת תוכנית נאמנות לחנות
 * Server Component friendly - single query
 */
export async function getLoyaltyProgram(storeId: string): Promise<LoyaltyProgram | null> {
  const [program] = await db
    .select()
    .from(loyaltyPrograms)
    .where(eq(loyaltyPrograms.storeId, storeId))
    .limit(1);
  
  return program || null;
}

/**
 * קבלת תוכנית נאמנות עם כל הרמות
 * Optimized: single query with join
 */
export async function getLoyaltyProgramWithTiers(storeId: string) {
  const program = await db.query.loyaltyPrograms.findFirst({
    where: eq(loyaltyPrograms.storeId, storeId),
    with: {
      tiers: {
        orderBy: asc(loyaltyTiers.level),
        where: eq(loyaltyTiers.isActive, true),
      },
    },
  });
  
  return program || null;
}

/**
 * יצירת תוכנית נאמנות חדשה עם רמת ברירת מחדל
 */
export async function createLoyaltyProgram(storeId: string, name: string = 'מועדון לקוחות') {
  // Check if already exists
  const existing = await getLoyaltyProgram(storeId);
  if (existing) {
    // Return existing program instead of error (handles race conditions)
    return { success: true, program: existing };
  }
  
  try {
  // Create program
  const [program] = await db.insert(loyaltyPrograms).values({
    storeId,
    name,
    isEnabled: false,
  }).returning();
  
  // Create default tier
  await db.insert(loyaltyTiers).values({
    programId: program.id,
    name: 'חבר',
    slug: 'member',
    level: 1,
    color: '#6B7280',
    icon: 'user',
    minValue: '0',
    pointsMultiplier: '1.0',
    discountPercentage: '0',
    isDefault: true,
    benefitsList: ['צבירת נקודות על כל רכישה'],
  });
  
  return { success: true, program };
  } catch (error: unknown) {
    // Handle race condition - duplicate key error
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      const existingProgram = await getLoyaltyProgram(storeId);
      if (existingProgram) {
        return { success: true, program: existingProgram };
      }
    }
    throw error;
  }
}

/**
 * עדכון הגדרות תוכנית נאמנות
 */
export async function updateLoyaltyProgram(
  programId: string,
  storeSlug: string,
  data: Partial<{
    name: string;
    isEnabled: boolean;
    pointsEnabled: boolean;
    pointsPerIls: string;
    pointsRedemptionRate: string;
    minPointsToRedeem: number;
    pointsExpireDays: number | null;
    progressionType: 'total_spent' | 'total_orders' | 'points_earned';
    showProgressBar: boolean;
    showPointsInHeader: boolean;
    welcomeBonus: number;
    birthdayBonus: number;
  }>
) {
  await db.update(loyaltyPrograms)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(loyaltyPrograms.id, programId));
  
  revalidatePath(`/shops/${storeSlug}/admin/loyalty`);
  revalidatePath(`/shops/${storeSlug}/account`);
  
  return { success: true };
}

// ============ TIER MANAGEMENT ============

/**
 * קבלת כל הרמות של תוכנית
 */
export async function getLoyaltyTiers(programId: string): Promise<LoyaltyTier[]> {
  return db
    .select()
    .from(loyaltyTiers)
    .where(eq(loyaltyTiers.programId, programId))
    .orderBy(asc(loyaltyTiers.level));
}

/**
 * יצירת רמה חדשה
 */
export async function createLoyaltyTier(
  programId: string,
  storeSlug: string,
  data: {
    name: string;
    slug: string;
    level: number;
    color: string;
    icon?: string;
    minValue: string;
    pointsMultiplier: string;
    discountPercentage: string;
    freeShippingThreshold?: string;
    description?: string;
    benefitsList?: string[];
  }
) {
  const [tier] = await db.insert(loyaltyTiers).values({
    programId,
    ...data,
    benefitsList: data.benefitsList || [],
  }).returning();
  
  revalidatePath(`/shops/${storeSlug}/admin/loyalty`);
  
  return { success: true, tier };
}

/**
 * עדכון רמה
 */
export async function updateLoyaltyTier(
  tierId: string,
  storeSlug: string,
  data: Partial<{
    name: string;
    color: string;
    icon: string;
    minValue: string;
    pointsMultiplier: string;
    discountPercentage: string;
    freeShippingThreshold: string | null;
    description: string;
    benefitsList: string[];
    isActive: boolean;
  }>
) {
  await db.update(loyaltyTiers)
    .set(data)
    .where(eq(loyaltyTiers.id, tierId));
  
  revalidatePath(`/shops/${storeSlug}/admin/loyalty`);
  revalidatePath(`/shops/${storeSlug}/account`);
  
  return { success: true };
}

/**
 * מחיקת רמה (אם לא ברירת מחדל)
 */
export async function deleteLoyaltyTier(tierId: string, storeSlug: string) {
  const [tier] = await db
    .select()
    .from(loyaltyTiers)
    .where(eq(loyaltyTiers.id, tierId))
    .limit(1);
  
  if (!tier) {
    return { success: false, error: 'רמה לא נמצאה' };
  }
  
  if (tier.isDefault) {
    return { success: false, error: 'לא ניתן למחוק רמת ברירת מחדל' };
  }
  
  // Move members to default tier
  const [defaultTier] = await db
    .select()
    .from(loyaltyTiers)
    .where(and(
      eq(loyaltyTiers.programId, tier.programId),
      eq(loyaltyTiers.isDefault, true)
    ))
    .limit(1);
  
  if (defaultTier) {
    await db.update(loyaltyMembers)
      .set({ currentTierId: defaultTier.id, tierUpdatedAt: new Date() })
      .where(eq(loyaltyMembers.currentTierId, tierId));
  }
  
  await db.delete(loyaltyTiers).where(eq(loyaltyTiers.id, tierId));
  
  revalidatePath(`/shops/${storeSlug}/admin/loyalty`);
  
  return { success: true };
}

// ============ MEMBER MANAGEMENT ============

/**
 * קבלת מידע חבר מועדון עם הרמה הנוכחית
 * Optimized for Server Components - single query
 */
export async function getLoyaltyMemberData(storeId: string, customerId: string) {
  const member = await db.query.loyaltyMembers.findFirst({
    where: and(
      eq(loyaltyMembers.storeId, storeId),
      eq(loyaltyMembers.customerId, customerId)
    ),
    with: {
      currentTier: true,
    },
  });
  
  if (!member) return null;
  
  // Get program and all tiers for progress calculation
  const program = await db.query.loyaltyPrograms.findFirst({
    where: eq(loyaltyPrograms.storeId, storeId),
    with: {
      tiers: {
        orderBy: asc(loyaltyTiers.level),
        where: eq(loyaltyTiers.isActive, true),
      },
    },
  });
  
  if (!program) return null;
  
  // Calculate progress to next tier
  let nextTier: LoyaltyTier | null = null;
  let progressPercentage = 100;
  let amountToNextTier = 0;
  
  const currentTierLevel = member.currentTier?.level || 0;
  const sortedTiers = program.tiers.sort((a, b) => a.level - b.level);
  
  for (const tier of sortedTiers) {
    if (tier.level > currentTierLevel) {
      nextTier = tier;
      break;
    }
  }
  
  if (nextTier) {
    const currentValue = program.progressionType === 'total_orders' 
      ? member.totalOrdersQualifying 
      : Number(member.totalSpentQualifying);
    const targetValue = Number(nextTier.minValue);
    const currentTierMin = member.currentTier ? Number(member.currentTier.minValue) : 0;
    
    const progress = currentValue - currentTierMin;
    const range = targetValue - currentTierMin;
    
    progressPercentage = Math.min(100, Math.max(0, (progress / range) * 100));
    amountToNextTier = Math.max(0, targetValue - currentValue);
  }
  
  // Calculate points value in ILS
  const pointsValue = Number(member.currentPoints) * Number(program.pointsRedemptionRate);
  
  return {
    member,
    program,
    currentTier: member.currentTier,
    nextTier,
    progressPercentage,
    amountToNextTier,
    pointsValue,
    allTiers: sortedTiers,
  };
}

/**
 * יצירת/קבלת חבר מועדון
 */
export async function getOrCreateLoyaltyMember(
  storeId: string,
  customerId: string,
  contactId?: string
): Promise<LoyaltyMember | null> {
  // Check if member exists
  const existing = await db.query.loyaltyMembers.findFirst({
    where: and(
      eq(loyaltyMembers.storeId, storeId),
      eq(loyaltyMembers.customerId, customerId)
    ),
  });
  
  if (existing) return existing;
  
  // Get program with default tier
  const program = await db.query.loyaltyPrograms.findFirst({
    where: eq(loyaltyPrograms.storeId, storeId),
    with: {
      tiers: {
        where: eq(loyaltyTiers.isDefault, true),
        limit: 1,
      },
    },
  });
  
  if (!program || !program.isEnabled) return null;
  
  const defaultTier = program.tiers[0];
  
  // Create member
  const [member] = await db.insert(loyaltyMembers).values({
    storeId,
    customerId,
    contactId,
    currentTierId: defaultTier?.id,
    currentPoints: String(program.welcomeBonus || 0),
    totalPointsEarned: String(program.welcomeBonus || 0),
  }).returning();
  
  // Record welcome bonus transaction if applicable
  if (program.welcomeBonus > 0) {
    await db.insert(loyaltyTransactions).values({
      memberId: member.id,
      type: 'bonus',
      points: String(program.welcomeBonus),
      description: 'בונוס הצטרפות למועדון',
    });
  }
  
  return member;
}

// ============ POINTS OPERATIONS ============

/**
 * הוספת נקודות מהזמנה
 * נקרא אחרי תשלום הזמנה
 */
export async function addPointsFromOrder(
  storeId: string,
  customerId: string,
  orderId: string,
  orderTotal: number
) {
  // Get member
  const member = await getOrCreateLoyaltyMember(storeId, customerId);
  if (!member) return { success: false, error: 'חבר מועדון לא נמצא' };
  
  // Get program
  const program = await getLoyaltyProgram(storeId);
  if (!program || !program.isEnabled || !program.pointsEnabled) {
    return { success: false, error: 'תוכנית נאמנות לא פעילה' };
  }
  
  // Get current tier for multiplier
  let multiplier = 1;
  if (member.currentTierId) {
    const [tier] = await db
      .select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.id, member.currentTierId))
      .limit(1);
    if (tier) {
      multiplier = Number(tier.pointsMultiplier);
    }
  }
  
  // Calculate points
  const basePoints = orderTotal * Number(program.pointsPerIls);
  const totalPoints = Math.floor(basePoints * multiplier);
  
  if (totalPoints <= 0) return { success: true, points: 0 };
  
  // Calculate expiration date
  let expiresAt: Date | undefined;
  if (program.pointsExpireDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + program.pointsExpireDays);
  }
  
  // Add transaction
  await db.insert(loyaltyTransactions).values({
    memberId: member.id,
    type: 'earn',
    points: String(totalPoints),
    orderId,
    description: `נקודות מהזמנה`,
    expiresAt,
  });
  
  // Update member
  const newTotalEarned = Number(member.totalPointsEarned) + totalPoints;
  const newCurrentPoints = Number(member.currentPoints) + totalPoints;
  const newTotalSpent = Number(member.totalSpentQualifying) + orderTotal;
  const newTotalOrders = member.totalOrdersQualifying + 1;
  
  await db.update(loyaltyMembers)
    .set({
      totalPointsEarned: String(newTotalEarned),
      currentPoints: String(newCurrentPoints),
      totalSpentQualifying: String(newTotalSpent),
      totalOrdersQualifying: newTotalOrders,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
      pointsExpireAt: expiresAt || member.pointsExpireAt,
    })
    .where(eq(loyaltyMembers.id, member.id));
  
  // Check for tier upgrade
  await checkAndUpgradeTier(member.id, program, newTotalSpent, newTotalOrders, newTotalEarned);
  
  return { success: true, points: totalPoints };
}

/**
 * פדיון נקודות
 */
export async function redeemPoints(
  storeId: string,
  customerId: string,
  pointsToRedeem: number,
  orderId?: string
) {
  const member = await db.query.loyaltyMembers.findFirst({
    where: and(
      eq(loyaltyMembers.storeId, storeId),
      eq(loyaltyMembers.customerId, customerId)
    ),
  });
  
  if (!member) {
    return { success: false, error: 'חבר מועדון לא נמצא' };
  }
  
  const program = await getLoyaltyProgram(storeId);
  if (!program || !program.isEnabled) {
    return { success: false, error: 'תוכנית נאמנות לא פעילה' };
  }
  
  if (Number(member.currentPoints) < pointsToRedeem) {
    return { success: false, error: 'אין מספיק נקודות' };
  }
  
  if (pointsToRedeem < program.minPointsToRedeem) {
    return { success: false, error: `מינימום ${program.minPointsToRedeem} נקודות לפדיון` };
  }
  
  // Calculate discount value
  const discountValue = pointsToRedeem * Number(program.pointsRedemptionRate);
  
  // Create discount code
  const code = `POINTS-${Date.now().toString(36).toUpperCase()}`;
  const [discount] = await db.insert(discounts).values({
    storeId,
    code,
    title: `פדיון ${pointsToRedeem} נקודות`,
    type: 'fixed_amount',
    value: String(discountValue),
    usageLimit: 1,
    isActive: true,
  }).returning();
  
  // Record transaction
  await db.insert(loyaltyTransactions).values({
    memberId: member.id,
    type: 'redeem',
    points: String(-pointsToRedeem),
    orderId,
    discountId: discount.id,
    description: `פדיון נקודות`,
  });
  
  // Update member
  await db.update(loyaltyMembers)
    .set({
      currentPoints: String(Number(member.currentPoints) - pointsToRedeem),
      totalPointsRedeemed: String(Number(member.totalPointsRedeemed) + pointsToRedeem),
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(loyaltyMembers.id, member.id));
  
  return { 
    success: true, 
    discountCode: code, 
    discountValue,
    discountId: discount.id,
  };
}

/**
 * קבלת היסטוריית תנועות נקודות
 */
export async function getLoyaltyTransactions(memberId: string, limit = 10) {
  return db
    .select()
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.memberId, memberId))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .limit(limit);
}

// ============ TIER UPGRADE ============

/**
 * בדיקה ועדכון רמה
 * Internal function - called after points/orders update
 */
async function checkAndUpgradeTier(
  memberId: string,
  program: LoyaltyProgram,
  totalSpent: number,
  totalOrders: number,
  totalPointsEarned: number
) {
  const member = await db.query.loyaltyMembers.findFirst({
    where: eq(loyaltyMembers.id, memberId),
    with: { currentTier: true },
  });
  
  if (!member) return;
  
  // Get all tiers sorted by level desc (highest first)
  const tiers = await db
    .select()
    .from(loyaltyTiers)
    .where(and(
      eq(loyaltyTiers.programId, program.id),
      eq(loyaltyTiers.isActive, true)
    ))
    .orderBy(desc(loyaltyTiers.level));
  
  // Determine qualifying value based on progression type
  let qualifyingValue: number;
  switch (program.progressionType) {
    case 'total_orders':
      qualifyingValue = totalOrders;
      break;
    case 'points_earned':
      qualifyingValue = totalPointsEarned;
      break;
    case 'total_spent':
    default:
      qualifyingValue = totalSpent;
  }
  
  // Find the highest tier the member qualifies for
  let newTier: LoyaltyTier | null = null;
  for (const tier of tiers) {
    if (qualifyingValue >= Number(tier.minValue)) {
      newTier = tier;
      break;
    }
  }
  
  // Update if tier changed
  if (newTier && newTier.id !== member.currentTierId) {
    await db.update(loyaltyMembers)
      .set({
        currentTierId: newTier.id,
        tierUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loyaltyMembers.id, memberId));
    
    // TODO: Send tier upgrade email notification
  }
}

// ============ ADMIN STATS ============

/**
 * סטטיסטיקות למנהל
 */
export async function getLoyaltyStats(storeId: string) {
  const program = await getLoyaltyProgram(storeId);
  if (!program) return null;
  
  // Get default tier (level 1)
  const [defaultTier] = await db
    .select()
    .from(loyaltyTiers)
    .where(and(
      eq(loyaltyTiers.programId, program.id),
      eq(loyaltyTiers.isDefault, true)
    ))
    .limit(1);
  
  // Count club members from contacts table (type = 'club_member')
  const [clubMemberCount] = await db
    .select({
      total: sql<number>`count(*)::int`,
    })
    .from(contacts)
    .where(and(
      eq(contacts.storeId, storeId),
      eq(contacts.type, 'club_member')
    ));
  
  const totalClubMembers = clubMemberCount?.total || 0;
  
  // Count members in higher tiers (in loyaltyMembers table)
  const higherTierMembers = await db
    .select({
      tierId: loyaltyMembers.currentTierId,
      tierName: loyaltyTiers.name,
      tierColor: loyaltyTiers.color,
      tierLevel: loyaltyTiers.level,
      count: sql<number>`count(*)::int`,
    })
    .from(loyaltyMembers)
    .innerJoin(loyaltyTiers, eq(loyaltyMembers.currentTierId, loyaltyTiers.id))
    .where(eq(loyaltyMembers.storeId, storeId))
    .groupBy(loyaltyMembers.currentTierId, loyaltyTiers.name, loyaltyTiers.color, loyaltyTiers.level);
  
  // Calculate level 1 members = total club members - those in higher tiers
  const higherTierCount = higherTierMembers.reduce((sum, t) => sum + t.count, 0);
  const level1Count = totalClubMembers - higherTierCount;
  
  // Build membersByTier with level 1 first
  const membersByTier = [
    {
      tierId: defaultTier?.id || null,
      tierName: defaultTier?.name || 'חבר',
      tierColor: defaultTier?.color || '#6B7280',
      count: level1Count,
    },
    ...higherTierMembers.map(t => ({
      tierId: t.tierId,
      tierName: t.tierName,
      tierColor: t.tierColor,
      count: t.count,
    })),
  ];
  
  // Points stats (only from loyaltyMembers who earned points)
  const [pointsStats] = await db
    .select({
      totalPointsEarned: sql<string>`coalesce(sum(total_points_earned::numeric), 0)::text`,
      totalPointsRedeemed: sql<string>`coalesce(sum(total_points_redeemed::numeric), 0)::text`,
      totalPointsActive: sql<string>`coalesce(sum(current_points::numeric), 0)::text`,
    })
    .from(loyaltyMembers)
    .where(eq(loyaltyMembers.storeId, storeId));
  
  return {
    program,
    membersByTier,
    totalMembers: totalClubMembers,
    totalPointsEarned: pointsStats?.totalPointsEarned || '0',
    totalPointsRedeemed: pointsStats?.totalPointsRedeemed || '0',
    totalPointsActive: pointsStats?.totalPointsActive || '0',
  };
}

