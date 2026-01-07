'use server';

/**
 * Product Import Server Actions
 * 
 * ⚡ Performance-optimized:
 * - Pre-fetch existing data in bulk (O(1) instead of O(n))
 * - Batch inserts for products, images, categories
 * - Minimal DB roundtrips
 * - User ID from session (no blocking call in page)
 * 
 * עכשיו עם מיפוי עמודות מפורש - המשתמש בוחר איזו עמודה מתאימה לאיזה שדה
 */

import { db } from '@/lib/db';
import { products, productImages, categories, productCategories } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  createdCategories: string[];
  totalInFile?: number;
  isTestMode?: boolean;
}

// מיפוי עמודות מפורש
export interface ColumnMapping {
  name: number;        // חובה
  description: number;
  price: number;       // חובה
  comparePrice: number;
  sku: number;
  inventory: number;
  categories: number;
  images: number;
}

// ============================================
// Cloudinary Upload from URL
// ============================================

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Upload image from external URL to Cloudinary
 * Converts to WebP automatically
 */
async function uploadImageFromUrl(
  imageUrl: string, 
  folder: string
): Promise<CloudinaryUploadResult | null> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      resource_type: 'image',
      format: 'webp',           // Convert to WebP
      quality: 'auto:good',     // Optimal quality
      fetch_format: 'auto',     // Auto detect best format
      transformation: [
        { width: 1200, crop: 'limit' }, // Max width 1200px
        { quality: 'auto:good' },
      ],
    });

    // Return optimized URL with f_auto,q_auto
    const optimizedUrl = result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
    
    return {
      public_id: result.public_id,
      secure_url: optimizedUrl,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error(`Failed to upload image from ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Delay helper - add pause between operations
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface CSVRow {
  rowNum: number;
  name: string;
  description: string;
  price: number;
  comparePrice: number;
  rawPrice?: string;  // For debugging
  sku: string;
  inventory: number;
  allowBackorder: boolean;
  isHidden: boolean;
  categories: string[];
  tags: string[];
  productType: string;
  images: string[];
  createdAt?: string;
}

/**
 * Generate URL-safe slug from text (supports Hebrew)
 * Keeps Hebrew and Latin characters, replaces spaces and special chars with -
 */
function generateSlug(text: string): string {
  let slug = text
    .trim()
    .toLowerCase()
    // Keep Hebrew (א-ת), Latin (a-z), numbers (0-9), spaces and existing dashes
    .replace(/[^a-zא-ת0-9\s-]/g, '')
    // Convert spaces to dashes
    .replace(/\s+/g, '-')
    // Remove multiple consecutive dashes
    .replace(/-+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-+|-+$/g, '');
  
  // Ensure minimum length
  if (slug.length >= 2) {
    return slug;
  }
  
  // Fallback: use timestamp-based slug
  return `product-${Date.now().toString(36)}`;
}

/**
 * Generate slug for category
 */
function generateCategorySlug(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-zא-ת0-9\s]/g, '')
    .replace(/\s+/g, '-');
  
  return slug || `cat-${Date.now().toString(36)}`;
}

/**
 * Normalize column name for matching
 */
function normalizeColumnName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/[״"']/g, '') // Remove quotes
    .normalize('NFC');      // Normalize unicode
}

/**
 * Find column index by trying multiple variations
 */
function findColumnIndex(
  columnMap: Map<string, number>,
  ...names: string[]
): number {
  for (const name of names) {
    const normalized = normalizeColumnName(name);
    const index = columnMap.get(normalized);
    if (index !== undefined) return index;
  }
  return -1;
}

/**
 * Parse price - handles comma/dot decimal separator
 */
function parsePrice(value: string): number {
  if (!value) return 0;
  // Remove currency symbols, spaces, and normalize decimal
  const cleaned = value
    .replace(/[₪$€\s]/g, '')
    .replace(',', '.');  // Handle comma decimal separator
  return parseFloat(cleaned) || 0;
}

interface ParseDebugInfo {
  foundColumns: string[];
  missingColumns: string[];
  priceColumnIndex: number;
  nameColumnIndex: number;
  firstRowSample: string[];
}

/**
 * Full CSV Parser - handles:
 * - Multi-line fields (newlines inside quotes)
 * - Escaped quotes ("")
 * - Hebrew text
 * - Empty fields
 * 
 * Returns array of rows, each row is array of field values
 */
function parseCSVFull(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  // Remove BOM if present
  const text = csvText.replace(/^\uFEFF/, '');
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote "" -> add single "
          currentField += '"';
          i++; // Skip next quote
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        // Any char inside quotes (including newlines)
        currentField += char;
      }
    } else {
      // Not in quotes
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        // Row separator
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        // Skip \r\n combo
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }
  }
  
  // Don't forget last field and row
  currentRow.push(currentField);
  if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
    rows.push(currentRow);
  }
  
  return rows;
}

/**
 * Legacy function - Split CSV text into lines (for backward compatibility)
 * @deprecated Use parseCSVFull instead
 */
function splitCSVLines(csvText: string): string[] {
  // Use the new parser and return raw lines (first pass only for line splitting)
  const rows = parseCSVFull(csvText);
  // Return original format by joining back - but this loses the benefit
  // Better to use parseCSVFull directly
  return rows.map(row => row.join(','));
}

/**
 * Parse CSV string into rows with debug info
 */
function parseCSVWithDebug(csvText: string): { rows: CSVRow[]; debug: ParseDebugInfo } {
  const debug: ParseDebugInfo = {
    foundColumns: [],
    missingColumns: [],
    priceColumnIndex: -1,
    nameColumnIndex: -1,
    firstRowSample: [],
  };

  // Remove BOM (Byte Order Mark) if present
  const cleanedText = csvText.replace(/^\uFEFF/, '');
  
  // Split into lines respecting quoted fields
  const lines = splitCSVLines(cleanedText);
  if (lines.length < 2) return { rows: [], debug };

  // Parse header
  const header = parseCSVLine(lines[0]);
  const columnMap = new Map<string, number>();
  
  header.forEach((col, index) => {
    const normalized = normalizeColumnName(col);
    columnMap.set(normalized, index);
    debug.foundColumns.push(`"${col}" (index: ${index})`);
  });

  // Debug: log found columns
  console.log('CSV Columns found:', Array.from(columnMap.keys()));

  // Map column names - try multiple variations (order matters - first match wins)
  const colIndex = {
    name: findColumnIndex(columnMap, 'שם מוצר', 'שם', 'סלאג', 'name', 'title'),
    description: findColumnIndex(columnMap, 'תיאור', 'description'),
    price: findColumnIndex(columnMap, 'מחיר רגיל', 'מחיר', 'price'),
    comparePrice: findColumnIndex(columnMap, 'מחיר מבצע', 'מחיר השוואה', 'compare price', 'sale price'),
    sku: findColumnIndex(columnMap, 'מקט', 'מק"ט', 'sku', 'barcode'),
    inventory: findColumnIndex(columnMap, 'כמות במלאי', 'מלאי', 'כמות', 'inventory', 'stock'),
    allowBackorder: findColumnIndex(columnMap, 'התעלם ממלאי', 'backorder'),
    isHidden: findColumnIndex(columnMap, 'מוסתר', 'טיוטה', 'hidden', 'draft'),
    categories: findColumnIndex(columnMap, 'קטגוריות', 'קטגוריה', 'categories', 'category'),
    tags: findColumnIndex(columnMap, 'תגים', 'תגיות', 'tags'),
    productType: findColumnIndex(columnMap, 'סוג מוצר', 'סוג', 'type'),
    images: findColumnIndex(columnMap, 'תמונה ראשית', 'תמונות', 'תמונה', 'images', 'image'),
    createdAt: findColumnIndex(columnMap, 'תאריך יצירה', 'תאריך', 'created'),
  };

  // Update debug info
  debug.priceColumnIndex = colIndex.price;
  debug.nameColumnIndex = colIndex.name;
  
  // Check missing columns
  if (colIndex.name === -1) debug.missingColumns.push('סלאג/שם');
  if (colIndex.price === -1) debug.missingColumns.push('מחיר רגיל');
  if (colIndex.description === -1) debug.missingColumns.push('תיאור');

  // Debug: log column indices
  console.log('Column indices:', colIndex);

  // Parse first data row for debug
  if (lines.length > 1) {
    debug.firstRowSample = parseCSVLine(lines[1]);
  }

  // Parse rows
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    
    const getValue = (index: number): string => {
      if (index < 0 || index >= values.length) return '';
      return values[index]?.trim() || '';
    };

    const name = getValue(colIndex.name);
    if (!name) continue;

    const priceValue = getValue(colIndex.price);
    const comparePriceValue = getValue(colIndex.comparePrice);
    
    rows.push({
      rowNum: i + 1,
      name,
      description: getValue(colIndex.description),
      price: parsePrice(priceValue),
      comparePrice: parsePrice(comparePriceValue),
      rawPrice: priceValue, // Keep for debugging
      sku: getValue(colIndex.sku),
      inventory: parseInt(getValue(colIndex.inventory)) || 0,
      allowBackorder: ['כן', 'yes', 'true', '1'].includes(getValue(colIndex.allowBackorder).toLowerCase()),
      isHidden: ['כן', 'yes', 'true', '1'].includes(getValue(colIndex.isHidden).toLowerCase()),
      categories: getValue(colIndex.categories)
        .split(',')
        .map(c => c.trim())
        .filter(Boolean),
      tags: getValue(colIndex.tags)
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      productType: getValue(colIndex.productType),
      images: getValue(colIndex.images)
        .split(',')
        .map(img => img.trim())
        .filter(Boolean),
      createdAt: getValue(colIndex.createdAt),
    });
  }

  return { rows, debug };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Main import function - Optimized for performance
 * @param limit - Optional limit for test mode (e.g., 3 for testing)
 */
export async function importProductsFromCSV(
  storeId: string,
  storeSlug: string,
  csvText: string,
  imagePrefix: string,
  limit?: number
): Promise<ImportResult> {
  // Get user from session (inside server action)
  const user = await getCurrentUser();
  const userId = user?.id || null;
  const errors: string[] = [];
  const createdCategoryNames: string[] = [];
  let imported = 0;
  let failed = 0;

  try {
    // ============================================
    // STEP 1: Parse CSV
    // ============================================
    const { rows: parsedRows, debug } = parseCSVWithDebug(csvText);
    let rows = parsedRows;
    
    if (rows.length === 0) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [
          'הקובץ ריק או לא בפורמט נכון',
          `עמודות שנמצאו: ${debug.foundColumns.join(', ')}`,
          `עמודות שחסרות: ${debug.missingColumns.join(', ') || 'אין'}`,
        ],
        createdCategories: [],
      };
    }
    
    // Add debug info if price column wasn't found
    if (debug.priceColumnIndex === -1) {
      errors.push(`אזהרה: עמודת "מחיר רגיל" לא נמצאה! עמודות שנמצאו: ${debug.foundColumns.join(', ')}`);
    }

    // Apply limit for test mode
    const totalInFile = rows.length;
    if (limit && limit > 0) {
      rows = rows.slice(0, limit);
    }

    // ============================================
    // STEP 2: Pre-fetch existing data (ONE query each)
    // ============================================
    
    // Get all unique category names from CSV
    const allCategoryNames = [...new Set(rows.flatMap(r => r.categories))];
    
    // Fetch existing categories in ONE query
    const existingCategories = allCategoryNames.length > 0
      ? await db
          .select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(and(
            eq(categories.storeId, storeId),
            inArray(categories.name, allCategoryNames)
          ))
      : [];
    
    const categoryMap = new Map(existingCategories.map(c => [c.name, c.id]));

    // Fetch existing slugs in ONE query
    const existingSlugs = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.storeId, storeId));
    
    const slugSet = new Set(existingSlugs.map(p => p.slug));

    // ============================================
    // STEP 3: Create missing categories (BATCH)
    // ============================================
    const missingCategories = allCategoryNames.filter(name => !categoryMap.has(name));
    
    if (missingCategories.length > 0) {
      const newCategories = await db
        .insert(categories)
        .values(missingCategories.map((name, i) => ({
          storeId,
          name,
          slug: `${generateCategorySlug(name)}-${Date.now().toString(36).slice(-4)}-${i}`,
          isActive: true,
        })))
        .returning({ id: categories.id, name: categories.name });
      
      // Add to map
      newCategories.forEach(c => {
        categoryMap.set(c.name, c.id);
        createdCategoryNames.push(c.name);
      });
    }

    // ============================================
    // STEP 4: Prepare and validate products
    // ============================================
    interface PreparedProduct {
      row: CSVRow;
      slug: string;
      categoryIds: string[];
      primaryCategoryId: string | null;
      forceAsDraft: boolean;
    }

    const preparedProducts: PreparedProduct[] = [];
    const usedSlugs = new Set(slugSet);

    for (const row of rows) {
      // Validate required fields
      if (!row.name) {
        errors.push(`שורה ${row.rowNum}: חסר שם מוצר`);
        failed++;
        continue;
      }

      // If price is 0 or negative, mark as draft but continue importing
      let forceAsDraft = false;
      if (row.price <= 0) {
        forceAsDraft = true;
        row.price = 0; // Ensure it's 0, not negative
      }

      // Generate unique slug
      let slug = generateSlug(row.name);
      let counter = 0;
      while (usedSlugs.has(slug)) {
        counter++;
        slug = `${generateSlug(row.name)}-${counter}`;
      }
      usedSlugs.add(slug);

      // Get category IDs
      const categoryIds = row.categories
        .map(name => categoryMap.get(name))
        .filter((id): id is string => id !== undefined);

      preparedProducts.push({
        row,
        slug,
        categoryIds,
        primaryCategoryId: categoryIds[0] || null,
        forceAsDraft,
      });
    }

    if (preparedProducts.length === 0) {
      return {
        success: false,
        imported: 0,
        failed,
        errors,
        createdCategories: createdCategoryNames,
      };
    }

    // ============================================
    // STEP 5: Batch insert products
    // ============================================
    // 
    // מיפוי מחירים:
    // במערכת הישנה: מחיר רגיל = מקורי, מחיר מבצע = מוזל
    // אצלנו: price = נוכחי/מוזל, comparePrice = מקורי (מחוק)
    //
    const insertedProducts = await db
      .insert(products)
      .values(preparedProducts.map(p => {
        // לוגיקת מחירים:
        // - מחיר רגיל (row.price) = המחיר הגבוה/המקורי
        // - מחיר מבצע (row.comparePrice) = המחיר הנמוך/מבצע (אם 0 = אין מבצע)
        
        let finalPrice: number;
        let finalComparePrice: number | null = null;
        
        if (p.row.comparePrice > 0 && p.row.comparePrice < p.row.price) {
          // יש מבצע: מחיר מבצע קיים וקטן מהמחיר הרגיל
          finalPrice = p.row.comparePrice;        // המחיר הנמוך הוא המחיר הנוכחי
          finalComparePrice = p.row.price;        // המחיר הגבוה הוא להשוואה (קו חוצה)
        } else if (p.row.price > 0) {
          // אין מבצע: רק מחיר רגיל
          finalPrice = p.row.price;
          finalComparePrice = null;
        } else if (p.row.comparePrice > 0) {
          // מחיר רגיל = 0 אבל יש מחיר מבצע - נשתמש בו
          finalPrice = p.row.comparePrice;
          finalComparePrice = null;
        } else {
          // שני המחירים 0 - נגדיר מחיר 0 (המוצר יהיה טיוטה)
          finalPrice = 0;
          finalComparePrice = null;
        }
        
        return {
          storeId,
          categoryId: p.primaryCategoryId,
          name: p.row.name,
          slug: p.slug,
          description: p.row.description || null,
          price: finalPrice.toString(),
          comparePrice: finalComparePrice ? finalComparePrice.toString() : null,
          sku: p.row.sku || null,
          inventory: p.row.inventory,
          trackInventory: true,
          allowBackorder: p.row.allowBackorder,
          isActive: !p.row.isHidden && !p.forceAsDraft, // טיוטה אם מוסתר או מחיר 0
          hasVariants: false,
          metadata: {
            tags: p.row.tags.length > 0 ? p.row.tags : undefined,
            productType: p.row.productType || undefined,
            importedAt: new Date().toISOString(),
          },
          createdBy: userId,
          updatedBy: userId,
        };
      }))
      .returning({ id: products.id });

    // ============================================
    // STEP 6: Batch insert product-category relations
    // ============================================
    const productCategoryValues: { productId: string; categoryId: string; sortOrder: number }[] = [];
    
    preparedProducts.forEach((p, productIndex) => {
      p.categoryIds.forEach((categoryId, catIndex) => {
        productCategoryValues.push({
          productId: insertedProducts[productIndex].id,
          categoryId,
          sortOrder: catIndex,
        });
      });
    });

    if (productCategoryValues.length > 0) {
      await db.insert(productCategories).values(productCategoryValues);
    }

    // ============================================
    // STEP 7: Batch insert product images
    // ============================================
    const imageValues: { productId: string; url: string; alt: string; sortOrder: number; isPrimary: boolean }[] = [];
    
    preparedProducts.forEach((p, productIndex) => {
      p.row.images.forEach((img, imgIndex) => {
        imageValues.push({
          productId: insertedProducts[productIndex].id,
          url: imagePrefix + img,
          alt: p.row.name,
          sortOrder: imgIndex,
          isPrimary: imgIndex === 0,
        });
      });
    });

    if (imageValues.length > 0) {
      await db.insert(productImages).values(imageValues);
    }

    imported = insertedProducts.length;

    // Revalidate products page
    revalidatePath(`/shops/${storeSlug}/admin/products`);

    return {
      success: imported > 0,
      imported,
      failed,
      errors,
      createdCategories: createdCategoryNames,
      totalInFile,
      isTestMode: limit !== undefined && limit > 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'שגיאה בעיבוד הקובץ';
    return {
      success: false,
      imported,
      failed: failed || 1,
      errors: [...errors, errorMessage],
      createdCategories: createdCategoryNames,
      isTestMode: limit !== undefined && limit > 0,
    };
  }
}

// ============================================
// NEW: Import with Explicit Column Mapping
// ============================================

/**
 * Parse CSV with explicit column mapping
 * פשוט יותר ואמין יותר - המשתמש בוחר את העמודות
 */
export async function importProductsWithMapping(
  storeId: string,
  storeSlug: string,
  csvText: string,
  mapping: ColumnMapping,
  imagePrefix: string,
  limit?: number
): Promise<ImportResult> {
  const user = await getCurrentUser();
  const userId = user?.id || null;
  const errors: string[] = [];
  const createdCategoryNames: string[] = [];
  let imported = 0;
  let failed = 0;

  try {
    // ============================================
    // STEP 1: Parse CSV with new robust parser
    // ============================================
    const allRows = parseCSVFull(csvText);
    
    if (allRows.length < 2) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: ['הקובץ ריק או לא בפורמט נכון'],
        createdCategories: [],
      };
    }

    // First row is header, rest is data
    const headerRow = allRows[0];
    const totalInFile = allRows.length - 1;
    const dataRows = limit && limit > 0 
      ? allRows.slice(1, limit + 1) 
      : allRows.slice(1);

    // Debug log
    console.log('[Import] CSV Parsed:', {
      headerColumns: headerRow.length,
      header: headerRow,
      totalDataRows: totalInFile,
      processingRows: dataRows.length,
      mappingUsed: mapping,
    });

    // ============================================
    // STEP 2: Parse rows with mapping
    // ============================================
    interface ParsedRow {
      rowNum: number;
      name: string;
      description: string;
      price: number;
      comparePrice: number;
      sku: string;
      inventory: number;
      categories: string[];
      images: string[];
    }

    const rows: ParsedRow[] = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const values = dataRows[i];
      const rowNum = i + 2; // +2 because 1-indexed and skip header
      
      const getValue = (colIndex: number): string => {
        if (colIndex < 0 || colIndex >= values.length) return '';
        return values[colIndex]?.trim() || '';
      };

      const name = getValue(mapping.name);
      if (!name) {
        errors.push(`שורה ${rowNum}: חסר שם מוצר`);
        failed++;
        continue;
      }

      const priceStr = getValue(mapping.price);
      const price = parsePrice(priceStr);
      
      // מחיר מבצע - רק אם נבחרה עמודה וערך תקין
      const comparePriceStr = mapping.comparePrice >= 0 ? getValue(mapping.comparePrice) : '';
      const comparePrice = parsePrice(comparePriceStr);

      // Debug first row
      if (i === 0) {
        console.log('[Import] First row values:', {
          name: getValue(mapping.name),
          description: getValue(mapping.description)?.substring(0, 50),
          price: getValue(mapping.price),
          images: getValue(mapping.images),
          categories: getValue(mapping.categories),
        });
      }

      rows.push({
        rowNum,
        name,
        description: getValue(mapping.description),
        price,
        comparePrice,
        sku: getValue(mapping.sku),
        inventory: parseInt(getValue(mapping.inventory)) || 0,
        categories: mapping.categories >= 0 
          ? getValue(mapping.categories).split(',').map(c => c.trim()).filter(Boolean)
          : [],
        images: mapping.images >= 0
          ? getValue(mapping.images).split(',').map(img => img.trim()).filter(Boolean)
          : [],
      });
    }

    if (rows.length === 0) {
      return {
        success: false,
        imported: 0,
        failed,
        errors: errors.length > 0 ? errors : ['לא נמצאו שורות תקינות לייבוא'],
        createdCategories: [],
      };
    }

    // ============================================
    // STEP 3: Pre-fetch existing data
    // ============================================
    const allCategoryNames = [...new Set(rows.flatMap(r => r.categories))];
    
    const existingCategories = allCategoryNames.length > 0
      ? await db
          .select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(and(
            eq(categories.storeId, storeId),
            inArray(categories.name, allCategoryNames)
          ))
      : [];
    
    const categoryMap = new Map(existingCategories.map(c => [c.name, c.id]));

    const existingSlugs = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.storeId, storeId));
    
    const slugSet = new Set(existingSlugs.map(p => p.slug));

    // ============================================
    // STEP 4: Create missing categories
    // ============================================
    const missingCategories = allCategoryNames.filter(name => !categoryMap.has(name));
    
    if (missingCategories.length > 0) {
      const newCategories = await db
        .insert(categories)
        .values(missingCategories.map((name, i) => ({
          storeId,
          name,
          slug: `${generateCategorySlug(name)}-${Date.now().toString(36).slice(-4)}-${i}`,
          isActive: true,
        })))
        .returning({ id: categories.id, name: categories.name });
      
      newCategories.forEach(c => {
        categoryMap.set(c.name, c.id);
        createdCategoryNames.push(c.name);
      });
    }

    // ============================================
    // STEP 5: Prepare products
    // ============================================
    interface PreparedProduct {
      row: ParsedRow;
      slug: string;
      categoryIds: string[];
      primaryCategoryId: string | null;
    }

    const preparedProducts: PreparedProduct[] = [];
    const usedSlugs = new Set(slugSet);

    for (const row of rows) {
      // Generate unique slug
      let slug = generateSlug(row.name);
      let counter = 0;
      while (usedSlugs.has(slug)) {
        counter++;
        slug = `${generateSlug(row.name)}-${counter}`;
      }
      usedSlugs.add(slug);

      const categoryIds = row.categories
        .map(name => categoryMap.get(name))
        .filter((id): id is string => id !== undefined);

      preparedProducts.push({
        row,
        slug,
        categoryIds,
        primaryCategoryId: categoryIds[0] || null,
      });
    }

    // ============================================
    // STEP 6-8: Insert products ONE BY ONE with images
    // מעבד מוצר אחד בכל פעם כדי להוריד תמונות ל-Cloudinary
    // ============================================
    
    const storeFolder = `quickshop/stores/${storeSlug}/products`;
    const insertedProductIds: string[] = [];
    
    for (let i = 0; i < preparedProducts.length; i++) {
      const p = preparedProducts[i];
      
      try {
        // לוגיקת מחירים
        let finalPrice = p.row.price;
        let finalComparePrice: number | null = null;
        
        if (p.row.comparePrice > 0) {
          if (p.row.comparePrice < p.row.price) {
            finalPrice = p.row.comparePrice;
            finalComparePrice = p.row.price;
          }
        }
        
        // Insert product
        const [insertedProduct] = await db
          .insert(products)
          .values({
            storeId,
            categoryId: p.primaryCategoryId,
            name: p.row.name,
            slug: p.slug,
            description: p.row.description || null,
            price: finalPrice.toString(),
            comparePrice: finalComparePrice ? finalComparePrice.toString() : null,
            sku: p.row.sku || null,
            inventory: p.row.inventory,
            trackInventory: true,
            allowBackorder: false,
            isActive: finalPrice > 0,
            hasVariants: false,
            createdBy: userId,
            updatedBy: userId,
          })
          .returning({ id: products.id });
        
        insertedProductIds.push(insertedProduct.id);
        
        // Insert categories
        if (p.categoryIds.length > 0) {
          await db.insert(productCategories).values(
            p.categoryIds.map((categoryId, catIndex) => ({
              productId: insertedProduct.id,
              categoryId,
              sortOrder: catIndex,
            }))
          );
        }
        
        // Upload images to Cloudinary
        if (p.row.images.length > 0) {
          const imageInserts: { productId: string; url: string; alt: string; sortOrder: number; isPrimary: boolean }[] = [];
          
          for (let imgIndex = 0; imgIndex < p.row.images.length; imgIndex++) {
            const imgFilename = p.row.images[imgIndex].trim();
            if (!imgFilename) continue;
            
            const imageUrl = imagePrefix + imgFilename;
            
            // Upload to Cloudinary (converts to WebP)
            console.log(`[Import] Uploading image ${imgIndex + 1}/${p.row.images.length} for "${p.row.name}": ${imgFilename}`);
            const uploaded = await uploadImageFromUrl(imageUrl, storeFolder);
            
            if (uploaded) {
              imageInserts.push({
                productId: insertedProduct.id,
                url: uploaded.secure_url,
                alt: p.row.name,
                sortOrder: imgIndex,
                isPrimary: imgIndex === 0,
              });
            } else {
              // Fallback to original URL if upload fails
              errors.push(`שורה ${p.row.rowNum}: לא ניתן להעלות תמונה ${imgFilename}`);
              imageInserts.push({
                productId: insertedProduct.id,
                url: imageUrl,
                alt: p.row.name,
                sortOrder: imgIndex,
                isPrimary: imgIndex === 0,
              });
            }
            
            // Small delay between images
            if (imgIndex < p.row.images.length - 1) {
              await delay(200);
            }
          }
          
          if (imageInserts.length > 0) {
            await db.insert(productImages).values(imageInserts);
          }
        }
        
        imported++;
        console.log(`[Import] Completed ${imported}/${preparedProducts.length}: "${p.row.name}"`);
        
        // Delay between products to avoid overwhelming
        if (i < preparedProducts.length - 1) {
          await delay(500);
        }
        
      } catch (productError) {
        console.error(`[Import] Error importing "${p.row.name}":`, productError);
        errors.push(`שורה ${p.row.rowNum}: שגיאה - ${productError instanceof Error ? productError.message : 'Unknown error'}`);
        failed++;
      }
    }
    revalidatePath(`/shops/${storeSlug}/admin/products`);

    return {
      success: imported > 0,
      imported,
      failed,
      errors,
      createdCategories: createdCategoryNames,
      totalInFile,
      isTestMode: limit !== undefined && limit > 0,
    };
  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'שגיאה בעיבוד הקובץ';
    return {
      success: false,
      imported,
      failed: failed || 1,
      errors: [...errors, `Failed query: ${errorMessage}`],
      createdCategories: createdCategoryNames,
      isTestMode: limit !== undefined && limit > 0,
    };
  }
}
