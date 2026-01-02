import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentInfluencer } from '@/lib/influencer-auth';
import { redirect, notFound } from 'next/navigation';
import { SettingsForm } from './settings-form';
import { PasswordForm } from './password-form';

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function InfluencerSettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  
  const basePath = `/shops/${slug}`;
  
  // Check authentication
  const influencer = await getCurrentInfluencer();
  if (!influencer || influencer.storeId !== store.id) {
    redirect(`${basePath}/influencer/login`);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">הגדרות</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">ניהול פרטים אישיים והגדרות חשבון</p>
      </div>

      {/* Personal Details */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">פרטים אישיים</h2>
        </div>
        <div className="p-4 sm:p-5">
          <SettingsForm 
            influencer={{
              id: influencer.id,
              name: influencer.name,
              email: influencer.email,
              phone: influencer.phone,
            }}
            storeSlug={slug}
          />
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">שינוי סיסמה</h2>
        </div>
        <div className="p-4 sm:p-5">
          <PasswordForm storeSlug={slug} />
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">פרטי חשבון</h2>
        </div>
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
            <span className="text-gray-500 text-sm">קוד קופון</span>
            <span className="font-mono font-medium text-purple-600 text-sm sm:text-base">{influencer.couponCode || '-'}</span>
          </div>
          <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
            <span className="text-gray-500 text-sm">שיעור עמלה</span>
            <span className="font-medium text-sm sm:text-base">
              {influencer.commissionValue 
                ? `${influencer.commissionValue}${influencer.commissionType === 'percentage' ? '%' : '₪'}`
                : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
            <span className="text-gray-500 text-sm">סטטוס</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              influencer.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {influencer.isActive ? 'פעיל' : 'לא פעיל'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 sm:py-3">
            <span className="text-gray-500 text-sm">הצטרף בתאריך</span>
            <span className="font-medium text-sm sm:text-base">
              {new Intl.DateTimeFormat('he-IL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).format(new Date(influencer.createdAt))}
            </span>
          </div>
        </div>
      </div>

      {/* Commission Stats Summary */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div>
              <p className="text-purple-900 font-medium text-xs sm:text-sm">סה"כ מכירות</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(
                  parseFloat(influencer.totalSales || '0')
                )}
              </p>
            </div>
            <div className="text-left">
              <p className="text-purple-900 font-medium text-xs sm:text-sm">עמלות שהורווחו</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(
                  parseFloat(influencer.totalCommission || '0')
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

