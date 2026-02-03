/**
 * Script to add line breaks after periods in product descriptions
 * for store "yehonatan"
 * 
 * Run: npx tsx scripts/fix-yehonatan-line-breaks.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { products, stores } from '../src/lib/db/schema';

// Function to add line breaks after sentences
function addLineBreaks(text: string | null): string | null {
  if (!text) return text;
  
  let result = text;
  
  // Add newline after period followed by space and a letter (Hebrew or English)
  // But NOT after numbers like "1." or "2."
  // Pattern: period + space + letter (not a digit before the period)
  result = result.replace(/([^\d])\. /g, '$1.\n');
  
  // Also handle period followed directly by Hebrew letter (no space)
  result = result.replace(/\.([א-ת])/g, '.\n$1');
  
  // Clean up: remove multiple consecutive newlines
  result = result.replace(/\n{2,}/g, '\n');
  
  // Trim
  result = result.trim();
  
  return result;
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

    // 3. Fix line breaks in each product
    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of storeProducts) {
      const fixedDescription = addLineBreaks(product.description);
      const fixedShortDescription = addLineBreaks(product.shortDescription);
      
      // Check if anything changed
      const descriptionChanged = fixedDescription !== product.description;
      const shortDescriptionChanged = fixedShortDescription !== product.shortDescription;
      
      if (descriptionChanged || shortDescriptionChanged) {
        console.log(`\n🔧 מעדכן מוצר: ${product.name}`);
        
        if (descriptionChanged && product.description) {
          console.log(`   תיאור לפני: "${product.description.substring(0, 80)}..."`);
          console.log(`   תיאור אחרי: "${fixedDescription?.substring(0, 80)}..."`);
        }
        
        if (shortDescriptionChanged && product.shortDescription) {
          console.log(`   תיאור קצר לפני: "${product.shortDescription.substring(0, 80)}..."`);
          console.log(`   תיאור קצר אחרי: "${fixedShortDescription?.substring(0, 80)}..."`);
        }
        
        // Update the product
        await db
          .update(products)
          .set({
            description: fixedDescription,
            shortDescription: fixedShortDescription,
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
