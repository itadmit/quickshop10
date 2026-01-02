'use server';

import { db } from '@/lib/db';
import { storeMembers, teamInvitations, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

interface InviteData {
  email: string;
  role: string;
  permissions?: string[];
}

export async function inviteTeamMember(
  storeId: string,
  slug: string,
  data: InviteData
) {
  try {
    // Get current user from session
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'יש להתחבר כדי להזמין משתמשים' };
    }

    // Validate role
    const validRoles = ['manager', 'marketing', 'developer', 'influencer'];
    if (!validRoles.includes(data.role)) {
      return { success: false, error: 'תפקיד לא תקין' };
    }

    // Check if already a team member
    const existingMember = await db.query.storeMembers.findFirst({
      where: (member, { and, eq: memberEq }) => and(
        memberEq(member.storeId, storeId)
      ),
      with: {
        user: true,
      },
    });
    
    // Check if user with this email is already a member
    const userWithEmail = await db.query.users.findFirst({
      where: (u, { eq: userEq }) => userEq(u.email, data.email),
    });
    
    if (userWithEmail) {
      const isMember = await db.query.storeMembers.findFirst({
        where: (member, { and, eq: memberEq }) => and(
          memberEq(member.storeId, storeId),
          memberEq(member.userId, userWithEmail.id)
        ),
      });
      
      if (isMember) {
        return { success: false, error: 'המשתמש כבר חבר צוות בחנות זו' };
      }
    }

    // Check if already invited (pending invitation)
    const existing = await db.query.teamInvitations.findFirst({
      where: (inv, { and, eq, isNull, gt }) => and(
        eq(inv.storeId, storeId),
        eq(inv.email, data.email),
        isNull(inv.acceptedAt),
        gt(inv.expiresAt, new Date())
      ),
    });

    if (existing) {
      return { success: false, error: 'כבר נשלחה הזמנה למייל זה' };
    }

    // Create invitation
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(teamInvitations).values({
      storeId,
      email: data.email,
      role: data.role as 'owner' | 'manager' | 'marketing' | 'developer' | 'influencer',
      invitedBy: session.user.id,
      token,
      expiresAt,
    });

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;
    
    try {
      await sendEmail({
        to: data.email,
        subject: `הוזמנת להצטרף לחנות ${slug}`,
        html: getInviteEmailTemplate({
          storeName: slug,
          role: getRoleLabel(data.role),
          inviteUrl,
        }),
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail the invitation if email fails, just log it
    }

    revalidatePath(`/shops/${slug}/admin/settings/team`);
    return { success: true };
  } catch (error) {
    console.error('Error inviting team member:', error);
    return { success: false, error: 'שגיאה בשליחת ההזמנה' };
  }
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: 'בעלים',
    manager: 'מנהל',
    marketing: 'שיווק',
    developer: 'מפתח',
    influencer: 'משפיען',
  };
  return labels[role] || role;
}

export async function removeMember(memberId: string, slug: string) {
  try {
    await db.delete(storeMembers).where(eq(storeMembers.id, memberId));
    revalidatePath(`/shops/${slug}/admin/settings/team`);
    return { success: true };
  } catch (error) {
    console.error('Error removing team member:', error);
    return { success: false, error: 'שגיאה בהסרת חבר צוות' };
  }
}

export async function cancelInvitation(invitationId: string, slug: string) {
  try {
    await db.delete(teamInvitations).where(eq(teamInvitations.id, invitationId));
    revalidatePath(`/shops/${slug}/admin/settings/team`);
    return { success: true };
  } catch (error) {
    console.error('Error canceling invitation:', error);
    return { success: false, error: 'שגיאה בביטול ההזמנה' };
  }
}

