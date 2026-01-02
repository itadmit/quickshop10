import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { MediaGrid } from './media-grid';
import { UploadForm } from './upload-form';

export default async function MediaLibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const { slug } = await params;
  const { folder } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get all media with optional folder filter
  const mediaQuery = folder
    ? eq(media.folder, folder)
    : sql`1=1`;

  const storeMedia = await db
    .select()
    .from(media)
    .where(sql`${media.storeId} = ${store.id} AND ${mediaQuery}`)
    .orderBy(desc(media.createdAt));

  // Get unique folders
  const folders = await db
    .selectDistinct({ folder: media.folder })
    .from(media)
    .where(eq(media.storeId, store.id));

  const uniqueFolders = folders
    .map(f => f.folder)
    .filter((f): f is string => f !== null);

  // Calculate storage stats
  const totalSize = storeMedia.reduce((sum, m) => sum + (m.size || 0), 0);
  const totalCount = storeMedia.length;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ספריית מדיה</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {totalCount} קבצים • {formatBytes(totalSize)}
          </p>
        </div>
        <UploadForm storeId={store.id} slug={slug} currentFolder={folder} />
      </div>

      {/* Folders */}
      {uniqueFolders.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          <a
            href={`/shops/${slug}/admin/media`}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
              !folder 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            הכל
          </a>
          {uniqueFolders.map((f) => (
            <a
              key={f}
              href={`/shops/${slug}/admin/media?folder=${encodeURIComponent(f)}`}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                folder === f 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </a>
          ))}
        </div>
      )}

      {/* Media Grid */}
      <MediaGrid media={storeMedia} slug={slug} />
    </div>
  );
}

