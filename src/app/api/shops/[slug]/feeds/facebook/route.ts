import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, products, productImages, productVariants } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// Facebook Catalog Feed (XML)
// Documentation: https://developers.facebook.com/docs/marketing-api/catalog/reference

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Get store
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });

  if (!store || !store.isPublished) {
    return new NextResponse('Store not found', { status: 404 });
  }

  // Get store settings
  const storeSettings = (store.settings as Record<string, unknown>) || {};
  const currency = (storeSettings.currency as string) || 'ILS';

  // Get custom domain or construct URL
  const baseUrl = store.customDomain ? `https://${store.customDomain}` : `https://my-quickshop.com/shops/${slug}`;

  // Get all active products with images and variants
  const allProducts = await db.query.products.findMany({
    where: and(
      eq(products.storeId, store.id),
      eq(products.isActive, true)
    ),
    with: {
      images: {
        orderBy: [asc(productImages.sortOrder)],
      },
      variants: {
        where: eq(productVariants.isActive, true),
        orderBy: [asc(productVariants.sortOrder)],
      },
      category: true,
    },
  });

  // Build XML feed
  const items = allProducts.flatMap(product => {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
    const additionalImages = product.images.filter(img => img.id !== primaryImage?.id).slice(0, 9);
    const category = product.category;

    // Extract custom fields from metadata (for all entries)
    const productMetadata = (product.metadata as Record<string, unknown>) || {};
    const productCustomFieldsXml = buildCustomFieldsXml(productMetadata, 2); // Start from label 2 since 0,1 used for options

    // If product has variants, create item for each variant
    if (product.hasVariants && product.variants.length > 0) {
      return product.variants.map(variant => {
        const variantImage = variant.imageUrl || primaryImage?.url;
        const price = parseFloat(variant.price);
        const comparePrice = variant.comparePrice ? parseFloat(variant.comparePrice) : null;
        const availability = (variant.inventory ?? 0) > 0 || variant.allowBackorder ? 'in stock' : 'out of stock';

        return `    <item>
      <g:id>${escapeXml(variant.id)}</g:id>
      <g:item_group_id>${escapeXml(product.id)}</g:item_group_id>
      <g:title>${escapeXml(product.name + ' - ' + variant.title)}</g:title>
      <g:description>${escapeXml(product.description || product.shortDescription || product.name)}</g:description>
      <g:link>${baseUrl}/product/${product.slug}?variant=${variant.id}</g:link>
      <g:image_link>${escapeXml(variantImage || '')}</g:image_link>
${additionalImages.map(img => `      <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>`).join('\n')}
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} ${currency}</g:price>
${comparePrice && comparePrice > price ? `      <g:sale_price>${price.toFixed(2)} ${currency}</g:sale_price>` : ''}
      <g:brand>${escapeXml(store.name)}</g:brand>
      <g:condition>new</g:condition>
${variant.sku ? `      <g:mpn>${escapeXml(variant.sku)}</g:mpn>` : ''}
${variant.barcode ? `      <g:gtin>${escapeXml(variant.barcode)}</g:gtin>` : ''}
${category ? `      <g:google_product_category>${escapeXml(category.name)}</g:google_product_category>` : ''}
${variant.option1 ? `      <g:custom_label_0>${escapeXml(variant.option1)}</g:custom_label_0>` : ''}
${variant.option2 ? `      <g:custom_label_1>${escapeXml(variant.option2)}</g:custom_label_1>` : ''}
${productCustomFieldsXml}
    </item>`;
      });
    }

    // Single product without variants
    const price = product.price ? parseFloat(product.price) : 0;
    const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
    const inventory = product.inventory ?? 0;
    const availability = inventory > 0 || product.allowBackorder ? 'in stock' : 'out of stock';
    
    // Extract custom fields from metadata (start from 0 for non-variant products)
    const metadata = (product.metadata as Record<string, unknown>) || {};
    const customFieldsXml = buildCustomFieldsXml(metadata, 0);

    return `    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(product.description || product.shortDescription || product.name)}</g:description>
      <g:link>${baseUrl}/product/${product.slug}</g:link>
      <g:image_link>${escapeXml(primaryImage?.url || '')}</g:image_link>
${additionalImages.map(img => `      <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>`).join('\n')}
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} ${currency}</g:price>
${comparePrice && comparePrice > price ? `      <g:sale_price>${price.toFixed(2)} ${currency}</g:sale_price>` : ''}
      <g:brand>${escapeXml(store.name)}</g:brand>
      <g:condition>new</g:condition>
${product.sku ? `      <g:mpn>${escapeXml(product.sku)}</g:mpn>` : ''}
${product.barcode ? `      <g:gtin>${escapeXml(product.barcode)}</g:gtin>` : ''}
${category ? `      <g:google_product_category>${escapeXml(category.name)}</g:google_product_category>` : ''}
${customFieldsXml}
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(store.name)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(store.name + ' - קטלוג מוצרים')}</description>
${items.join('\n')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); // Remove invalid XML characters
}

// Build custom fields XML from product metadata
// Facebook supports custom_label_0 through custom_label_4
function buildCustomFieldsXml(metadata: Record<string, unknown>, startIndex: number = 0): string {
  if (!metadata || typeof metadata !== 'object') return '';
  
  const customFields = metadata.customFields as Record<string, string> | undefined;
  if (!customFields || typeof customFields !== 'object') return '';
  
  const entries = Object.entries(customFields);
  if (entries.length === 0) return '';
  
  // Map custom fields to custom_label_X (max 5 total, respecting startIndex)
  const maxLabels = 5 - startIndex;
  return entries
    .slice(0, maxLabels)
    .map(([key, value], index) => {
      if (!value) return '';
      // Include the key name in the value for context
      const labelValue = `${key}: ${String(value)}`;
      return `      <g:custom_label_${startIndex + index}>${escapeXml(labelValue)}</g:custom_label_${startIndex + index}>`;
    })
    .filter(Boolean)
    .join('\n');
}

