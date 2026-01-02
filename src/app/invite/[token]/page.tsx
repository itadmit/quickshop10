import { db } from '@/lib/db';
import { teamInvitations, users, storeMembers, stores } from '@/lib/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { AcceptInviteForm } from './accept-form';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

// Server Component - מהיר כמו PHP
export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // Fetch invitation with store info
  const invitation = await db.query.teamInvitations.findFirst({
    where: and(
      eq(teamInvitations.token, token),
      isNull(teamInvitations.acceptedAt),
      gt(teamInvitations.expiresAt, new Date())
    ),
  });

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">הזמנה לא תקפה</h1>
            <p className="text-gray-500 mb-6">
              ההזמנה פגה תוקף או כבר נוצלה. פנה למנהל החנות לקבלת הזמנה חדשה.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              חזרה להתחברות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get store info
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, invitation.storeId),
  });

  if (!store) {
    notFound();
  }

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, invitation.email),
  });

  const roleLabels: Record<string, string> = {
    owner: 'בעלים',
    manager: 'מנהל',
    marketing: 'שיווק',
    developer: 'מפתח',
    influencer: 'משפיען',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <h1 className="text-2xl font-logo text-gray-900 whitespace-nowrap" style={{ lineHeight: 1.5 }}>Quick Shop</h1>
            <p className="text-xs text-gray-500 whitespace-nowrap">מערכת ניהול חנויות אונליין</p>
          </Link>
        </div>

        {/* Invite Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white text-center">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-1">הוזמנת להצטרף!</h1>
            <p className="text-gray-300 text-sm">
              לחנות <strong className="text-white">{store.name}</strong>
            </p>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {/* Invite Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">אימייל</span>
                <span className="font-medium text-gray-900" dir="ltr">{invitation.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">תפקיד</span>
                <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                  {roleLabels[invitation.role] || invitation.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">תוקף הזמנה</span>
                <span className="text-sm text-gray-600">
                  {new Date(invitation.expiresAt).toLocaleDateString('he-IL')}
                </span>
              </div>
            </div>

            {/* Form */}
            <AcceptInviteForm 
              token={token}
              email={invitation.email}
              existingUser={!!existingUser}
              storeSlug={store.slug}
              role={invitation.role}
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          לא ביקשת הזמנה זו?{' '}
          <Link href="/login" className="text-gray-700 hover:text-black">
            התעלם והתחבר לחשבון הקיים
          </Link>
        </p>
      </div>
    </div>
  );
}

