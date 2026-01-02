import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { storeMembers, teamInvitations, users } from '@/lib/db/schema';
import { eq, desc, and, gt, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InviteForm } from './invite-form';
import { MemberButtons } from './member-buttons';

export default async function TeamSettingsPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get team members with user info
  const members = await db
    .select({
      id: storeMembers.id,
      role: storeMembers.role,
      createdAt: storeMembers.createdAt,
      acceptedAt: storeMembers.acceptedAt,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userAvatar: users.avatarUrl,
    })
    .from(storeMembers)
    .innerJoin(users, eq(users.id, storeMembers.userId))
    .where(eq(storeMembers.storeId, store.id))
    .orderBy(desc(storeMembers.createdAt));

  // Get pending invitations
  const invitations = await db
    .select()
    .from(teamInvitations)
    .where(and(
      eq(teamInvitations.storeId, store.id),
      isNull(teamInvitations.acceptedAt),
      gt(teamInvitations.expiresAt, new Date())
    ))
    .orderBy(desc(teamInvitations.createdAt));

  const roleLabels: Record<string, string> = {
    owner: 'בעלים',
    manager: 'מנהל',
    marketing: 'שיווק',
    developer: 'מפתח',
    influencer: 'משפיען',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">צוות</h1>
          <p className="text-gray-500 text-sm mt-1">ניהול חברי צוות והרשאות</p>
        </div>
        <Link
          href={`/shops/${slug}/admin/settings`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          → חזרה להגדרות
        </Link>
      </div>

      {/* Invite Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">הזמנת חבר צוות חדש</h2>
        <InviteForm storeId={store.id} slug={slug} />
      </div>

      {/* Current Members */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">חברי צוות ({members.length})</h2>
        </div>
        
        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>אין חברי צוות נוספים</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {member.userAvatar ? (
                      <img src={member.userAvatar} alt={member.userName || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 text-lg">
                        {(member.userName || member.userEmail)?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.userName || 'משתמש ללא שם'}
                    </p>
                    <p className="text-sm text-gray-500">{member.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                    member.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    member.role === 'marketing' ? 'bg-green-100 text-green-800' :
                    member.role === 'influencer' ? 'bg-pink-100 text-pink-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {roleLabels[member.role] || member.role}
                  </span>
                  {member.role !== 'owner' && (
                    <MemberButtons memberId={member.id} slug={slug} type="member" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">הזמנות ממתינות ({invitations.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#D97706" strokeWidth="1.5">
                      <path d="M2 4h16v12H2V4z" />
                      <path d="M2 4l8 6 8-6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      הוזמן ב-{new Date(invitation.createdAt).toLocaleDateString('he-IL')} • 
                      פג תוקף ב-{new Date(invitation.expiresAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    invitation.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    invitation.role === 'marketing' ? 'bg-green-100 text-green-800' :
                    invitation.role === 'influencer' ? 'bg-pink-100 text-pink-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {roleLabels[invitation.role] || invitation.role}
                  </span>
                  <MemberButtons memberId={invitation.id} slug={slug} type="invitation" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Permissions Info */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900">הרשאות תפקידים</h3>
          <p className="text-sm text-gray-500 mt-1">כל תפקיד מגיע עם הרשאות ברירת מחדל שניתן להתאים אישית</p>
        </div>
        <div className="divide-y divide-gray-100">
          {/* Owner */}
          <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg flex-shrink-0">
              👑
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">בעלים</h4>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">מלא</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">גישה מלאה לכל האזורים כולל הגדרות תשלום, חיוב ומחיקת חנות</p>
            </div>
            <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">מוצרים</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">הזמנות</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">לקוחות</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">הגדרות</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">+עוד</span>
            </div>
          </div>

          {/* Manager */}
          <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg flex-shrink-0">
              ⚙️
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">מנהל</h4>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded">ניהול</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">ניהול מוצרים, הזמנות, לקוחות ומבצעים. גישה מלאה לתפעול שוטף</p>
            </div>
            <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">מוצרים</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">הזמנות</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">לקוחות</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">דוחות</span>
            </div>
          </div>

          {/* Marketing */}
          <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg flex-shrink-0">
              📣
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">שיווק</h4>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">שיווק</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">ניהול קופונים, עמודים ודוחות שיווק. ללא גישה להזמנות והגדרות</p>
            </div>
            <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">מוצרים</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">הנחות</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">דוחות</span>
            </div>
          </div>

          {/* Developer */}
          <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-lg flex-shrink-0">
              💻
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">מפתח</h4>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-200 text-gray-700 rounded">טכני</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">גישה להגדרות טכניות, webhooks ו-API. ללא גישה ללקוחות ודוחות</p>
            </div>
            <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">מוצרים</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">הגדרות</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">API</span>
            </div>
          </div>

          {/* Influencer */}
          <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-lg flex-shrink-0">
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">משפיען</h4>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-pink-100 text-pink-700 rounded">שותף</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">צפייה בקופונים ודוחות משויכים. דשבורד ייעודי בנפרד</p>
            </div>
            <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">הנחות</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">דוחות</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

