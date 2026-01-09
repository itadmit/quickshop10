'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Category, Product } from '@/lib/db/schema';
import { createProduct, updateProduct, ProductFormData } from '@/lib/actions/products';
import { MediaUploader, UploadedMedia } from '@/components/admin/media-uploader';
import { CategoryPicker, type CategoryNode } from '@/components/admin/category-picker';

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

interface ProductFormProps {
  storeId: string;
  storeSlug: string;
  customDomain?: string | null;
  categories: Category[];
  allProducts?: UpsellProduct[]; // For upsell product selection
  storeAddons?: StoreAddon[]; // For addon assignment
  product?: Product & { 
    images?: { id: string; url: string; alt: string | null; isPrimary: boolean }[];
    options?: ProductOption[];
    variants?: ProductVariant[];
    categoryIds?: string[];
    upsellProductIds?: string[];
    addonIds?: string[];
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

export function ProductForm({ storeId, storeSlug, customDomain, categories, allProducts = [], storeAddons = [], product, mode }: ProductFormProps) {
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
  
  // Product Addons
  const [addonIds, setAddonIds] = useState<string[]>(
    product?.addonIds || []
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
  const [options, setOptions] = useState<{ name: string; values: string[] }[]>(
    product?.options?.map(opt => ({
      name: opt.name,
      values: opt.values.map(v => v.value),
    })) || []
  );
  const [variants, setVariants] = useState<{
    id?: string;
    title: string;
    sku: string;
    price: string;
    comparePrice: string;
    inventory: number;
    option1?: string;
    option2?: string;
    option3?: string;
  }[]>(
    product?.variants?.map(v => ({
      id: v.id,
      title: v.title,
      sku: v.sku || '',
      price: v.price,
      comparePrice: v.comparePrice || '',
      inventory: v.inventory ?? 0,
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

  // Add option
  const addOption = useCallback(() => {
    if (options.length >= 3) return;
    const optionNames = ['מידה', 'צבע', 'חומר'];
    const usedNames = options.map(o => o.name);
    const availableName = optionNames.find(n => !usedNames.includes(n)) || `אפשרות ${options.length + 1}`;
    setOptions(prev => [...prev, { name: availableName, values: [] }]);
  }, [options]);

  // Remove option
  const removeOption = useCallback((index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
    // Regenerate variants without this option
    generateVariants(options.filter((_, i) => i !== index));
  }, [options]);

  // Update option name
  const updateOptionName = useCallback((index: number, name: string) => {
    setOptions(prev => prev.map((opt, i) => i === index ? { ...opt, name } : opt));
  }, []);

  // Add option value
  const addOptionValue = useCallback((optionIndex: number, value: string) => {
    if (!value.trim()) return;
    setOptions(prev => {
      const newOptions = prev.map((opt, i) => 
        i === optionIndex 
          ? { ...opt, values: [...opt.values, value.trim()] }
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

  // Generate variants from options
  const generateVariants = useCallback((opts: { name: string; values: string[] }[]) => {
    const activeOptions = opts.filter(o => o.values.length > 0);
    if (activeOptions.length === 0) {
      setVariants([]);
      return;
    }

    // Generate all combinations
    const combinations: string[][] = activeOptions.reduce((acc: string[][], opt) => {
      if (acc.length === 0) return opt.values.map(v => [v]);
      return acc.flatMap(combo => opt.values.map(v => [...combo, v]));
    }, []);

    // Create variants from combinations
    const newVariants = combinations.map(combo => ({
      title: combo.join(' / '),
      sku: '',
      price: price || '',
      comparePrice: comparePrice || '',
      inventory: 0,
      option1: combo[0],
      option2: combo[1],
      option3: combo[2],
    }));

    setVariants(newVariants);
  }, [price, comparePrice]);

  // Update variant field
  const updateVariant = useCallback((index: number, field: string, value: string | number) => {
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
        price: v.price,
        comparePrice: v.comparePrice || undefined,
        cost: undefined,
        inventory: v.inventory,
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
      images: images.map(img => ({
        url: img.url,
        alt: img.filename || name || '',
        isPrimary: img.isPrimary ?? false,
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור מלא
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="תיאור מפורט של המוצר..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">תמונות</h2>
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
                placeholder="גרור תמונות או לחץ לבחירה"
              />
              <p className="text-xs text-gray-400 mt-3">גרור תמונות לשינוי סדר. התמונה הראשית תופיע בכרטיס המוצר.</p>
            </div>
          </div>

          {/* Pricing */}
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

          {/* Variants */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">וריאציות</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
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
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) => updateOptionName(optIndex, e.target.value)}
                              placeholder="שם האפשרות"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors text-sm"
                            />
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
                          
                          <div className="flex flex-wrap gap-2">
                            {option.values.map((value, valIndex) => (
                              <span 
                                key={valIndex} 
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                              >
                                {value}
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
                            <input
                              type="text"
                              placeholder="הוסף ערך..."
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-900/10 outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addOptionValue(optIndex, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
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
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">וריאציה</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">מחיר</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">מק״ט</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">מלאי</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {variants.map((variant, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-900">{variant.title}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                  className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-900/10 outline-none"
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
                                  className="w-20 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-900/10 outline-none"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

          {/* Metafields (placeholder - defined in settings) */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">שדות מותאמים</h2>
              <Link 
                href={`/shops/${storeSlug}/admin/settings/metafields`}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                הגדרות
              </Link>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 text-center py-4">
                אין שדות מותאמים אישית.
                <br />
                <Link href={`/shops/${storeSlug}/admin/settings/metafields`} className="text-blue-600 hover:underline">
                  הוסף שדות בהגדרות
                </Link>
              </p>
            </div>
          </div>

          {/* Upsell Products */}
          {mode === 'edit' && allProducts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">מוצרים משלימים (אפסייל)</h2>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-500">
                  בחר מוצרים שיוצגו כהמלצה בעגלת הקניות כשמוצר זה מתווסף.
                </p>
                
                {/* Search & Add Products */}
                <div className="relative">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors text-sm"
                    value=""
                    onChange={(e) => {
                      if (e.target.value && !upsellProductIds.includes(e.target.value) && upsellProductIds.length < 5) {
                        setUpsellProductIds([...upsellProductIds, e.target.value]);
                      }
                    }}
                  >
                    <option value="">+ הוסף מוצר משלים...</option>
                    {allProducts
                      .filter(p => p.id !== product?.id && !upsellProductIds.includes(p.id))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
                
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

