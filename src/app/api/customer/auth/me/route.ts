import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { loyaltyMembers, loyaltyTiers, loyaltyPrograms } from '@/lib/db/schema-loyalty';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const customer = await getCurrentCustomer();

    if (!customer) {
      return NextResponse.json(
        { success: false, customer: null },
        { status: 401 }
      );
    }

    // Check if customer is a club member (based on contacts table)
    const [clubMemberContact] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(
          eq(contacts.storeId, customer.storeId),
          eq(contacts.email, customer.email),
          eq(contacts.type, 'club_member'),
          eq(contacts.status, 'active')
        )
      )
      .limit(1);

    // Get loyalty tier discount if customer is a club member
    let loyaltyTierDiscount = 0;
    let loyaltyTierName: string | null = null;
    
    if (clubMemberContact) {
      // Check if loyalty program is enabled for this store
      const [program] = await db
        .select({ 
          id: loyaltyPrograms.id,
          isEnabled: loyaltyPrograms.isEnabled 
        })
        .from(loyaltyPrograms)
        .where(eq(loyaltyPrograms.storeId, customer.storeId))
        .limit(1);
      
      if (program?.isEnabled) {
        // Get member's current tier (if exists in loyaltyMembers)
        const [member] = await db
          .select({
            tierId: loyaltyMembers.currentTierId,
          })
          .from(loyaltyMembers)
          .where(
            and(
              eq(loyaltyMembers.storeId, customer.storeId),
              eq(loyaltyMembers.customerId, customer.id)
            )
          )
          .limit(1);
        
        let tierToCheck: string | null = null;
        
        if (member?.tierId) {
          // Member has a specific tier
          tierToCheck = member.tierId;
        } else {
          // Club member but not in loyaltyMembers = default tier (level 1)
          const [defaultTier] = await db
            .select({ id: loyaltyTiers.id })
            .from(loyaltyTiers)
            .where(
              and(
                eq(loyaltyTiers.programId, program.id),
                eq(loyaltyTiers.isDefault, true),
                eq(loyaltyTiers.isActive, true)
              )
            )
            .limit(1);
          
          if (defaultTier) {
            tierToCheck = defaultTier.id;
          }
        }
        
        if (tierToCheck) {
          // Get tier discount percentage
          const [tier] = await db
            .select({
              name: loyaltyTiers.name,
              discountPercentage: loyaltyTiers.discountPercentage,
            })
            .from(loyaltyTiers)
            .where(
              and(
                eq(loyaltyTiers.id, tierToCheck),
                eq(loyaltyTiers.isActive, true)
              )
            )
            .limit(1);
          
          if (tier && Number(tier.discountPercentage) > 0) {
            loyaltyTierDiscount = Number(tier.discountPercentage);
            loyaltyTierName = tier.name;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        defaultAddress: customer.defaultAddress,
        hasPassword: !!customer.passwordHash,
        emailVerified: !!customer.emailVerifiedAt,
        creditBalance: Number(customer.creditBalance) || 0,
        isClubMember: !!clubMemberContact, // true if has active club_member contact
        loyaltyTierDiscount, // percentage discount from loyalty tier (0 if none)
        loyaltyTierName, // tier name for display
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת פרטי המשתמש' },
      { status: 500 }
    );
  }
}

