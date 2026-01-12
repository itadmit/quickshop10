import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, products, productImages, productVariants } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// Google Merchant Center Feed (XML)
// Documentation: https://support.google.com/merchants/answer/7052112

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

  // Build XML feed entries
  const entries = allProducts.flatMap(product => {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
    const additionalImages = product.images.filter(img => img.id !== primaryImage?.id).slice(0, 9);
    const category = product.category;

    // Extract custom fields from metadata (for all entries)
    const productMetadata = (product.metadata as Record<string, unknown>) || {};
    const productCustomFieldsXml = buildCustomFieldsXml(productMetadata);

    // If product has variants, create entry for each variant
    if (product.hasVariants && product.variants.length > 0) {
      return product.variants.map(variant => {
        const variantImage = variant.imageUrl || primaryImage?.url;
        const price = parseFloat(variant.price);
        const comparePrice = variant.comparePrice ? parseFloat(variant.comparePrice) : null;
        const availability = (variant.inventory ?? 0) > 0 || variant.allowBackorder ? 'in_stock' : 'out_of_stock';

        return `    <entry>
      <g:id>${escapeXml(variant.id)}</g:id>
      <g:item_group_id>${escapeXml(product.id)}</g:item_group_id>
      <title>${escapeXml(product.name + ' - ' + variant.title)}</title>
      <g:description>${escapeXml(stripHtml(product.description || product.shortDescription || product.name))}</g:description>
      <link>${baseUrl}/product/${product.slug}?variant=${variant.id}</link>
      <g:image_link>${escapeXml(variantImage || '')}</g:image_link>
${additionalImages.map(img => `      <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>`).join('\n')}
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} ${currency}</g:price>
${comparePrice && comparePrice > price ? `      <g:sale_price>${price.toFixed(2)} ${currency}</g:sale_price>` : ''}
      <g:brand>${escapeXml(store.name)}</g:brand>
      <g:condition>new</g:condition>
${variant.sku ? `      <g:mpn>${escapeXml(variant.sku)}</g:mpn>` : ''}
${variant.barcode ? `      <g:gtin>${escapeXml(variant.barcode)}</g:gtin>` : ''}
${category ? `      <g:product_type>${escapeXml(category.name)}</g:product_type>` : ''}
${variant.weight ? `      <g:shipping_weight>${variant.weight} kg</g:shipping_weight>` : ''}
${variant.option1 ? `      <g:size>${escapeXml(variant.option1)}</g:size>` : ''}
${variant.option2 ? `      <g:color>${escapeXml(variant.option2)}</g:color>` : ''}
${productCustomFieldsXml}
    </entry>`;
      });
    }

    // Single product without variants
    const price = product.price ? parseFloat(product.price) : 0;
    const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
    const inventory = product.inventory ?? 0;
    const availability = inventory > 0 || product.allowBackorder ? 'in_stock' : 'out_of_stock';
    
    // Extract custom fields from metadata
    const metadata = (product.metadata as Record<string, unknown>) || {};
    const customFieldsXml = buildCustomFieldsXml(metadata);

    return `    <entry>
      <g:id>${escapeXml(product.id)}</g:id>
      <title>${escapeXml(product.name)}</title>
      <g:description>${escapeXml(stripHtml(product.description || product.shortDescription || product.name))}</g:description>
      <link>${baseUrl}/product/${product.slug}</link>
      <g:image_link>${escapeXml(primaryImage?.url || '')}</g:image_link>
${additionalImages.map(img => `      <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>`).join('\n')}
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} ${currency}</g:price>
${comparePrice && comparePrice > price ? `      <g:sale_price>${price.toFixed(2)} ${currency}</g:sale_price>` : ''}
      <g:brand>${escapeXml(store.name)}</g:brand>
      <g:condition>new</g:condition>
${product.sku ? `      <g:mpn>${escapeXml(product.sku)}</g:mpn>` : ''}
${product.barcode ? `      <g:gtin>${escapeXml(product.barcode)}</g:gtin>` : ''}
${category ? `      <g:product_type>${escapeXml(category.name)}</g:product_type>` : ''}
${product.weight ? `      <g:shipping_weight>${product.weight} kg</g:shipping_weight>` : ''}
${customFieldsXml}
    </entry>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>${escapeXml(store.name)}</title>
  <link href="${baseUrl}" rel="alternate" type="text/html"/>
  <updated>${new Date().toISOString()}</updated>
  <author>
    <name>${escapeXml(store.name)}</name>
  </author>
  <id>${baseUrl}</id>
${entries.join('\n')}
</feed>`;

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

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 5000); // Google has description length limit
}

// Build custom fields XML from product metadata
// Google supports custom_label_0 through custom_label_4
function buildCustomFieldsXml(metadata: Record<string, unknown>): string {
  if (!metadata || typeof metadata !== 'object') return '';
  
  const customFields = metadata.customFields as Record<string, string> | undefined;
  if (!customFields || typeof customFields !== 'object') return '';
  
  const entries = Object.entries(customFields);
  if (entries.length === 0) return '';
  
  // Map custom fields to Google's custom_label_0 through custom_label_4
  return entries
    .slice(0, 5) // Google supports max 5 custom labels
    .map(([key, value], index) => {
      if (!value) return '';
      // Include the key name in the value for context
      const labelValue = `${key}: ${String(value)}`;
      return `      <g:custom_label_${index}>${escapeXml(labelValue)}</g:custom_label_${index}>`;
    })
    .filter(Boolean)
    .join('\n');
}

