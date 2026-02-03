/**
 * Script to clean product descriptions for store "yehonatan"
 * Removes HTML tags, \n characters, and excessive whitespace
 * 
 * Run: npx tsx scripts/clean-yehonatan-descriptions.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { products, stores } from '../src/lib/db/schema';

// Function to clean text from HTML while preserving line breaks structure
function cleanDescription(text: string | null): string | null {
  if (!text) return text;
  
  let cleaned = text;
  
  // 1. Replace block-level HTML tags with newlines (preserve paragraph structure)
  // These tags create visual line breaks
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<\/p>/gi, '\n\n');
  cleaned = cleaned.replace(/<p[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/div>/gi, '\n');
  cleaned = cleaned.replace(/<div[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/h[1-6]>/gi, '\n\n');
  cleaned = cleaned.replace(/<h[1-6][^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/li>/gi, '\n');
  cleaned = cleaned.replace(/<li[^>]*>/gi, '• '); // Add bullet for list items
  cleaned = cleaned.replace(/<\/?[ou]l[^>]*>/gi, '\n');
  cleaned = cleaned.replace(/<\/tr>/gi, '\n');
  cleaned = cleaned.replace(/<\/td>/gi, ' | ');
  cleaned = cleaned.replace(/<\/th>/gi, ' | ');
  
  // 2. Remove all remaining HTML tags (inline elements like span, a, strong, etc.)
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // 3. Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&#x[0-9a-fA-F]+;/g, '') // Remove hex entities like emoji codes
    .replace(/&#\d+;/g, ''); // Remove remaining numeric entities
  
  // 4. Replace literal \n strings (when stored as "\\n" in the text) with actual newlines
  cleaned = cleaned.replace(/\\n/g, '\n');
  
  // 5. Replace tabs with spaces
  cleaned = cleaned.replace(/\t/g, ' ');
  
  // 6. Clean up excessive whitespace on each line (but preserve newlines)
  cleaned = cleaned
    .split('\n')
    .map(line => line.replace(/\s{2,}/g, ' ').trim())
    .join('\n');
  
  // 7. Remove more than 2 consecutive newlines (keep max 2 for paragraph breaks)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // 8. Remove empty lines at start and end, trim overall
  cleaned = cleaned.trim();
  
  return cleaned;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('🔌 מתחבר למסד נתונים...');
  const client = neon(databaseUrl);
  const db = drizzle(client);

  try {
    // 1. Find the store "yehonatan"
    console.log('🔍 מחפש את החנות yehonatan...');
    const [store] = await db
      .select({ id: stores.id, name: stores.name, slug: stores.slug })
      .from(stores)
      .where(eq(stores.slug, 'yehonatan'));
    
    if (!store) {
      console.error('❌ לא נמצאה חנות עם slug "yehonatan"');
      process.exit(1);
    }
    
    console.log(`✅ נמצאה חנות: ${store.name} (ID: ${store.id})`);

    // 2. Get all products for this store
    console.log('📦 שולף מוצרים...');
    const storeProducts = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        shortDescription: products.shortDescription,
      })
      .from(products)
      .where(eq(products.storeId, store.id));
    
    console.log(`📦 נמצאו ${storeProducts.length} מוצרים`);

    // 3. Clean and update each product
    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of storeProducts) {
      const cleanedDescription = cleanDescription(product.description);
      const cleanedShortDescription = cleanDescription(product.shortDescription);
      
      // Check if anything changed
      const descriptionChanged = cleanedDescription !== product.description;
      const shortDescriptionChanged = cleanedShortDescription !== product.shortDescription;
      
      if (descriptionChanged || shortDescriptionChanged) {
        console.log(`\n🔧 מעדכן מוצר: ${product.name}`);
        
        if (descriptionChanged) {
          console.log(`   תיאור לפני: "${product.description?.substring(0, 100)}..."`);
          console.log(`   תיאור אחרי: "${cleanedDescription?.substring(0, 100)}..."`);
        }
        
        if (shortDescriptionChanged) {
          console.log(`   תיאור קצר לפני: "${product.shortDescription}"`);
          console.log(`   תיאור קצר אחרי: "${cleanedShortDescription}"`);
        }
        
        // Update the product
        await db
          .update(products)
          .set({
            description: cleanedDescription,
            shortDescription: cleanedShortDescription,
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
        
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ סיום!`);
    console.log(`   מוצרים שעודכנו: ${updatedCount}`);
    console.log(`   מוצרים ללא שינוי: ${skippedCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ שגיאה:', error);
    process.exit(1);
  }
}

main();
