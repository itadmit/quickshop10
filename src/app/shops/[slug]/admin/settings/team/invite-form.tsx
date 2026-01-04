'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { inviteTeamMember } from './actions';

interface InviteFormProps {
  storeId: string;
  slug: string;
}

// Default permissions by role
const rolePermissions: Record<string, Record<string, boolean>> = {
  manager: {
    products: true,
    orders: true,
    customers: true,
    discounts: true,
    reports: true,
    settings: true,
    team: true,
  },
  marketing: {
    products: true,
    orders: false,
    customers: true,
    discounts: true,
    reports: true,
    settings: false,
    team: false,
  },
  developer: {
    products: true,
    orders: true,
    customers: false,
    discounts: false,
    reports: false,
    settings: true,
    team: false,
  },
  influencer: {
    products: false,
    orders: false,
    customers: false,
    discounts: true,
    reports: true,
    settings: false,
    team: false,
  },
};

const permissionLabels: Record<string, { label: string; description: string }> = {
  products: { label: 'מוצרים', description: 'ניהול מוצרים וקטגוריות' },
  orders: { label: 'הזמנות', description: 'צפייה וניהול הזמנות' },
  customers: { label: 'לקוחות', description: 'צפייה וניהול לקוחות' },
  discounts: { label: 'הנחות', description: 'ניהול קופונים והנחות' },
  reports: { label: 'דוחות', description: 'צפייה בדוחות ואנליטיקס' },
  settings: { label: 'הגדרות', description: 'שינוי הגדרות החנות' },
  team: { label: 'צוות', description: 'ניהול חברי צוות' },
};

export function InviteForm({ storeId, slug }: InviteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('manager');
  const [permissions, setPermissions] = useState<Record<string, boolean>>(rolePermissions.manager);
  const [showPermissions, setShowPermissions] = useState(false);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setPermissions(rolePermissions[role] || {});
  };

  const handlePermissionChange = (key: string, value: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    startTransition(async () => {
      const result = await inviteTeamMember(storeId, slug, { 
        email, 
        role: selectedRole,
        permissions: Object.entries(permissions)
          .filter(([_, v]) => v)
          .map(([k]) => k),
      });
      
      if (result.success) {
        setSuccess(`הזמנה נשלחה בהצלחה ל-${email}`);
        (e.target as HTMLFormElement).reset();
        setSelectedRole('manager');
        setPermissions(rolePermissions.manager);
        setShowPermissions(false);
        router.refresh();
      } else {
        setError(result.error || 'שגיאה בשליחת ההזמנה');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            כתובת אימייל
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="email@example.com"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            תפקיד
          </label>
          <select
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900"
          >
            <option value="manager">מנהל</option>
            <option value="marketing">שיווק</option>
            <option value="developer">מפתח</option>
            <option value="influencer">משפיען</option>
          </select>
        </div>
      </div>

      {/* Permissions Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowPermissions(!showPermissions)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${showPermissions ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showPermissions ? 'הסתר הרשאות' : 'התאם הרשאות'}
        </button>
      </div>

      {/* Permissions Grid */}
      {showPermissions && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            בחר הרשאות ספציפיות עבור משתמש זה. ההרשאות ברירת מחדל מבוססות על התפקיד שנבחר.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(permissionLabels).map(([key, { label, description }]) => (
              <label
                key={key}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  permissions[key]
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={permissions[key] || false}
                  onChange={(e) => handlePermissionChange(key, e.target.checked)}
                  className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-500 accent-black"
                />
                <div>
                  <span className="font-medium text-gray-900">{label}</span>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Role Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>תפקיד {getRoleLabel(selectedRole)}:</strong>{' '}
          {getRoleDescription(selectedRole)}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium cursor-pointer"
      >
        {isPending ? 'שולח...' : 'שלח הזמנה'}
      </button>
    </form>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    manager: 'מנהל',
    marketing: 'שיווק',
    developer: 'מפתח',
    influencer: 'משפיען',
  };
  return labels[role] || role;
}

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    manager: 'גישה מלאה לכל אזורי הניהול כולל הגדרות וניהול צוות.',
    marketing: 'גישה למוצרים, לקוחות, הנחות ודוחות. ללא גישה להזמנות והגדרות.',
    developer: 'גישה למוצרים, הזמנות והגדרות טכניות. ללא גישה ללקוחות ודוחות.',
    influencer: 'גישה לצפייה בהנחות ודוחות משויכים בלבד.',
  };
  return descriptions[role] || '';
}
