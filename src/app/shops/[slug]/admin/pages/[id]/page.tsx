import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageForm } from '../page-form';

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const page = await db.query.pages.findFirst({
    where: eq(pages.id, id),
  });

  if (!page || page.storeId !== store.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">עריכת עמוד</h1>
          <p className="text-gray-500 text-sm mt-1">{page.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/shops/${slug}/${page.slug}`}
            target="_blank"
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 8.67v4A1.33 1.33 0 0110.67 14H3.33A1.33 1.33 0 012 12.67V5.33A1.33 1.33 0 013.33 4h4M10 2h4v4M6.67 9.33L14 2" />
            </svg>
            צפה בעמוד
          </Link>
          <Link
            href={`/shops/${slug}/admin/pages`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← חזרה לעמודים
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PageForm 
          storeId={store.id} 
          slug={slug}
          pageId={page.id}
          initialData={{
            title: page.title,
            slug: page.slug,
            content: page.content || '',
            isPublished: page.isPublished,
            seoTitle: page.seoTitle || '',
            seoDescription: page.seoDescription || '',
          }}
        />
      </div>
    </div>
  );
}