export async function updateMemberRole(
  memberId: string,
  slug: string,
  role: string
) {
  try {
    const validRoles = ['manager', 'marketing', 'developer', 'influencer'];
    if (!validRoles.includes(role)) {
      return { success: false, error: 'תפקיד לא תקין' };
    }

    await db
      .update(storeMembers)
      .set({ role: role as 'owner' | 'manager' | 'marketing' | 'developer' | 'influencer' })
      .where(eq(storeMembers.id, memberId));

    revalidatePath(`/shops/${slug}/admin/settings/team`);
    return { success: true };
  } catch (error) {
    console.error('Error updating member role:', error);
    return { success: false, error: 'שגיאה בעדכון התפקיד' };
  }
}

export async function updateMemberPermissions(
  memberId: string,
  slug: string,
  permissions: Record<string, boolean>
) {
  try {
    await db
      .update(storeMembers)
      .set({ permissions })
      .where(eq(storeMembers.id, memberId));

    revalidatePath(`/shops/${slug}/admin/settings/team`);
    return { success: true };
  } catch (error) {
    console.error('Error updating member permissions:', error);
    return { success: false, error: 'שגיאה בעדכון ההרשאות' };
  }
}

// ============ EMAIL TEMPLATES ============

interface InviteEmailData {
  storeName: string;
  role: string;
  inviteUrl: string;
}

function getInviteEmailTemplate({ storeName, role, inviteUrl }: InviteEmailData): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>הזמנה להצטרפות לצוות</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; direction: rtl; text-align: right;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        
        <!-- Main Container -->
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <span style="font-size: 24px; font-weight: 700; color: #18181b; font-family: Georgia, serif;">Quick Shop</span>
            </td>
          </tr>
          
          <!-- Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                
                <!-- Card Header -->
                <tr>
                  <td align="right" style="padding: 24px 24px 20px 24px; border-bottom: 1px solid #f4f4f5;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="right">
                          <div style="width: 44px; height: 44px; background-color: #18181b; border-radius: 10px; display: inline-block; text-align: center; line-height: 44px;">
                            <span style="color: white; font-size: 18px;">✉️</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="right" style="padding-top: 12px;">
                          <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #18181b; text-align: right;">הזמנה להצטרפות לצוות</h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Card Body -->
                <tr>
                  <td align="right" style="padding: 24px;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.5; color: #52525b; text-align: right;">
                      שלום,
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #52525b; text-align: right;">
                      הוזמנת להצטרף לצוות של חנות <strong style="color: #18181b;">${storeName}</strong> בתפקיד <strong style="color: #18181b;">${role}</strong>.
                    </p>
                    
                    <!-- Info Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafafa; border-radius: 10px; margin-bottom: 20px;">
                      <tr>
                        <td align="right" style="padding: 16px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td align="right" style="padding-bottom: 10px;">
                                <span style="font-size: 13px; color: #71717a; text-align: right; display: block;">חנות</span>
                                <span style="font-size: 15px; font-weight: 600; color: #18181b; text-align: right; display: block; margin-top: 2px;">${storeName}</span>
                              </td>
                            </tr>
                            <tr>
                              <td align="right">
                                <span style="font-size: 13px; color: #71717a; text-align: right; display: block;">תפקיד</span>
                                <span style="display: inline-block; margin-top: 6px; padding: 4px 12px; background-color: #18181b; color: white; font-size: 13px; font-weight: 500; border-radius: 16px;">${role}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="${inviteUrl}" style="display: inline-block; padding: 12px 28px; background-color: #18181b; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                            קבל הזמנה והצטרף
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Expiry Notice -->
                    <p style="margin: 20px 0 0 0; font-size: 13px; color: #a1a1aa; text-align: center;">
                      ההזמנה תקפה ל-7 ימים
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 16px;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #71717a; text-align: center;">
                אם לא ביקשת הזמנה זו, ניתן להתעלם מהודעה זו.
              </p>
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; text-align: center;">
                © ${new Date().getFullYear()} Quick Shop - מערכת ניהול חנויות אונליין
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

