import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { db } from '@/lib/db';
import { helpGuideCategories, helpGuides } from '@/lib/db/schema';
import { eq, and, ne, asc } from 'drizzle-orm';
import { GuideFeedback } from './guide-feedback';

// ISR for fast page loads
export const revalidate = 3600;

interface GuidePageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: GuidePageProps) {
  const { category, slug } = await params;
  
  const [cat] = await db
    .select()
    .from(helpGuideCategories)
    .where(eq(helpGuideCategories.slug, category));
  
  if (!cat) return { title: 'מדריך לא נמצא | QuickShop' };
  
  const [guide] = await db
    .select()
    .from(helpGuides)
    .where(and(eq(helpGuides.categoryId, cat.id), eq(helpGuides.slug, slug)));
  
  if (!guide) return { title: 'מדריך לא נמצא | QuickShop' };
  
  return {
    title: `${guide.title} | מדריכים | QuickShop`,
    description: guide.description || guide.content.substring(0, 160).replace(/[#*]/g, ''),
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { category, slug } = await params;
  
  // Find category
  const [cat] = await db
    .select()
    .from(helpGuideCategories)
    .where(eq(helpGuideCategories.slug, category));
  
  if (!cat) notFound();
  
  // Find guide
  const [guide] = await db
    .select()
    .from(helpGuides)
    .where(and(
      eq(helpGuides.categoryId, cat.id),
      eq(helpGuides.slug, slug),
      eq(helpGuides.isActive, true)
    ));
  
  if (!guide) notFound();

  // Get related guides from same category (for sidebar)
  const relatedGuides = await db
    .select()
    .from(helpGuides)
    .where(and(
      eq(helpGuides.categoryId, cat.id),
      eq(helpGuides.isActive, true)
    ))
    .orderBy(asc(helpGuides.sortOrder));

  // Get suggested guides from other categories
  const otherCategories = await db
    .select()
    .from(helpGuideCategories)
    .where(and(
      ne(helpGuideCategories.id, cat.id),
      eq(helpGuideCategories.isActive, true)
    ))
    .orderBy(asc(helpGuideCategories.sortOrder))
    .limit(3);

  const suggestedGuides = await Promise.all(
    otherCategories.map(async (otherCat) => {
      const [firstGuide] = await db
        .select()
        .from(helpGuides)
        .where(and(
          eq(helpGuides.categoryId, otherCat.id),
          eq(helpGuides.isActive, true)
        ))
        .orderBy(asc(helpGuides.sortOrder))
        .limit(1);
      return firstGuide ? { ...firstGuide, category: otherCat } : null;
    })
  ).then(guides => guides.filter(Boolean));

  // Markdown to HTML
  const contentHtml = guide.content
    .split('\n')
    .map(line => {
      if (line.startsWith('## ')) {
        return `<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-100">${line.slice(3)}</h2>`;
      }
      if (line.startsWith('### ')) {
        return `<h3 class="text-lg font-semibold text-gray-800 mt-8 mb-3 flex items-center gap-2"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>${line.slice(4)}</h3>`;
      }
      if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.+?)\*\* - (.+)/);
        if (match) {
          return `<li class="mb-3 flex gap-3"><span class="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">✓</span><span><strong class="text-gray-900">${match[1]}</strong> <span class="text-gray-600">- ${match[2]}</span></span></li>`;
        }
        const match2 = line.match(/- \*\*(.+?)\*\*/);
        if (match2) {
          return `<li class="mb-2"><strong class="text-gray-900">${match2[1]}</strong></li>`;
        }
      }
      if (line.startsWith('- ')) {
        return `<li class="mb-2 flex gap-2 text-gray-700"><span class="text-emerald-500 mt-1">•</span><span>${line.slice(2)}</span></li>`;
      }
      if (line.match(/^\d+\. /)) {
        const num = line.match(/^(\d+)\./)?.[1];
        return `<li class="mb-3 flex gap-3"><span class="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">${num}</span><span class="text-gray-700">${line.replace(/^\d+\. /, '')}</span></li>`;
      }
      if (line.trim() === '') return '';
      return `<p class="mb-4 text-gray-600 leading-relaxed">${line}</p>`;
    })
    .join('');

  // Estimate reading time
  const wordCount = guide.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <LandingHeader />
      
      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-gray-600 transition-colors">מדריכים</Link>
              </li>
              <li className="text-gray-300">/</li>
              <li>
                <Link href="/help" className="text-gray-400 hover:text-gray-600 transition-colors">{cat.title}</Link>
              </li>
              <li className="text-gray-300">/</li>
              <li className="text-gray-700 font-medium">{guide.title}</li>
            </ol>
          </nav>

          <div className="flex gap-10">
            {/* Sidebar - Related Guides */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{cat.icon}</span>
                    <h3 className="font-semibold text-gray-900">{cat.title}</h3>
                  </div>
                  <ul className="space-y-1">
                    {relatedGuides.map((related) => (
                      <li key={related.id}>
                        <Link
                          href={`/help/${category}/${related.slug}`}
                          className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                            related.id === guide.id
                              ? 'bg-emerald-50 text-emerald-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {related.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quick Help */}
                <div className="mt-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-5">
                  <p className="text-sm text-emerald-800 font-medium mb-3">צריכים עזרה?</p>
                  <a
                    href="https://wa.me/972552554432"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    </svg>
                    דברו איתנו בווטסאפ
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <article className="flex-1 min-w-0">
              {/* Header */}
              <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                    {cat.icon} {cat.title}
                  </span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-500 text-sm">{readingTime} דק' קריאה</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {guide.title}
                </h1>
                {guide.description && (
                  <p className="text-lg text-gray-500">{guide.description}</p>
                )}
              </header>
              
              {/* Content */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8 lg:p-10 shadow-sm">
                <div 
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              </div>

              {/* Feedback */}
              <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <p className="text-gray-700 font-medium">האם המדריך הזה היה שימושי?</p>
                  <GuideFeedback guideId={guide.id} />
                </div>
              </div>

              {/* Suggested Guides */}
              {suggestedGuides.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">מדריכים שאולי יעניינו אותך</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestedGuides.map((suggested: any) => (
                      <Link
                        key={suggested.id}
                        href={`/help/${suggested.category.slug}/${suggested.slug}`}
                        className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{suggested.category.icon}</span>
                          <span className="text-xs text-gray-500">{suggested.category.title}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                          {suggested.title}
                        </h3>
                        {suggested.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{suggested.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Related Guides */}
              <div className="lg:hidden mt-12">
                <h2 className="text-xl font-bold text-gray-900 mb-4">עוד ב{cat.title}</h2>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {relatedGuides.filter(r => r.id !== guide.id).map((related) => (
                    <Link
                      key={related.id}
                      href={`/help/${category}/${related.slug}`}
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {related.title}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Back Link */}
              <div className="mt-10 text-center">
                <Link 
                  href="/help"
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  חזרה לכל המדריכים
                </Link>
              </div>
            </article>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
