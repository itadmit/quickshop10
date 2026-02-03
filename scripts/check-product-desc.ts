/**
 * Check product description for embed tags
 * Run: npx tsx scripts/check-product-desc.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, like, or } from 'drizzle-orm';
import { products, stores } from '../src/lib/db/schema';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  const client = neon(databaseUrl);
  const db = drizzle(client);

  // Find the store
  const [store] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.slug, 'yehonatan'));
  
  if (!store) {
    console.error('Store not found');
    process.exit(1);
  }

  // Find products with embed in description
  const prods = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      shortDescription: products.shortDescription,
    })
    .from(products)
    .where(eq(products.storeId, store.id));
  
  // Filter for products with embed
  const embedProducts = prods.filter(p => 
    p.description?.includes('embed') || 
    p.shortDescription?.includes('embed') ||
    p.description?.includes('youtube') ||
    p.shortDescription?.includes('youtube')
  );

  console.log(`Found ${embedProducts.length} products with embed/youtube:\n`);
  
  for (const p of embedProducts) {
    console.log(`=== ${p.name} ===`);
    console.log(`Description: ${p.description?.substring(0, 500)}`);
    console.log(`Short Description: ${p.shortDescription}`);
    console.log('');
  }
}

main();
