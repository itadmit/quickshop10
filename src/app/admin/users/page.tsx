import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users, stores } from '@/lib/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import Link from 'next/link';

export default async function PlatformUsersPage() {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    redirect('/login');
  }

  // Get all users with their store count
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      storeCount: sql<number>`(SELECT COUNT(*) FROM stores WHERE owner_id = ${users.id})::int`,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  // Get role counts
  const roleCounts = await db
    .select({
      role: users.role,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(users)
    .groupBy(users.role);

  const roleCountMap = roleCounts.reduce((acc, { role, count }) => {
    acc[role] = count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-xl tracking-[0.3em] uppercase">
              QuickShop
            </Link>
            <span className="px-2 py-1 bg-white/20 text-xs rounded">Platform Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/60">{session.user.email}</span>
            <Link href="/logout" className="text-sm text-white/60 hover:text-white">
              התנתק
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <Link href="/admin" className="py-4 text-sm text-gray-600 hover:text-black">
              סקירה
            </Link>
            <Link href="/admin/stores" className="py-4 text-sm text-gray-600 hover:text-black">
              חנויות
            </Link>
            <Link href="/admin/users" className="py-4 text-sm font-medium border-b-2 border-black">
              משתמשים
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">משתמשים ({allUsers.length})</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{roleCountMap['merchant'] || 0}</p>
            <p className="text-sm text-gray-500">סוחרים</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{roleCountMap['admin'] || 0}</p>
            <p className="text-sm text-gray-500">מנהלים</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{allUsers.length}</p>
            <p className="text-sm text-gray-500">סה״כ</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right p-4 text-sm font-medium text-gray-500">משתמש</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">תפקיד</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">חנויות</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">הצטרף</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name || ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500 text-lg">
                              {(user.name || user.email)?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || 'ללא שם'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role === 'admin' ? 'מנהל' : 'סוחר'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-900">{user.storeCount}</td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(user.createdAt).toLocaleDateString('he-IL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}


