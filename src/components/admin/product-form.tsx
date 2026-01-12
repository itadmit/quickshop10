'use client';

import { useState, useTransition, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Category, Product } from '@/lib/db/schema';
import { createProduct, updateProduct, ProductFormData } from '@/lib/actions/products';
import { MediaUploader, UploadedMedia } from '@/components/admin/media-uploader';
import { CategoryPicker, type CategoryNode } from '@/components/admin/category-picker';
import { RichTextEditor } from '@/components/admin/rich-text-editor';

// ProductImage type - compatible with UploadedMedia
interface ProductImage {
  id?: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  publicId?: string;
  filename?: string;
  size?: number;
  width?: number;
  height?: number;
  // Video support
  mediaType?: 'image' | 'video';
  thumbnailUrl?: string;
}

interface ProductOption {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

interface ProductVariant {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  comparePrice: string | null;
  inventory: number | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface UpsellProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: string | null;
}

interface StoreAddon {
  id: string;
  name: string;
  fieldType: 'text' | 'select' | 'checkbox' | 'radio' | 'date';
  priceAdjustment: number;
  options?: Array<{ label: string; value: string; priceAdjustment: number }>;
  isRequired: boolean;
}

// Metafield definition (from store settings)
interface MetafieldDefinition {
  id: string;
  name: string;
  key: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'url' | 'boolean';
  placeholder?: string;
  isRequired: boolean;
  isActive: boolean;
  showOnProduct: boolean;   // הצג בעמוד מוצר
  showInCheckout: boolean;  // הצג בצ'קאאוט ושמור בהזמנה
}

interface ProductFormProps {
  storeId: string;
  storeSlug: string;
  customDomain?: string | null;
  categories: Category[];
  allProducts?: UpsellProduct[]; // For upsell product selection
  storeAddons?: StoreAddon[]; // For addon assignment
  storeMetafields?: MetafieldDefinition[]; // For custom fields
  product?: Product & { 
    images?: { id: string; url: string; alt: string | null; isPrimary: boolean }[];
    options?: ProductOption[];
    variants?: ProductVariant[];
    categoryIds?: string[];
    upsellProductIds?: string[];
    addonIds?: string[];
    metadata?: Record<string, unknown>;
  };
  mode: 'create' | 'edit';
}

function slugify(text: string): string {
  return text
    .trim()
    // Replace spaces and common punctuation with dash
    .replace(/[\s\u200B-\u200D\uFEFF\u00A0\u2000-\u200A\u2028\u2029]+/g, '-') // All types of spaces
    .replace(/[.,;:!?()[\]{}'"`~@#$%^&*+=|\\<>\/]+/g, '-') // Punctuation marks
    // Remove control characters and other problematic characters, but keep Hebrew and other Unicode letters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Control characters
    // Clean up multiple dashes
    .replace(/-+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-+|-+$/g, '');
}

// Sanitize slug input - replace spaces with dashes
function sanitizeSlug(text: string): string {
  return text
    .replace(/\s+/g, '-') // Replace spaces with dash
    .replace(/-+/g, '-'); // Clean multiple dashes
}

export function ProductForm({ storeId, storeSlug, customDomain, categories, allProducts = [], storeAddons = [], storeMetafields = [], product, mode }: ProductFormProps) {
  // Build the store URL for SEO preview
  const storeUrl = customDomain || `my-quickshop.com/shops/${storeSlug}`;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Basic Info
  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [description, setDescription] = useState(product?.description || '');
  
  // Pricing
  const [price, setPrice] = useState(product?.price || '');
  const [comparePrice, setComparePrice] = useState(product?.comparePrice || '');
  const [cost, setCost] = useState(product?.cost || '');
  
  // Inventory
  const [sku, setSku] = useState(product?.sku || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [weight, setWeight] = useState(product?.weight || '');
  const [trackInventory, setTrackInventory] = useState(product?.trackInventory ?? true);
  const [inventory, setInventory] = useState(product?.inventory ?? 0);
  const [allowBackorder, setAllowBackorder] = useState(product?.allowBackorder ?? false);
  
  // Organization - now supports multiple categories
  const [categoryIds, setCategoryIds] = useState<string[]>(
    // Support old single categoryId + new multiple categories
    product?.categoryIds || (product?.categoryId ? [product.categoryId] : [])
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  
  // Upsell Products
  const [upsellProductIds, setUpsellProductIds] = useState<string[]>(
    (product?.upsellProductIds as string[] | undefined) || []
  );
  const [upsellSearch, setUpsellSearch] = useState('');
  const [showUpsellResults, setShowUpsellResults] = useState(false);
  
  // Product Addons
  const [addonIds, setAddonIds] = useState<string[]>(
    product?.addonIds || []
  );
  
  // Metafield Values (custom fields)
  const [metadataValues, setMetadataValues] = useState<Record<string, unknown>>(
    (product?.metadata as Record<string, unknown>) || {}
  );
  
  // SEO
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription || '');
  
  // Images - converted to UploadedMedia format for MediaUploader
  const [images, setImages] = useState<UploadedMedia[]>(
    product?.images?.map(img => ({ 
      id: img.id, 
      url: img.url, 
      filename: img.alt || 'image',
      size: 0,
      isPrimary: img.isPrimary 
    })) || []
  );

  // Variants
  const [hasVariants, setHasVariants] = useState(product?.hasVariants ?? false);
  
  // Option value with metadata
  type OptionValue = {
    value: string;
    metadata?: {
      color?: string;      // for color type
      pattern?: string;    // for pattern type (dots, stripes, etc.)
      imageUrl?: string;   // for image type
      images?: string[];   // gallery images for this value
    };
  };
  
  // Option with display type
  type ProductOptionForm = {
    name: string;
    displayType: 'button' | 'color' | 'pattern' | 'image';
    values: OptionValue[];
  };
  
  // Gallery per option state
  const [showValueGalleries, setShowValueGalleries] = useState(false);
  const [selectedGalleryOption, setSelectedGalleryOption] = useState<number | null>(null);
  
  // Variant expanded row state (to show extra fields)
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);
  
  // Bulk edit state
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkComparePrice, setBulkComparePrice] = useState('');
  const [bulkSku, setBulkSku] = useState('');
  const [bulkInventory, setBulkInventory] = useState('');
  
  // Apply bulk values to all variants
  const applyBulkToVariants = useCallback(() => {
    setVariants(prev => prev.map(v => ({
      ...v,
      price: bulkPrice || v.price,
      comparePrice: bulkComparePrice || v.comparePrice,
      sku: bulkSku || v.sku,
      inventory: bulkInventory ? parseInt(bulkInventory) || 0 : v.inventory,
    })));
    // Clear bulk fields after apply
    setBulkPrice('');
    setBulkComparePrice('');
    setBulkSku('');
    setBulkInventory('');
  }, [bulkPrice, bulkComparePrice, bulkSku, bulkInventory]);
  
  const [options, setOptions] = useState<ProductOptionForm[]>(
    product?.options?.map(opt => ({
      name: opt.name,
      displayType: (opt as { displayType?: string }).displayType as ProductOptionForm['displayType'] || 'button',
      values: opt.values.map(v => ({
        value: v.value,
        metadata: (v as { metadata?: OptionValue['metadata'] }).metadata || {},
      })),
    })) || []
  );
  const [variants, setVariants] = useState<{
    id?: string;
    title: string;
    sku: string;
    barcode: string;
    price: string;
    comparePrice: string;
    cost: string;
    weight: string;
    inventory: number;
    allowBackorder: boolean;
    option1?: string;
    option2?: string;
    option3?: string;
  }[]>(
    product?.variants?.map(v => ({
      id: v.id,
      title: v.title,
      sku: v.sku || '',
      barcode: (v as { barcode?: string }).barcode || '',
      price: v.price,
      comparePrice: v.comparePrice || '',
      cost: (v as { cost?: string }).cost || '',
      weight: (v as { weight?: string }).weight || '',
      inventory: v.inventory ?? 0,
      allowBackorder: (v as { allowBackorder?: boolean }).allowBackorder || false,
      option1: v.option1 || undefined,
      option2: v.option2 || undefined,
      option3: v.option3 || undefined,
    })) || []
  );

  // Auto-generate slug from name
  const handleNameChange = useCallback((value: string) => {
    setName(value);
    if (mode === 'create' || !product?.slug) {
      setSlug(slugify(value));
    }
  }, [mode, product?.slug]);

  // Image handling - now managed by MediaUploader component

  // Popular colors for auto-detection (Hebrew)
  const popularColors: Record<string, string> = {
    'שחור': '#000000', 'לבן': '#FFFFFF', 'אדום': '#FF0000', 'כחול': '#0000FF',
    'ירוק': '#008000', 'צהוב': '#FFFF00', 'כתום': '#FFA500', 'סגול': '#800080',
    'ורוד': '#FFC0CB', 'חום': '#8B4513', 'אפור': '#808080', 'זהב': '#FFD700',
    'כסף': '#C0C0C0', 'תכלת': '#87CEEB', 'שמנת': '#FFFDD0', 'בז\'': '#F5F5DC',
    'טורקיז': '#40E0D0', 'בורדו': '#800020', 'כחול נייבי': '#000080', 'חאקי': '#F0E68C',
  };
  
  const detectColorFromName = (name: string): string | null => {
    const lowerName = name.trim().toLowerCase();
    const colorKey = Object.keys(popularColors).find(key => key.toLowerCase() === lowerName);
    return colorKey ? popularColors[colorKey] : null;
  };
  
  // Generate CSS pattern background
  const getPatternCSS = (patternType: string, color: string): string => {
    switch (patternType) {
      case 'dots':
        return `radial-gradient(${color} 2px, transparent 2px), radial-gradient(${color} 2px, transparent 2px)`;
      case 'stripes':
        return `repeating-linear-gradient(0deg, ${color}, ${color} 2px, transparent 2px, transparent 6px)`;
      case 'squares':
        return `repeating-linear-gradient(0deg, ${color} 0px, ${color} 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, ${color} 0px, ${color} 1px, transparent 1px, transparent 8px)`;
      case 'zigzag':
        return `linear-gradient(135deg, ${color} 25%, transparent 25%), linear-gradient(225deg, ${color} 25%, transparent 25%), linear-gradient(45deg, ${color} 25%, transparent 25%), linear-gradient(315deg, ${color} 25%, transparent 25%)`;
      case 'diagonal':
        return `repeating-linear-gradient(45deg, ${color}, ${color} 2px, transparent 2px, transparent 8px)`;
      default:
        return color;
    }
  };

  // Add option
  const addOption = useCallback(() => {
    if (options.length >= 3) return;
    setOptions(prev => [...prev, { name: '', displayType: 'button', values: [] }]);
  }, [options]);
  
  // Handle hasVariants change - clear price/inventory, add empty option
  const handleHasVariantsChange = useCallback((enabled: boolean) => {
    setHasVariants(enabled);
    if (enabled) {
      // Clear product-level price/inventory when enabling variants
      setPrice('');
      setComparePrice('');
      setInventory(0);
      // Add empty option if none exist
      if (options.length === 0) {
        setOptions([{ name: '', displayType: 'button', values: [] }]);
      }
    }
  }, [options.length]);

  // Remove option
  const removeOption = useCallback((index: number) => {
    setOptions(prev => {
      const newOptions = prev.filter((_, i) => i !== index);
      generateVariants(newOptions);
      return newOptions;
    });
  }, []);

  // Auto-detect display type from option name
  const detectDisplayTypeFromName = (name: string): ProductOptionForm['displayType'] | null => {
    const lowerName = name.toLowerCase().trim();
    // Color keywords
    if (['צבע', 'צבעים', 'color', 'colors', 'colour', 'colours'].includes(lowerName)) {
      return 'color';
    }
    // Size keywords - keep as button
    if (['מידה', 'מידות', 'size', 'sizes', 'גודל'].includes(lowerName)) {
      return 'button';
    }
    // Pattern keywords
    if (['דוגמה', 'דוגמאות', 'pattern', 'patterns', 'פטרן', 'מרקם'].includes(lowerName)) {
      return 'pattern';
    }
    return null;
  };

  // Update option name (with auto-detect display type)
  const updateOptionName = useCallback((index: number, name: string) => {
    setOptions(prev => prev.map((opt, i) => {
      if (i !== index) return opt;
      
      // Auto-detect display type if name matches known patterns
      const detectedType = detectDisplayTypeFromName(name);
      return {
        ...opt,
        name,
        // Only auto-switch if current type is still the default 'button' or if detected
        displayType: detectedType && opt.displayType === 'button' ? detectedType : opt.displayType,
      };
    }));
  }, []);

  // Update option display type
  const updateOptionDisplayType = useCallback((index: number, displayType: ProductOptionForm['displayType']) => {
    setOptions(prev => prev.map((opt, i) => i === index ? { ...opt, displayType } : opt));
  }, []);

  // Add option value with optional metadata
  const addOptionValue = useCallback((optionIndex: number, value: string, metadata?: OptionValue['metadata']) => {
    if (!value.trim()) return;
    setOptions(prev => {
      const newOptions = prev.map((opt, i) => 
        i === optionIndex 
          ? { ...opt, values: [...opt.values, { value: value.trim(), metadata }] }
          : opt
      );
      generateVariants(newOptions);
      return newOptions;
    });
  }, []);

  // Remove option value
  const removeOptionValue = useCallback((optionIndex: number, valueIndex: number) => {
    setOptions(prev => {
      const newOptions = prev.map((opt, i) => 
        i === optionIndex 
          ? { ...opt, values: opt.values.filter((_, vi) => vi !== valueIndex) }
          : opt
      );
      generateVariants(newOptions);
      return newOptions;
    });
  }, []);
  
  // Update option value gallery images
  const updateValueGallery = useCallback((optionIndex: number, valueIndex: number, images: string[]) => {
    setOptions(prev => prev.map((opt, i) => 
      i === optionIndex 
        ? {
            ...opt,
            values: opt.values.map((v, vi) => 
              vi === valueIndex 
                ? { ...v, metadata: { ...v.metadata, images } }
                : v
            )
          }
        : opt
    ));
  }, []);

  // Generate variants from options
  const generateVariants = useCallback((opts: ProductOptionForm[]) => {
    const activeOptions = opts.filter(o => o.values.length > 0);
    if (activeOptions.length === 0) {
      setVariants([]);
      return;
    }

    // Generate all combinations - extract value strings from OptionValue objects
    const combinations: string[][] = activeOptions.reduce((acc: string[][], opt) => {
      const valueStrings = opt.values.map(v => v.value);
      if (acc.length === 0) return valueStrings.map(v => [v]);
      return acc.flatMap(combo => valueStrings.map(v => [...combo, v]));
    }, []);

    // Preserve existing variant data where possible
    const newVariants = combinations.map(combo => {
      const title = combo.join(' / ');
      // Try to find existing variant with same title
      const existing = variants.find(v => v.title === title);
      return {
        id: existing?.id,
        title,
        sku: existing?.sku || '',
        barcode: existing?.barcode || '',
        price: existing?.price || '',
        comparePrice: existing?.comparePrice || '',
        cost: existing?.cost || '',
        weight: existing?.weight || '',
        inventory: existing?.inventory || 0,
        allowBackorder: existing?.allowBackorder || false,
      option1: combo[0],
      option2: combo[1],
      option3: combo[2],
      };
    });

    setVariants(newVariants);
  }, [variants]);

  // Update variant field
  const updateVariant = useCallback((index: number, field: string, value: string | number | boolean) => {
    setVariants(prev => prev.map((v, i) => 
      i === index ? { ...v, [field]: value } : v
    ));
  }, []);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('שם המוצר הוא שדה חובה');
      return;
    }
    
    if (!slug.trim()) {
      alert('כתובת URL היא שדה חובה');
      return;
    }

    const formData: ProductFormData = {
      name: name.trim(),
      slug: slug.trim(),
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      price: price ? String(price) : undefined,
      comparePrice: comparePrice ? String(comparePrice) : undefined,
      cost: cost ? String(cost) : undefined,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      weight: weight ? String(weight) : undefined,
      trackInventory,
      inventory: trackInventory ? inventory : undefined,
      allowBackorder,
      hasVariants,
      options: hasVariants ? options : undefined,
      variants: hasVariants ? variants.map(v => ({
        id: v.id,
        title: v.title,
        sku: v.sku || undefined,
        barcode: v.barcode || undefined,
        price: v.price,
        comparePrice: v.comparePrice || undefined,
        cost: v.cost || undefined,
        weight: v.weight || undefined,
        inventory: v.inventory,
        allowBackorder: v.allowBackorder,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
      })) : undefined,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      isActive,
      isFeatured,
      upsellProductIds: upsellProductIds.length > 0 ? upsellProductIds : undefined,
      addonIds: addonIds.length > 0 ? addonIds : undefined,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      metadata: Object.keys(metadataValues).length > 0 ? metadataValues : undefined,
      images: images.map(img => ({
        url: img.url,
        alt: img.filename || name || '',
        isPrimary: img.isPrimary ?? false,
        mediaType: img.mediaType || 'image',
        thumbnailUrl: img.thumbnailUrl,
      })),
    };

    startTransition(async () => {
      let result;
      
      if (mode === 'create') {
        result = await createProduct(storeId, storeSlug, formData);
        if (result.success) {
          // Redirect to products list - fast navigation, revalidation already done in server action
          router.push(`/shops/${storeSlug}/admin/products`);
        }
      } else {
        result = await updateProduct(product!.id, storeId, storeSlug, formData);
        if (result.success) {
          router.refresh();
        }
      }
      
      if (!result.success) {
        alert(result.error || 'אירעה שגיאה');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/shops/${storeSlug}/admin/products`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? 'מוצר חדש' : `עריכת ${product?.name}`}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href={`/shops/${storeSlug}/admin/products`}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ביטול
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                שומר...
              </>
            ) : (
              mode === 'create' ? 'צור מוצר' : 'שמור שינויים'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content - Left Column */}
        <div className="col-span-8 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">פרטי מוצר</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם המוצר <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="לדוגמה: חולצת כותנה לבנה"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור קצר
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="תיאור קצר שיופיע בכרטיס המוצר"
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">{shortDescription.length}/500</p>
              </div>

              <div>
                <RichTextEditor
                  label="תיאור מלא"
                  value={description}
                  onChange={setDescription}
                  placeholder="תיאור מפורט של המוצר..."
                  minHeight={180}
                />
              </div>
            </div>
          </div>

          {/* Images & Videos */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">תמונות וסרטונים</h2>
            </div>
            <div className="p-4">
              <MediaUploader
                value={images}
                onChange={setImages}
                maxFiles={10}
                multiple={true}
                folder={`quickshop/stores/${storeSlug}`}
                storeId={storeId}
                storeSlug={storeSlug}
                showPrimary={true}
                aspectRatio="1:1"
                allowVideo={true}
                placeholder="גרור תמונות/סרטונים או לחץ לבחירה"
              />
              <p className="text-xs text-gray-400 mt-3">גרור לשינוי סדר. התמונה/סרטון הראשי יופיע בכרטיס המוצר. סרטונים עד 20MB.</p>
            </div>
          </div>

          {/* Pricing - only show when no variants */}
          {!hasVariants && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">תמחור</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מחיר</label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מחיר השוואה</label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={comparePrice}
                      onChange={(e) => setComparePrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">יוצג כמחיר מחוק</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">עלות</label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">לחישוב רווח</p>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Variants */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">וריאציות</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => handleHasVariantsChange(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/10"
                />
                <span className="text-sm text-gray-600">למוצר יש וריאציות</span>
              </label>
            </div>
            
            {hasVariants ? (
              <div className="p-4 space-y-6">
                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">אפשרויות</h3>
                    {options.length < 3 && (
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        הוסף אפשרות
                      </button>
                    )}
                  </div>
                  
                  {options.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">אין אפשרויות עדיין</p>
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        הוסף אפשרות ראשונה (מידה, צבע וכו׳)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {options.map((option, optIndex) => (
                        <div key={optIndex} className="bg-gray-50 rounded-lg p-4 space-y-3">
                          {/* Option Header: Name + Display Type + Delete */}
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) => updateOptionName(optIndex, e.target.value)}
                              placeholder="שם האפשרות (למשל: מידה, צבע)"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors text-sm"
                            />
                            <select
                              value={option.displayType}
                              onChange={(e) => updateOptionDisplayType(optIndex, e.target.value as ProductOptionForm['displayType'])}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                            >
                              <option value="button">כפתור</option>
                              <option value="color">צבע</option>
                              <option value="pattern">פטרן</option>
                              <option value="image">תמונה</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeOption(optIndex)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Values */}
                          <div className="space-y-2">
                            <label className="text-xs text-gray-500">ערכים</label>
                          <div className="flex flex-wrap gap-2">
                              {option.values.map((val, valIndex) => (
                              <span 
                                key={valIndex} 
                                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                              >
                                  {/* Color swatch for color type */}
                                  {option.displayType === 'color' && val.metadata?.color && (
                                    <span 
                                      className="w-4 h-4 rounded-full border border-gray-300" 
                                      style={{ backgroundColor: val.metadata.color }}
                                    />
                                  )}
                                  {/* Pattern preview for pattern type */}
                                  {option.displayType === 'pattern' && val.metadata?.pattern && val.metadata?.color && (
                                    <span 
                                      className="w-5 h-5 rounded border border-gray-300" 
                                      style={{ 
                                        background: getPatternCSS(val.metadata.pattern, val.metadata.color),
                                        backgroundSize: val.metadata.pattern === 'dots' ? '6px 6px' : 
                                                       val.metadata.pattern === 'zigzag' ? '8px 8px' : undefined
                                      }}
                                    />
                                  )}
                                  {val.value}
                                <button
                                  type="button"
                                  onClick={() => removeOptionValue(optIndex, valIndex)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </span>
                            ))}
                            </div>
                            
                            {/* Input based on display type */}
                            {option.displayType === 'button' && (
                              <div className="flex items-center gap-2">
                            <input
                              type="text"
                                  id={`button-value-${optIndex}`}
                                  placeholder="הוסף ערך (S, M, L...)"
                                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-900/10 outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addOptionValue(optIndex, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`button-value-${optIndex}`) as HTMLInputElement;
                                    if (input?.value) {
                                      addOptionValue(optIndex, input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                                >
                                  +
                                </button>
                              </div>
                            )}
                            
                            {option.displayType === 'color' && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  id={`color-picker-${optIndex}`}
                                  defaultValue="#000000"
                                  className="w-10 h-8 rounded border cursor-pointer"
                                />
                                <input
                                  type="text"
                                  id={`color-name-${optIndex}`}
                                  placeholder="שם צבע (שחור, לבן...)"
                                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-900/10 outline-none"
                                  onChange={(e) => {
                                    // Auto-detect color from name
                                    const detected = detectColorFromName(e.target.value);
                                    if (detected) {
                                      const picker = document.getElementById(`color-picker-${optIndex}`) as HTMLInputElement;
                                      if (picker) picker.value = detected;
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const input = e.target as HTMLInputElement;
                                      const picker = document.getElementById(`color-picker-${optIndex}`) as HTMLInputElement;
                                      const colorValue = picker?.value || '#000000';
                                      const detected = detectColorFromName(input.value);
                                      addOptionValue(optIndex, input.value, { color: detected || colorValue });
                                      input.value = '';
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`color-name-${optIndex}`) as HTMLInputElement;
                                    const picker = document.getElementById(`color-picker-${optIndex}`) as HTMLInputElement;
                                    if (input?.value) {
                                      const detected = detectColorFromName(input.value);
                                      addOptionValue(optIndex, input.value, { color: detected || picker?.value || '#000000' });
                                      input.value = '';
                                    }
                                  }}
                                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                                >
                                  +
                                </button>
                              </div>
                            )}
                            
                            {option.displayType === 'pattern' && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <select
                                    id={`pattern-type-${optIndex}`}
                                    className="px-2 py-1 border border-gray-200 rounded text-sm"
                                    defaultValue="dots"
                                    onChange={() => {
                                      // Force re-render of preview
                                      const preview = document.getElementById(`pattern-preview-${optIndex}`);
                                      if (preview) {
                                        const patternType = (document.getElementById(`pattern-type-${optIndex}`) as HTMLSelectElement)?.value || 'dots';
                                        const color = (document.getElementById(`pattern-color-${optIndex}`) as HTMLInputElement)?.value || '#000000';
                                        preview.style.background = getPatternCSS(patternType, color);
                                      }
                                    }}
                                  >
                                    <option value="dots">נקודות</option>
                                    <option value="stripes">פסים</option>
                                    <option value="squares">ריבועים</option>
                                    <option value="zigzag">זיגזג</option>
                                    <option value="diagonal">אלכסוני</option>
                                  </select>
                                  <input
                                    type="color"
                                    id={`pattern-color-${optIndex}`}
                                    defaultValue="#000000"
                                    className="w-8 h-8 rounded border cursor-pointer"
                                    onChange={(e) => {
                                      const preview = document.getElementById(`pattern-preview-${optIndex}`);
                                      if (preview) {
                                        const patternType = (document.getElementById(`pattern-type-${optIndex}`) as HTMLSelectElement)?.value || 'dots';
                                        preview.style.background = getPatternCSS(patternType, e.target.value);
                                      }
                                    }}
                                  />
                                  {/* Pattern Preview */}
                                  <div
                                    id={`pattern-preview-${optIndex}`}
                                    className="w-10 h-10 rounded border border-gray-300"
                                    style={{ background: getPatternCSS('dots', '#000000') }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const patternSelect = document.getElementById(`pattern-type-${optIndex}`) as HTMLSelectElement;
                                      const colorPicker = document.getElementById(`pattern-color-${optIndex}`) as HTMLInputElement;
                                      const patternType = patternSelect?.value || 'dots';
                                      const color = colorPicker?.value || '#000000';
                                      // Pattern name is the Hebrew translation of the type
                                      const patternNames: Record<string, string> = {
                                        'dots': 'נקודות',
                                        'stripes': 'פסים',
                                        'squares': 'ריבועים',
                                        'zigzag': 'זיגזג',
                                        'diagonal': 'אלכסוני'
                                      };
                                      addOptionValue(optIndex, patternNames[patternType] || patternType, { 
                                        pattern: patternType,
                                        color: color
                                      });
                                    }}
                                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                                  >
                                    הוסף
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {option.displayType === 'image' && (
                              <p className="text-xs text-gray-500">
                                💡 העלאת תמונות תהיה זמינה לאחר שמירת המוצר
                              </p>
                            )}
                            
                            {option.displayType === 'color' && (
                              <p className="text-xs text-gray-500">
                                💡 כתוב שם צבע בעברית והקוד יזוהה אוטומטית (20 צבעים פופולריים)
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variants Table */}
                {variants.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">וריאציות ({variants.length})</h3>
                    
                    {/* Bulk Edit Row */}
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-2">החל על כל הווריאציות:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={bulkPrice}
                          onChange={(e) => setBulkPrice(e.target.value)}
                          placeholder="מחיר"
                          className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={bulkComparePrice}
                          onChange={(e) => setBulkComparePrice(e.target.value)}
                          placeholder="לפני"
                          className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded"
                        />
                        <input
                          type="text"
                          value={bulkSku}
                          onChange={(e) => setBulkSku(e.target.value)}
                          placeholder="מק״ט"
                          className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded font-mono"
                        />
                        <input
                          type="number"
                          min="0"
                          value={bulkInventory}
                          onChange={(e) => setBulkInventory(e.target.value)}
                          placeholder="מלאי"
                          className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded"
                        />
                        <button
                          type="button"
                          onClick={applyBulkToVariants}
                          disabled={!bulkPrice && !bulkComparePrice && !bulkSku && !bulkInventory}
                          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          החל
                        </button>
                      </div>
                    </div>
                    
                    {/* Variants Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">וריאציה</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">מחיר</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">מחיר לפני</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">מק״ט</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">מלאי</th>
                            <th className="px-3 py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {variants.map((variant, index) => (
                            <Fragment key={index}>
                              <tr className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium text-gray-900">
                                  <div className="flex items-center gap-2">
                                    {/* Show color circles for each option value */}
                                    {options.map((opt, optIdx) => {
                                      if (opt.displayType !== 'color') return null;
                                      const optionValue = optIdx === 0 ? variant.option1 : optIdx === 1 ? variant.option2 : variant.option3;
                                      const valueData = opt.values.find(v => v.value === optionValue);
                                      if (!valueData?.metadata?.color) return null;
                                      return (
                                        <span 
                                          key={optIdx}
                                          className="w-4 h-4 rounded-full border border-gray-300 shrink-0" 
                                          style={{ backgroundColor: valueData.metadata.color as string }}
                                          title={optionValue || ''}
                                        />
                                      );
                                    })}
                                    {/* Show pattern previews */}
                                    {options.map((opt, optIdx) => {
                                      if (opt.displayType !== 'pattern') return null;
                                      const optionValue = optIdx === 0 ? variant.option1 : optIdx === 1 ? variant.option2 : variant.option3;
                                      const valueData = opt.values.find(v => v.value === optionValue);
                                      if (!valueData?.metadata?.pattern || !valueData?.metadata?.color) return null;
                                      return (
                                        <span 
                                          key={optIdx}
                                          className="w-4 h-4 rounded border border-gray-300 shrink-0" 
                                          style={{
                                            background: valueData.metadata.pattern === 'dots' 
                                              ? `radial-gradient(circle, ${valueData.metadata.color} 20%, transparent 20%) 0 0 / 4px 4px`
                                              : valueData.metadata.pattern === 'stripes'
                                              ? `repeating-linear-gradient(45deg, ${valueData.metadata.color}, ${valueData.metadata.color} 1px, transparent 1px, transparent 3px)`
                                              : valueData.metadata.pattern === 'squares'
                                              ? `linear-gradient(to right, ${valueData.metadata.color} 50%, transparent 50%) 0 0 / 4px 4px, linear-gradient(to bottom, ${valueData.metadata.color} 50%, transparent 50%) 0 0 / 4px 4px`
                                              : valueData.metadata.pattern === 'zigzag'
                                              ? `linear-gradient(135deg, ${valueData.metadata.color} 25%, transparent 25%) -2px 0 / 4px 4px, linear-gradient(225deg, ${valueData.metadata.color} 25%, transparent 25%) -2px 0 / 4px 4px`
                                              : `repeating-linear-gradient(45deg, ${valueData.metadata.color} 0px, ${valueData.metadata.color} 2px, transparent 2px, transparent 4px)`
                                          }}
                                          title={optionValue || ''}
                                        />
                                      );
                                    })}
                                    <span>{variant.title}</span>
                                  </div>
                                </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                    className="w-20 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-900/10 outline-none"
                                    placeholder="₪"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={variant.comparePrice}
                                    onChange={(e) => updateVariant(index, 'comparePrice', e.target.value)}
                                    className="w-20 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-900/10 outline-none"
                                  placeholder="₪"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                  className="w-24 px-2 py-1 border border-gray-200 rounded text-sm font-mono focus:ring-1 focus:ring-gray-900/10 outline-none"
                                  placeholder="מק״ט"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={variant.inventory}
                                  onChange={(e) => updateVariant(index, 'inventory', parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-900/10 outline-none"
                                />
                              </td>
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedVariant(expandedVariant === index ? null : index)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                    title="הגדרות נוספות"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </button>
                                </td>
                            </tr>
                              {/* Expanded Row - Extra Fields */}
                              {expandedVariant === index && (
                                <tr className="bg-gray-50">
                                  <td colSpan={6} className="px-3 py-3">
                                    <div className="grid grid-cols-4 gap-3">
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-1">עלות</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={variant.cost}
                                          onChange={(e) => updateVariant(index, 'cost', e.target.value)}
                                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                                          placeholder="₪ 0.00"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-1">ברקוד</label>
                                        <input
                                          type="text"
                                          value={variant.barcode}
                                          onChange={(e) => updateVariant(index, 'barcode', e.target.value)}
                                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-mono"
                                          placeholder="1234567890"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-1">משקל (ק״ג)</label>
                                        <input
                                          type="number"
                                          step="0.001"
                                          min="0"
                                          value={variant.weight}
                                          onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                                          placeholder="0.000"
                                        />
                                      </div>
                                      <div className="flex items-end pb-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={variant.allowBackorder}
                                            onChange={(e) => updateVariant(index, 'allowBackorder', e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-gray-900"
                                          />
                                          <span className="text-xs text-gray-600">הזמנה ללא מלאי</span>
                                        </label>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Gallery per Option Value */}
                {options.length > 0 && options.some(opt => opt.values.length > 0) && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700">גלריה לפי ערך אפשרות</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showValueGalleries}
                          onChange={(e) => {
                            setShowValueGalleries(e.target.checked);
                            if (!e.target.checked) setSelectedGalleryOption(null);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900"
                        />
                        <span className="text-xs text-gray-600">הפעל גלריות</span>
                      </label>
                    </div>
                    
                    {showValueGalleries && (
                      <div className="space-y-4">
                        <p className="text-xs text-gray-500">
                          בחר אפשרות כדי להגדיר תמונות שונות לכל ערך. למשל: תמונות שונות לכל צבע.
                        </p>
                        
                        {/* Select option for gallery */}
                        <select
                          value={selectedGalleryOption ?? ''}
                          onChange={(e) => setSelectedGalleryOption(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">בחר אפשרות...</option>
                          {options.map((opt, idx) => (
                            opt.values.length > 0 && (
                              <option key={idx} value={idx}>{opt.name || `אפשרות ${idx + 1}`}</option>
                            )
                          ))}
                        </select>
                        
                        {/* Gallery for each value - using MediaUploader */}
                        {selectedGalleryOption !== null && options[selectedGalleryOption] && (
                          <div className="space-y-4">
                            {options[selectedGalleryOption].values.map((val, valIdx) => {
                              // Convert string URLs to UploadedMedia format
                              const valueImages = val.metadata?.images || [];
                              const mediaValue: UploadedMedia[] = valueImages.map((url, i) => ({
                                id: `${selectedGalleryOption}-${valIdx}-${i}`,
                                url,
                                filename: `${val.value}-${i + 1}`,
                                size: 0,
                                isPrimary: i === 0,
                              }));
                              
                              return (
                                <div key={valIdx} className="bg-white border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    {options[selectedGalleryOption].displayType === 'color' && val.metadata?.color && (
                                      <span 
                                        className="w-5 h-5 rounded-full border border-gray-300" 
                                        style={{ backgroundColor: val.metadata.color }}
                                      />
                                    )}
                                    {options[selectedGalleryOption].displayType === 'pattern' && val.metadata?.pattern && val.metadata?.color && (
                                      <span 
                                        className="w-5 h-5 rounded border border-gray-300" 
                                        style={{ 
                                          background: getPatternCSS(val.metadata.pattern, val.metadata.color),
                                          backgroundSize: val.metadata.pattern === 'dots' ? '6px 6px' : undefined
                                        }}
                                      />
                                    )}
                                    <span className="font-medium text-sm">{val.value}</span>
                                    <span className="text-xs text-gray-400">({valueImages.length} תמונות)</span>
                                  </div>
                                  
                                  {/* MediaUploader for this value */}
                                  <MediaUploader
                                    value={mediaValue}
                                    onChange={(newMedia) => {
                                      // Convert back to string URLs
                                      const newUrls = newMedia.map(m => m.url);
                                      updateValueGallery(selectedGalleryOption, valIdx, newUrls);
                                    }}
                                    maxFiles={10}
                                    multiple={true}
                                    folder={`quickshop/stores/${storeSlug}/variants`}
                                    storeId={storeId}
                                    storeSlug={storeSlug}
                                    showPrimary={true}
                                    aspectRatio="1:1"
                                    compact={true}
                                    placeholder={`גרור תמונות או בחר מספרייה עבור ${val.value}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-gray-500">
                  סמן "למוצר יש וריאציות" כדי להוסיף אפשרויות כמו מידות, צבעים וכו׳.
                  <br />
                  <span className="text-xs text-gray-400">לכל וריאציה יהיה מחיר, מלאי ומק״ט משלה.</span>
                </p>
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">קידום אתרים (SEO)</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כותרת SEO</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={name || 'כותרת שתופיע בתוצאות החיפוש'}
                  maxLength={70}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">{seoTitle.length}/70</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור SEO</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder={shortDescription || 'תיאור שיופיע בתוצאות החיפוש'}
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{seoDescription.length}/160</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כתובת URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
                  placeholder="חולצה-לבנה"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors text-sm"
                  dir="auto"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">ניתן להשתמש בעברית. רווחים יוחלפו ב-</p>
              </div>

              {/* SEO Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2 text-right">תצוגה מקדימה בגוגל:</p>
                <div className="space-y-1 text-right">
                  <p className="text-blue-700 text-lg hover:underline cursor-pointer truncate">
                    {seoTitle || name || 'שם המוצר'}
                  </p>
                  <p className="text-green-700 text-sm truncate">
                    {`${storeUrl}/product/${slug.replace(/\s+/g, '-') || 'product-url'}`}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {seoDescription || shortDescription || 'תיאור המוצר יופיע כאן...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="col-span-4 space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">סטטוס</h2>
            </div>
            <div className="p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={isActive}
                  onChange={() => setIsActive(true)}
                  className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-900/10"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">פעיל</span>
                  <p className="text-xs text-gray-500">המוצר יופיע בחנות</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={!isActive}
                  onChange={() => setIsActive(false)}
                  className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-900/10"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">טיוטה</span>
                  <p className="text-xs text-gray-500">המוצר לא יופיע בחנות</p>
                </div>
              </label>
            </div>
          </div>

          {/* Organization */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">ארגון</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריות</label>
                <CategoryPicker
                  categories={categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    parentId: cat.parentId,
                  })) as CategoryNode[]}
                  value={categoryIds}
                  onChange={setCategoryIds}
                  placeholder="בחר קטגוריות"
                  storeId={storeId}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/10"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">מוצר מודגש</span>
                  <p className="text-xs text-gray-500">יופיע באזור המוצרים המומלצים</p>
                </div>
              </label>
            </div>
          </div>

          {/* Inventory & Shipping */}
          {!hasVariants && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">מלאי ומשלוח</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מק״ט</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="מק״ט-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ברקוד</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">משקל (ק״ג)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors"
                  />
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackInventory}
                      onChange={(e) => setTrackInventory(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/10"
                    />
                    <span className="text-sm text-gray-700">עקוב אחר מלאי</span>
                  </label>

                  {trackInventory && (
                    <div className="mr-7">
                      <label className="block text-sm font-medium text-gray-700 mb-1">כמות במלאי</label>
                      <input
                        type="number"
                        min="0"
                        value={inventory}
                        onChange={(e) => setInventory(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowBackorder}
                      onChange={(e) => setAllowBackorder(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/10"
                    />
                    <span className="text-sm text-gray-700">אפשר הזמנה ללא מלאי</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Metafields - Custom Fields */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">שדות מותאמים</h2>
              <Link 
                href={`/shops/${storeSlug}/admin/metafields`}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                ניהול שדות →
              </Link>
            </div>
            <div className="p-4">
              {storeMetafields.filter(m => m.isActive).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  אין שדות מותאמים אישית.
                  <br />
                  <Link href={`/shops/${storeSlug}/admin/metafields`} className="text-blue-600 hover:underline">
                    הוסף שדות בהגדרות
                  </Link>
                </p>
              ) : (
                <div className="space-y-4">
                  {storeMetafields.filter(m => m.isActive).map((field) => (
                    <div key={field.id}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.name}
                          {field.isRequired && <span className="text-red-500 mr-1">*</span>}
                        </label>
                        <div className="flex items-center gap-1">
                          {field.showOnProduct && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">מוצר</span>
                          )}
                          {field.showInCheckout && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">הזמנה</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Text input */}
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={(metadataValues[field.key] as string) || ''}
                          onChange={(e) => setMetadataValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                      )}
                      
                      {/* Textarea */}
                      {field.type === 'textarea' && (
                        <textarea
                          value={(metadataValues[field.key] as string) || ''}
                          onChange={(e) => setMetadataValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                      )}
                      
                      {/* Number input */}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={(metadataValues[field.key] as number) || ''}
                          onChange={(e) => setMetadataValues(prev => ({ ...prev, [field.key]: e.target.value ? Number(e.target.value) : undefined }))}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                      )}
                      
                      {/* Date input */}
                      {field.type === 'date' && (
                        <input
                          type="date"
                          value={(metadataValues[field.key] as string) || ''}
                          onChange={(e) => setMetadataValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                      )}
                      
                      {/* URL input */}
                      {field.type === 'url' && (
                        <input
                          type="url"
                          value={(metadataValues[field.key] as string) || ''}
                          onChange={(e) => setMetadataValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder || 'https://example.com'}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                      )}
                      
                      {/* Boolean (checkbox) */}
                      {field.type === 'boolean' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(metadataValues[field.key] as boolean) || false}
                            onChange={(e) => setMetadataValues(prev => ({ ...prev, [field.key]: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span className="text-sm text-gray-600">כן</span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upsell Products */}
          {allProducts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">מוצרים משלימים (אפסייל)</h2>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-500">
                  בחר מוצרים שיוצגו כהמלצה בעגלת הקניות כשמוצר זה מתווסף.
                </p>
                
                {/* Search & Add Products */}
                {upsellProductIds.length < 5 && (
                <div className="relative">
                    <div className="relative">
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={upsellSearch}
                    onChange={(e) => {
                          setUpsellSearch(e.target.value);
                          setShowUpsellResults(true);
                        }}
                        onFocus={() => setShowUpsellResults(true)}
                        onBlur={() => setTimeout(() => setShowUpsellResults(false), 200)}
                        placeholder="חפש מוצר להוספה..."
                        className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors text-sm"
                      />
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {showUpsellResults && upsellSearch.trim() && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                    {allProducts
                          .filter(p => 
                            p.id !== product?.id && 
                            !upsellProductIds.includes(p.id) &&
                            p.name.toLowerCase().includes(upsellSearch.toLowerCase())
                          )
                          .slice(0, 10)
                      .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setUpsellProductIds([...upsellProductIds, p.id]);
                                setUpsellSearch('');
                                setShowUpsellResults(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-gray-50 transition-colors"
                            >
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-8 h-8 object-cover rounded" />
                              ) : (
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                                  </svg>
                                </div>
                              )}
                              <span className="flex-1 text-sm truncate">{p.name}</span>
                              {p.price && (
                                <span className="text-xs text-gray-500">₪{p.price}</span>
                              )}
                            </button>
                          ))}
                        {allProducts.filter(p => 
                          p.id !== product?.id && 
                          !upsellProductIds.includes(p.id) &&
                          p.name.toLowerCase().includes(upsellSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            לא נמצאו מוצרים
                </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected Products */}
                {upsellProductIds.length > 0 && (
                  <div className="space-y-2">
                    {upsellProductIds.map(id => {
                      const upsellProduct = allProducts.find(p => p.id === id);
                      if (!upsellProduct) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          {upsellProduct.imageUrl ? (
                            <img
                              src={upsellProduct.imageUrl}
                              alt={upsellProduct.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <span className="flex-1 text-sm truncate">{upsellProduct.name}</span>
                          <button
                            type="button"
                            onClick={() => setUpsellProductIds(upsellProductIds.filter(pid => pid !== id))}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {upsellProductIds.length >= 5 && (
                  <p className="text-xs text-amber-600">ניתן לבחור עד 5 מוצרים</p>
                )}
              </div>
            </div>
          )}

          {/* Product Addons */}
          {storeAddons.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">תוספות מותאמות</h2>
                <a
                  href={`/shops/${storeSlug}/admin/addons`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  ניהול תוספות →
                </a>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">
                  בחר תוספות שיופיעו בעמוד המוצר (למשל: רקמה אישית, אריזת מתנה)
                </p>
                
                {storeAddons.map(addon => {
                  const isSelected = addonIds.includes(addon.id);
                  const priceDisplay = addon.fieldType === 'select' || addon.fieldType === 'radio' 
                    ? addon.options?.filter(o => o.priceAdjustment > 0).length 
                      ? `משתנה`
                      : null
                    : addon.priceAdjustment > 0 
                      ? `+₪${addon.priceAdjustment}`
                      : null;
                  
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-black bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAddonIds([...addonIds, addon.id]);
                          } else {
                            setAddonIds(addonIds.filter(id => id !== addon.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{addon.name}</span>
                          {addon.isRequired && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">חובה</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {addon.fieldType === 'text' && 'טקסט חופשי'}
                          {addon.fieldType === 'select' && 'בחירה מרשימה'}
                          {addon.fieldType === 'checkbox' && 'תיבת סימון'}
                          {addon.fieldType === 'radio' && 'בחירה בודדת'}
                          {addon.fieldType === 'date' && 'תאריך'}
                        </span>
                      </div>
                      {priceDisplay && (
                        <span className="text-xs font-medium text-green-600 shrink-0">
                          {priceDisplay}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Info (Edit mode only) */}
          {mode === 'edit' && product && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">מידע</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">נוצר: </span>
                  <span className="text-gray-900">
                    {new Date(product.createdAt).toLocaleDateString('he-IL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">עודכן: </span>
                  <span className="text-gray-900">
                    {new Date(product.updatedAt).toLocaleDateString('he-IL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

