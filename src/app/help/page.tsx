import Link from 'next/link';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { db } from '@/lib/db';
import { helpGuideCategories, helpGuides } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

// ISR - super fast!
export const revalidate = 3600;

export const metadata = {
  title: 'מדריכים ועזרה | QuickShop',
  description: 'מדריכים מפורטים לשימוש במערכת QuickShop - ניהול מוצרים, הזמנות, משלוחים, קופונים ועוד',
};

export default async function HelpPage() {
  const categories = await db
    .select()
    .from(helpGuideCategories)
    .where(eq(helpGuideCategories.isActive, true))
    .orderBy(asc(helpGuideCategories.sortOrder));

  const guides = await db
    .select()
    .from(helpGuides)
    .where(eq(helpGuides.isActive, true))
    .orderBy(asc(helpGuides.sortOrder));

  const guidesByCategory = guides.reduce((acc, guide) => {
    if (guide.categoryId) {
      if (!acc[guide.categoryId]) acc[guide.categoryId] = [];
      acc[guide.categoryId].push(guide);
    }
    return acc;
  }, {} as Record<string, typeof guides>);

  // Count total guides
  const totalGuides = guides.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <LandingHeader />
      
      {/* Hero */}
      <section className="pt-28 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {totalGuides} מדריכים
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            מרכז העזרה
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            כל מה שצריך לדעת כדי להפעיל את החנות שלכם בצורה הטובה ביותר
          </p>
        </div>
      </section>

      {/* Search (visual only for now) */}
      <section className="pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <input
              type="text"
              placeholder="חפשו מדריך..."
              className="w-full px-5 py-4 pr-12 bg-white border border-gray-200 rounded-2xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              disabled
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">המדריכים בהכנה, יהיו זמינים בקרוב!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const categoryGuides = guidesByCategory[category.id] || [];
                
                return (
                  <div 
                    key={category.id}
                    className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300"
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                      {category.icon || '📁'}
                    </div>
                    
                    {/* Title & Description */}
                    <h2 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                      {category.title}
                    </h2>
                    <p className="text-gray-500 text-sm mb-4">{category.description}</p>
                    
                    {/* Guides List */}
                    {categoryGuides.length > 0 ? (
                      <ul className="space-y-2">
                        {categoryGuides.slice(0, 4).map((guide) => (
                          <li key={guide.id}>
                            <Link 
                              href={`/help/${category.slug}/${guide.slug}`}
                              className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors group/link"
                            >
                              <svg className="w-4 h-4 text-gray-300 group-hover/link:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="group-hover/link:translate-x-1 transition-transform">{guide.title}</span>
                            </Link>
                          </li>
                        ))}
                        {categoryGuides.length > 4 && (
                          <li className="pt-1">
                            <Link 
                              href={`/help/${category.slug}/${categoryGuides[0].slug}`}
                              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              +{categoryGuides.length - 4} מדריכים נוספים
                            </Link>
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">בקרוב...</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Popular Guides */}
      {guides.length > 0 && (
        <section className="pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">מדריכים פופולריים</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {guides.slice(0, 4).map((guide) => {
                const cat = categories.find(c => c.id === guide.categoryId);
                return (
                  <Link
                    key={guide.id}
                    href={`/help/${cat?.slug}/${guide.slug}`}
                    className="group bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-emerald-200 transition-all"
                  >
                    <span className="text-2xl mb-3 block">{cat?.icon}</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors mb-1">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-gray-500">{cat?.title}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact Support */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-8 lg:p-12 text-center text-white shadow-xl shadow-emerald-500/20">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">צריכים עזרה נוספת?</h2>
            <p className="text-emerald-100 mb-8 max-w-md mx-auto">
              הצוות שלנו כאן בשבילכם. נשמח לעזור בכל שאלה.
            </p>
            <a
              href="https://wa.me/972552554432?text=שלום, אשמח לעזרה עם QuickShop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-colors shadow-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              דברו איתנו בווטסאפ
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
