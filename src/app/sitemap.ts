import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://quickshop.co.il';
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-developers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for-marketers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/quickshop-payments`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];

  // Get active published stores (limit to top 1000 for performance)
  try {
    const activeStores = await db
      .select({
        slug: stores.slug,
        customDomain: stores.customDomain,
        updatedAt: stores.updatedAt,
      })
      .from(stores)
      .where(eq(stores.isPublished, true))
      .limit(1000);

    const storePages: MetadataRoute.Sitemap = activeStores.map(store => {
      const storeUrl = store.customDomain 
        ? `https://${store.customDomain}`
        : `${baseUrl}/shops/${store.slug}`;
      
      return {
        url: storeUrl,
        lastModified: store.updatedAt || new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      };
    });

    return [...staticPages, ...storePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages only if there's an error
    return staticPages;
  }
}
