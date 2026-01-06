import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { sql, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Search, Clock, Store, User, Eye, UserPlus, Shield, Users as UsersIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>;
}) {
  const { search, role } = await searchParams;

  // Get all users with their store count
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      emailVerifiedAt: users.emailVerifiedAt,
      storeCount: sql<number>`(SELECT COUNT(*) FROM stores WHERE owner_id = ${users.id})::int`,
    })
    .from(users)
    .orderBy(desc(users.lastLoginAt), desc(users.createdAt));

  // Filter in memory for search
  let filteredUsers = allUsers;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(u => 
      u.email?.toLowerCase().includes(searchLower) ||
      u.name?.toLowerCase().includes(searchLower)
    );
  }
  if (role) {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }

  // Get role counts
  const merchantCount = allUsers.filter(u => u.role === 'merchant').length;
  const adminCount = allUsers.filter(u => u.role === 'admin').length;
  const activeToday = allUsers.filter(u => {
    if (!u.lastLoginAt) return false;
    const diffHours = (Date.now() - new Date(u.lastLoginAt).getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  }).length;

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'אף פעם';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דק׳`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return new Date(date).toLocaleDateString('he-IL');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">משתמשים</h1>
          <p className="text-gray-500">{allUsers.length} משתמשים רשומים בפלטפורמה</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Link 
          href="/admin/users"
          className={`rounded-2xl p-5 border transition-all shadow-sm ${
            !role 
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300 ring-2 ring-emerald-200' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${!role ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
              <UsersIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{allUsers.length}</p>
          <p className="text-sm text-gray-500">סה״כ משתמשים</p>
        </Link>
        <Link 
          href="/admin/users?role=merchant"
          className={`rounded-2xl p-5 border transition-all shadow-sm ${
            role === 'merchant' 
              ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 ring-2 ring-blue-200' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${role === 'merchant' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
              <Store className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{merchantCount}</p>
          <p className="text-sm text-gray-500">סוחרים</p>
        </Link>
        <Link 
          href="/admin/users?role=admin"
          className={`rounded-2xl p-5 border transition-all shadow-sm ${
            role === 'admin' 
              ? 'bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-300 ring-2 ring-purple-200' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
          <p className="text-sm text-gray-500">מנהלים</p>
        </Link>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-green-100 text-green-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{activeToday}</p>
          <p className="text-sm text-gray-500">פעילים היום</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <form className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="חיפוש לפי שם או אימייל..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
          >
            חפש
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-right p-4 text-sm font-semibold text-gray-600">משתמש</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">תפקיד</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">חנויות</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">התחברות אחרונה</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">הצטרף</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => {
              const isOnline = user.lastLoginAt && 
                (Date.now() - new Date(user.lastLoginAt).getTime()) < 15 * 60 * 1000; // 15 minutes
              
              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden shadow-md">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name || ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-semibold">
                              {(user.name || user.email)?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {isOnline && (
                          <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name || 'ללא שם'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 text-xs rounded-full font-semibold ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role === 'admin' ? 'מנהל' : 'סוחר'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{user.storeCount}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className={`font-medium ${user.lastLoginAt ? 'text-gray-700' : 'text-gray-400'}`}>
                        {formatRelativeTime(user.lastLoginAt)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      צפה
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-16 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">לא נמצאו משתמשים</p>
            <p className="text-gray-400 text-sm mt-1">נסה לשנות את מילות החיפוש</p>
          </div>
        )}
      </div>
    </div>
  );
}
