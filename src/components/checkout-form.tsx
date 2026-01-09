'use client';

import { useStore } from '@/lib/store-context';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CouponInput } from './coupon-input';
import type { AppliedCoupon } from '@/lib/store-context';
import { CheckoutLogin } from './checkout-login';
import { createOrder } from '@/app/actions/order';
import { getAutomaticDiscounts, type AutomaticDiscountResult, type CartItemForDiscount } from '@/app/actions/automatic-discount';
import { calculateDiscounts, dbDiscountToEngine, type CartItem as EngineCartItem, type Discount } from '@/lib/discount-engine';
import { tracker } from '@/lib/tracking';
import { getProductsByIds } from '@/app/actions/products';
import { useCitySearch, useStreetSearch } from '@/hooks/useIsraelAddress';
import { Autocomplete } from '@/components/ui/autocomplete';

interface LoggedInCustomer {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  defaultAddress?: {
    street?: string;
    houseNumber?: string;
    apartment?: string;
    floor?: string;
    city?: string;
    zipCode?: string;
  } | null;
  hasPassword?: boolean;
  isClubMember?: boolean; // true if has active club_member contact
  creditBalance?: number;
}

const ORDER_STORAGE_KEY = 'quickshop_last_order';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

export interface CheckoutSettings {
  requirePhone: boolean;
  requireCompany: boolean;
  showZipCode: boolean;
  allowNotes: boolean;
  termsRequired: boolean;
  successMessage: string;
}

export interface ShippingRate {
  id: string;
  name: string;
  price: number;
  freeAbove: number | null;
  estimatedDays: string;
}

export interface ShippingSettings {
  rates: ShippingRate[];
  freeShippingThreshold: number;
  enableFreeShipping: boolean;
}

interface CheckoutFormProps {
  basePath?: string;
  storeSlug?: string;
  storeId?: string;
  hasActivePaymentProvider?: boolean;
  checkoutSettings?: CheckoutSettings;
  shippingSettings?: ShippingSettings;
}

const defaultCheckoutSettings: CheckoutSettings = {
  requirePhone: true,
  requireCompany: false,
  showZipCode: false,
  allowNotes: true,
  termsRequired: false,
  successMessage: '',
};

const defaultShippingSettings: ShippingSettings = {
  rates: [{ id: '1', name: 'משלוח רגיל', price: 29, freeAbove: 200, estimatedDays: '3-5 ימי עסקים' }],
  freeShippingThreshold: 200,
  enableFreeShipping: true,
};

export function CheckoutForm({ 
  basePath = '', 
  storeSlug, 
  storeId,
  hasActivePaymentProvider = false,
  checkoutSettings = defaultCheckoutSettings,
  shippingSettings = defaultShippingSettings,
}: CheckoutFormProps) {
  const { cart, cartTotal, cartOriginalTotal, clearCart, isHydrated, addGiftItem, removeGiftItemsByCoupon, appliedCoupons, addCoupon, removeCoupon, clearCoupons, formatPrice, addToCart } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const homeUrl = basePath || '/';
  
  // Check for payment error in URL (only show for payment-related errors)
  const errorParam = searchParams.get('error');
  const paymentError = errorParam === 'payment_failed' || errorParam === 'payment_error' || errorParam === 'payment_cancelled';
  const [step, setStep] = useState<'details' | 'shipping' | 'payment'>('details');
  
  // Track recovery state
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [recoveredCartId, setRecoveredCartId] = useState<string | null>(null);
  
  // Clear error from URL after showing it (to prevent it from showing again)
  useEffect(() => {
    if (paymentError && step === 'payment') {
      // Clear error from URL after a short delay to allow user to see the message
      const timer = setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('error');
        const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
        router.replace(newUrl, { scroll: false });
      }, 5000); // Clear after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [paymentError, step, searchParams, router]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState<{ exists: boolean; hasAccount: boolean } | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [autoDiscounts, setAutoDiscounts] = useState<AutomaticDiscountResult[]>([]);
  const [loadingAutoDiscounts, setLoadingAutoDiscounts] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loggedInCustomer, setLoggedInCustomer] = useState<LoggedInCustomer | null>(null);
  const [useCredit, setUseCredit] = useState(false);
  const [couponWarning, setCouponWarning] = useState<string | null>(null);
  const [urlCouponApplied, setUrlCouponApplied] = useState(false);
  
  // 🏙️ City/Street autocomplete hooks
  const citySearch = useCitySearch(storeSlug || '');
  const [selectedCity, setSelectedCity] = useState('');
  const streetSearch = useStreetSearch(storeSlug || '', selectedCity);
  
  // Recover abandoned cart from URL (e.g., ?recover=TOKEN)
  useEffect(() => {
    if (!isHydrated || recoveryAttempted) return;
    
    const recoverToken = searchParams.get('recover');
    if (!recoverToken) {
      setRecoveryAttempted(true);
      return;
    }
    
    // Don't recover if cart already has items
    if (cart.length > 0) {
      setRecoveryAttempted(true);
      // Clean URL
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('recover');
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
      router.replace(newUrl, { scroll: false });
      return;
    }
    
    const recoverCart = async () => {
      try {
        const { recoverCartByToken } = await import('@/app/shops/[slug]/admin/abandoned/actions');
        const result = await recoverCartByToken(recoverToken);
        
        if (result.success && result.items && result.items.length > 0) {
          // Add items to cart
          for (const item of result.items) {
            if (item.productId) {
              addToCart({
                productId: item.productId,
                variantId: item.variantId,
                name: item.name,
                variantTitle: item.variant,
                price: item.price,
                image: item.image || '',
              }, item.quantity);
            }
          }
          
          // Store cartId for marking as recovered later
          if (result.cartId) {
            setRecoveredCartId(result.cartId);
          }
          
          // Pre-fill email if available
          if (result.email && formData.email === '') {
            setFormData(prev => ({ ...prev, email: result.email || '' }));
          }
        }
      } catch (error) {
        console.error('Failed to recover cart:', error);
      } finally {
        setRecoveryAttempted(true);
        // Clean URL without refreshing
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('recover');
        const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
        router.replace(newUrl, { scroll: false });
      }
    };
    
    recoverCart();
  }, [isHydrated, recoveryAttempted, searchParams, router, cart.length, addToCart]);
  
  // Apply coupon from URL (e.g., ?coupon=SUMMER20)
  useEffect(() => {
    if (!isHydrated || urlCouponApplied || cart.length === 0 || !storeId) return;
    
    const couponCode = searchParams.get('coupon');
    if (!couponCode) return;
    
    // Check if already applied
    if (appliedCoupons.some(c => c.code.toUpperCase() === couponCode.toUpperCase())) {
      setUrlCouponApplied(true);
      return;
    }
    
    // Validate and apply the coupon
    const applyCouponFromUrl = async () => {
      try {
        const { validateCoupon } = await import('@/app/actions/coupon');
        const result = await validateCoupon(
          storeId,
          couponCode,
          cartOriginalTotal, // Use original total for coupon validation
          undefined, // email
          cart.map(item => ({ productId: item.productId, quantity: item.quantity }))
        );
        
        if (result.success && result.coupon) {
          addCoupon(result.coupon as AppliedCoupon);
        }
      } catch (error) {
        console.error('Failed to apply coupon from URL:', error);
      } finally {
        setUrlCouponApplied(true);
        // Clean URL without refreshing
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('coupon');
        const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
        router.replace(newUrl, { scroll: false });
      }
    };
    
    applyCouponFromUrl();
  }, [isHydrated, urlCouponApplied, cart, storeId, searchParams, cartOriginalTotal, appliedCoupons, addCoupon, router]);
  
  // Re-validate coupons when cart total DECREASES (use original price)
  const prevCartTotalRef = useRef(cartOriginalTotal);
  const couponsCheckedRef = useRef<string[]>([]); // מניעת בדיקה כפולה
  useEffect(() => {
    // Only check when cart total decreased
    if (cartOriginalTotal >= prevCartTotalRef.current) {
      prevCartTotalRef.current = cartOriginalTotal;
      return;
    }
    prevCartTotalRef.current = cartOriginalTotal;
    
    if (appliedCoupons.length === 0) return;
    
    const invalidCoupons = appliedCoupons.filter(coupon => 
      coupon.minimumAmount && cartOriginalTotal < coupon.minimumAmount
    );
    
    if (invalidCoupons.length === 0) return;
    
    // מניעת בדיקה כפולה
    const newInvalidIds = invalidCoupons.map(c => c.id).filter(id => !couponsCheckedRef.current.includes(id));
    if (newInvalidIds.length === 0) return;
    couponsCheckedRef.current = [...couponsCheckedRef.current, ...newInvalidIds];
    
    // Show warning
    const removedCodes = invalidCoupons.map(c => c.code).join(', ');
    setCouponWarning(
      invalidCoupons.length === 1
        ? `הקופון ${removedCodes} הוסר - סכום ההזמנה נמוך מהמינימום הנדרש`
        : `הקופונים ${removedCodes} הוסרו - סכום ההזמנה נמוך מהמינימום הנדרש`
    );
    setTimeout(() => setCouponWarning(null), 5000);
    
    // Remove invalid coupons
    invalidCoupons.forEach(coupon => removeCoupon(coupon.id));
  }, [cartOriginalTotal, appliedCoupons, removeCoupon]);
  
  // Fetch automatic discounts when cart or email changes
  const fetchAutoDiscounts = useCallback(async (email?: string) => {
    if (cart.length === 0) {
      setAutoDiscounts([]);
      return;
    }
    
    setLoadingAutoDiscounts(true);
    try {
      const cartItems = cart.map(item => ({
        productId: item.productId,
        price: item.price,
        quantity: item.quantity,
      }));
      if (!storeId) return;
      const discounts = await getAutomaticDiscounts(storeId, cartItems, cartOriginalTotal, email);
      setAutoDiscounts(discounts);
    } catch (error) {
      console.error('Failed to fetch auto discounts:', error);
    } finally {
      setLoadingAutoDiscounts(false);
    }
  }, [cart, cartOriginalTotal]);
  
  // Check email when createAccount is checked
  const checkEmailExists = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailExists(null);
      return;
    }
    
    setCheckingEmail(true);
    try {
      const response = await fetch('/api/customer/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setEmailExists(data);
    } catch (error) {
      setEmailExists(null);
    } finally {
      setCheckingEmail(false);
    }
  }, []);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    city: '',
    street: '',
    houseNumber: '',
    apartment: '',
    floor: '',
    zipCode: '',
    notes: '',
    acceptsMarketing: false,
    createAccount: false,
    password: '',
    acceptTerms: false,
  });
  
  // Build full address from components
  const buildFullAddress = () => {
    let address = `${formData.street} ${formData.houseNumber}`.trim();
    if (formData.apartment) {
      address += `, דירה ${formData.apartment}`;
    }
    if (formData.floor) {
      address += `, קומה ${formData.floor}`;
    }
    return address;
  };

  // 🏙️ Sync selectedCity when formData.city changes (e.g., from saved address)
  useEffect(() => {
    if (formData.city && formData.city !== selectedCity) {
      setSelectedCity(formData.city);
    }
  }, [formData.city, selectedCity]);

  // Fetch auto discounts on mount and when email changes
  useEffect(() => {
    fetchAutoDiscounts(formData.email || undefined);
  }, [formData.email, cart.length, fetchAutoDiscounts]);

  // ניהול מוצרי מתנה מקופונים
  // ⚡ מהיר ויציב - עם useRef למניעת race conditions
  const giftItemsRef = useRef<Set<string>>(new Set()); // מעקב אחרי קופונים שמנהלים מוצרי מתנה
  
  useEffect(() => {
    if (!isHydrated) return;

    let isCancelled = false; // Flag למניעת race conditions

    const manageGiftItems = async () => {
      // קודם כל - מחיקת מוצרי מתנה מקופונים שכבר לא קיימים (סינכרוני - מיידי)
      const activeCouponIds = new Set(appliedCoupons.map(c => c.id));
      const giftItemsInCart = cart.filter(item => item.isGift && item.giftFromCouponId);
      
      // מחיקת מוצרי מתנה מקופונים שכבר לא פעילים
      for (const giftItem of giftItemsInCart) {
        if (giftItem.giftFromCouponId && !activeCouponIds.has(giftItem.giftFromCouponId)) {
          removeGiftItemsByCoupon(giftItem.giftFromCouponId);
          giftItemsRef.current.delete(giftItem.giftFromCouponId);
        }
      }

      // אם בוטל - לא להמשיך
      if (isCancelled) return;

      // מציאת קופונים עם gift_product (מוצר במתנה)
      const giftProductCoupons = appliedCoupons.filter(
        coupon => 
          coupon.type === 'gift_product' && 
          coupon.giftProductIds && 
          coupon.giftProductIds.length > 0
      );

      // ניהול קופוני gift_product (מוצר במתנה)
      for (const coupon of giftProductCoupons) {
        // אם בוטל - לא להמשיך
        if (isCancelled) return;

        let meetsCondition = false;
        
        // בדיקה אם זה קופון שמופעל על ידי קופון אחר (triggered)
        if (coupon.triggeredByCode) {
          // קופון מתנה שמופעל על ידי קופון אחר - בדיקה שהקופון המפעיל עדיין קיים
          const triggerCouponExists = appliedCoupons.some(
            c => c.code?.toUpperCase() === coupon.triggeredByCode?.toUpperCase()
          );
          meetsCondition = triggerCouponExists;
        } else {
          // קופון מתנה רגיל - בדיקת תנאי מינימום סכום/כמות
          const regularItems = cart.filter(item => !item.isGift);
          
          const matchingItems = regularItems.filter(item => {
            // בדיקת החרגות
            if (coupon.excludeProductIds?.includes(item.productId)) return false;
            
            // בדיקת התאמה לפי appliesTo
            if (!coupon.appliesTo || coupon.appliesTo === 'all') return true;
            if (coupon.appliesTo === 'product' && coupon.productIds?.includes(item.productId)) return true;
            return false;
          });

          const matchingTotal = matchingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const matchingQty = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
          
          // בדיקת תנאים: minimumAmount או minimumQuantity
          const meetsAmountCondition = !coupon.minimumAmount || matchingTotal >= coupon.minimumAmount;
          const meetsQuantityCondition = !coupon.minimumQuantity || matchingQty >= coupon.minimumQuantity;
          // אם אין תנאים מוגדרים, מספיק שיש פריטים בעגלה
          const hasItemsInCart = regularItems.length > 0;
          meetsCondition = meetsAmountCondition && meetsQuantityCondition && hasItemsInCart;
        }

        if (meetsCondition) {
          // תנאים מתקיימים - הוספת/עדכון מוצרי מתנה
          const giftProductIds = coupon.giftProductIds || [];
          
          // טעינת פרטי מוצרי המתנה (parallel - מהיר)
          const giftProducts = await getProductsByIds(giftProductIds);
          
          // אם בוטל אחרי הטעינה - לא להוסיף
          if (isCancelled) return;
          
          // עדכון המעקב
          giftItemsRef.current.add(coupon.id);
          
          for (const product of giftProducts) {
            if (!product.isActive) continue; // רק מוצרים פעילים
            
            // הוספת מוצר מתנה לעגלה (עם מחיר 0)
            addGiftItem({
              productId: product.id,
              name: product.name,
              price: 0, // מחיר 0 למוצר מתנה
              image: product.image || '',
            }, coupon.id, 1); // כמות 1 למוצר במתנה
          }
        } else {
          // תנאים לא מתקיימים - מחיקת מוצרי מתנה
          if (giftItemsRef.current.has(coupon.id)) {
            removeGiftItemsByCoupon(coupon.id);
            giftItemsRef.current.delete(coupon.id);
          }
        }
      }
    };

    manageGiftItems();

    // Cleanup function - מסיר race conditions
    return () => {
      isCancelled = true;
    };
  }, [appliedCoupons, cart, isHydrated, addGiftItem, removeGiftItemsByCoupon]);

  // Check if customer is already logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const response = await fetch('/api/customer/auth/me');
        const data = await response.json();
        if (data.success && data.customer) {
          setLoggedInCustomer(data.customer);
          // Pre-fill form with customer data
          setFormData(prev => ({
            ...prev,
            email: data.customer.email || prev.email,
            firstName: data.customer.firstName || prev.firstName,
            lastName: data.customer.lastName || prev.lastName,
            phone: data.customer.phone || prev.phone,
            street: data.customer.defaultAddress?.street || prev.street,
            houseNumber: data.customer.defaultAddress?.houseNumber || prev.houseNumber,
            apartment: data.customer.defaultAddress?.apartment || prev.apartment,
            floor: data.customer.defaultAddress?.floor || prev.floor,
            city: data.customer.defaultAddress?.city || prev.city,
            zipCode: data.customer.defaultAddress?.zipCode || prev.zipCode,
          }));
        }
      } catch {
        // Not logged in, that's okay
      }
    };
    checkLoggedIn();
  }, []);

  // Handle successful login
  const handleLoginSuccess = (customer: LoggedInCustomer) => {
    setLoggedInCustomer(customer);
    setShowLoginForm(false);
    
    // Pre-fill form with customer data
    setFormData(prev => ({
      ...prev,
      email: customer.email || prev.email,
      firstName: customer.firstName || prev.firstName,
      lastName: customer.lastName || prev.lastName,
      phone: customer.phone || prev.phone,
      street: customer.defaultAddress?.street || prev.street,
      houseNumber: customer.defaultAddress?.houseNumber || prev.houseNumber,
      apartment: customer.defaultAddress?.apartment || prev.apartment,
      floor: customer.defaultAddress?.floor || prev.floor,
      city: customer.defaultAddress?.city || prev.city,
      zipCode: customer.defaultAddress?.zipCode || prev.zipCode,
    }));
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/customer/auth/logout', { method: 'POST' });
      setLoggedInCustomer(null);
    } catch {
      // Ignore logout errors
    }
  };

  // Calculate automatic discounts using the new discount engine
  // 🔑 Now using categoryIds from cart items for proper category-based discount matching
  const cartItemsForEngine: EngineCartItem[] = cart.map(item => ({
    id: item.id || `item-${item.productId}`,
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.image,
    categoryIds: item.categoryIds || [],
  }));
  
  // Convert auto discounts to engine format
  const engineAutoDiscounts: Discount[] = autoDiscounts.map(d => ({
    id: d.id,
    type: d.type,
    value: d.value,
    appliesTo: d.appliesTo,
    categoryIds: d.categoryIds || [],
    productIds: d.productIds || [],
    excludeCategoryIds: d.excludeCategoryIds || [],
    excludeProductIds: d.excludeProductIds || [],
    stackable: d.stackable,
    minimumAmount: d.minimumAmount || null,
    buyQuantity: d.buyQuantity || null,
    payAmount: d.payAmount ? Number(d.payAmount) : null,
    getQuantity: d.getQuantity || null,
    giftProductIds: d.giftProductIds || [],
    giftSameProduct: d.giftSameProduct ?? true,
    quantityTiers: d.quantityTiers || [],
    spendAmount: d.spendAmount ? Number(d.spendAmount) : null,
  }));
  
  // Convert coupons to engine format (exclude gift_card which is handled separately)
  const engineCoupons: Discount[] = appliedCoupons
    .filter(c => c.type !== 'gift_card') // Gift cards handled separately
    .map(c => ({
      id: c.id,
      code: c.code,
      title: c.title,
      type: c.type as Discount['type'], // Type assertion to exclude 'gift_card'
      value: c.value,
      appliesTo: c.appliesTo || 'all',
      categoryIds: c.categoryIds || [],
      productIds: c.productIds || [],
      excludeCategoryIds: c.excludeCategoryIds || [],
      excludeProductIds: c.excludeProductIds || [],
      stackable: c.stackable,
      minimumAmount: c.minimumAmount || null,
      buyQuantity: c.buyQuantity || null,
      payAmount: c.payAmount || null,
      getQuantity: c.getQuantity || null,
      giftProductIds: c.giftProductIds || [],
      giftSameProduct: c.giftSameProduct ?? true,
      quantityTiers: c.quantityTiers || [],
      spendAmount: c.spendAmount || null,
    }));
  
  // Combine all discounts (auto discounts first, then coupons)
  const allDiscounts = [...engineAutoDiscounts, ...engineCoupons];
  
  // Calculate all discounts using the engine
  // Club member = has active club_member contact in contacts table
  const discountCalc = calculateDiscounts(cartItemsForEngine, allDiscounts, {
    isMember: !!loggedInCustomer?.isClubMember,
    shippingAmount: 0, // Will be calculated separately
  });
  
  // Separate discounts by type
  const autoDiscountResults = discountCalc.appliedDiscounts.filter(d => 
    engineAutoDiscounts.some(ad => ad.id === d.discountId)
  );
  const couponDiscountResults = discountCalc.appliedDiscounts.filter(d => 
    engineCoupons.some(c => c.id === d.discountId)
  );
  
  // Separate member discounts from product discounts (auto only)
  const memberDiscount = autoDiscountResults
    .filter(d => engineAutoDiscounts.find(ed => ed.id === d.discountId)?.appliesTo === 'member')
    .reduce((sum, d) => sum + d.amount, 0);
  const autoProductDiscount = autoDiscountResults
    .filter(d => engineAutoDiscounts.find(ed => ed.id === d.discountId)?.appliesTo !== 'member')
    .reduce((sum, d) => sum + d.amount, 0);
  
  // Calculate coupon discount (all coupon types)
  const couponDiscount = couponDiscountResults.reduce((sum, d) => sum + d.amount, 0);
  
  // Handle gift cards separately (they're not in the engine)
  const giftCardCoupon = appliedCoupons.find(c => c.type === 'gift_card');
  let giftCardAmount = 0;
  if (giftCardCoupon) {
    // Use cartOriginalTotal for correct calculation (discounts are applied to original price)
    const afterAllDiscounts = cartOriginalTotal - memberDiscount - autoProductDiscount - couponDiscount;
    giftCardAmount = Math.min(giftCardCoupon.value, afterAllDiscounts);
  }
  
  // Check for free shipping
  const hasFreeShipping = discountCalc.freeShipping || appliedCoupons.some(c => c.type === 'free_shipping');

  // Calculate shipping based on store settings (use original total for threshold)
  const baseShippingRate = shippingSettings.rates[0]?.price || 29;
  const freeShippingThreshold = shippingSettings.enableFreeShipping ? shippingSettings.freeShippingThreshold : Infinity;
  const shipping = cartOriginalTotal >= freeShippingThreshold ? 0 : baseShippingRate;
  const shippingAfterDiscount = hasFreeShipping ? 0 : shipping;
  const totalDiscount = memberDiscount + autoProductDiscount + couponDiscount + giftCardAmount;
  // ⚠️ CRITICAL: Use cartOriginalTotal - discounts are calculated from original price!
  const subtotalAfterDiscount = cartOriginalTotal - totalDiscount + shippingAfterDiscount;
  // Calculate credit to use (max available or max needed)
  const creditBalance = loggedInCustomer?.creditBalance || 0;
  const creditUsed = useCredit ? Math.min(creditBalance, subtotalAfterDiscount) : 0;
  const total = subtotalAfterDiscount - creditUsed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    
    // Prepare cart data for tracking
    const cartData = {
      items: cart.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      totalValue: cartOriginalTotal,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      currency: 'ILS',
    };
    
    if (step === 'details') {
      // Track InitiateCheckout when moving from details to shipping
      tracker.initiateCheckout(cartData);
      setStep('shipping');
      // Scroll to top so shipping section is visible
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (step === 'shipping') {
      // Track AddShippingInfo when moving from shipping to payment
      tracker.addShippingInfo({
        ...cartData,
        shippingMethod: shippingSettings.rates[0]?.name || 'משלוח',
      });
      setStep('payment');
      // Scroll to top so payment section is visible
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (step === 'payment') {
      // Track AddPaymentInfo when submitting payment
      tracker.addPaymentInfo({
        ...cartData,
        paymentMethod: hasActivePaymentProvider ? 'credit_card' : 'demo',
      });
      setIsSubmitting(true);
      
      try {
        // Check if we have an active payment provider
        if (hasActivePaymentProvider && storeSlug) {
          // Real payment flow - redirect to payment provider
          const response = await fetch('/api/payments/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storeSlug,
              amount: total,
              currency: 'ILS',
              customer: {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                address: buildFullAddress(),
                city: formData.city,
                postalCode: formData.zipCode,
              },
              items: cart.map(item => ({
                name: item.name,
                sku: item.sku || '',
                quantity: item.quantity,
                price: item.price,
                imageUrl: item.image,
              })),
              shipping: shippingAfterDiscount > 0 ? {
                method: shippingSettings.rates[0]?.name || 'משלוח',
                cost: shippingAfterDiscount,
                address: buildFullAddress(),
                city: formData.city,
                postalCode: formData.zipCode,
              } : undefined,
              discountCode: appliedCoupons.length > 0 ? appliedCoupons[0].code : undefined,
              discountAmount: totalDiscount,
              orderData: {
                customer: formData,
                items: cart.map(item => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  variantTitle: item.variantTitle,
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  sku: item.sku || '',
                  image: item.image,
                  // 🆕 Include addons in order data
                  addons: item.addons,
                  addonTotal: item.addonTotal,
                })),
                shipping: {
                  method: shippingSettings.rates[0]?.name || 'משלוח',
                  cost: shippingAfterDiscount,
                },
                shippingAddress: {
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  company: formData.company || undefined,
                  address: buildFullAddress(),
                  street: formData.street,
                  houseNumber: formData.houseNumber,
                  apartment: formData.apartment || undefined,
                  floor: formData.floor || undefined,
                  city: formData.city,
                  zipCode: formData.zipCode || undefined,
                  phone: formData.phone,
                },
                billingAddress: {
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  address: buildFullAddress(),
                  city: formData.city,
                  zipCode: formData.zipCode || undefined,
                  phone: formData.phone,
                },
                notes: formData.notes,
                acceptsMarketing: formData.acceptsMarketing,
                createAccount: formData.createAccount,
                password: formData.password,
                creditUsed,
                giftCardCode: giftCardCoupon?.code,
                giftCardAmount,
                autoDiscounts: autoDiscounts.map(d => ({
                  id: d.id,
                  name: d.name,
                  type: d.type,
                  value: d.value,
                })),
              },
            }),
          });
          
          const data = await response.json();
          
          if (data.success && data.paymentUrl) {
            // Save cart data for thank-you page (in case callback doesn't have all info)
            const orderData = {
              items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                variantTitle: item.variantTitle,
                image: item.image,
                // 🆕 Include addons for thank you page
                addons: item.addons,
                addonTotal: item.addonTotal,
              })),
              subtotal: cartOriginalTotal,
              discount: totalDiscount,
              shipping: shippingAfterDiscount,
              total,
              couponCodes: appliedCoupons.map(c => c.code),
              orderDate: new Date().toISOString(),
              orderReference: data.orderReference,
              customer: formData,
            };
            localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderData));
            
            // Mark as redirecting
            setIsRedirecting(true);
            
            // Redirect to payment page
            window.location.href = data.paymentUrl;
          } else {
            setOrderError(data.error || 'שגיאה ביצירת עמוד תשלום');
          }
        } else {
          // Simulation mode - create order directly (backward compatibility)
          const primaryCoupon = appliedCoupons.length > 0 ? appliedCoupons[0] : null;
          
          // Build discount details breakdown
          const discountDetailsArray: Array<{
            type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member';
            code?: string;
            name: string;
            description?: string;
            amount: number;
          }> = [];
          
          // Add member discount
          if (memberDiscount > 0) {
            discountDetailsArray.push({
              type: 'member',
              name: 'הנחת חברי מועדון',
              description: '5% הנחה',
              amount: memberDiscount,
            });
          }
          
          // Add auto discounts
          autoDiscountResults.filter(d => engineAutoDiscounts.find(ed => ed.id === d.discountId)?.appliesTo !== 'member').forEach(d => {
            const discountInfo = autoDiscounts.find(ad => ad.id === d.discountId);
            if (discountInfo && d.amount > 0) {
              discountDetailsArray.push({
                type: 'auto',
                name: discountInfo.name || 'הנחה אוטומטית',
                description: discountInfo.type === 'percentage' ? `${discountInfo.value}% הנחה` : `הנחה של ₪${discountInfo.value}`,
                amount: d.amount,
              });
            }
          });
          
          // Add regular coupons (not gift cards)
          appliedCoupons.filter(c => c.type !== 'gift_card' && c.type !== 'free_shipping').forEach(coupon => {
            const discountResult = couponDiscountResults.find(r => r.discountId === coupon.id);
            if (discountResult && discountResult.amount > 0) {
              const getDescription = () => {
                switch (coupon.type) {
                  case 'percentage': return `${coupon.value}% הנחה`;
                  case 'fixed_amount': return `הנחה של ₪${coupon.value}`;
                  case 'buy_x_pay_y': return coupon.buyQuantity && coupon.payAmount ? `קנה ${coupon.buyQuantity} שלם ${coupon.payAmount}` : 'הנחת כמות';
                  default: return coupon.title || 'הנחה';
                }
              };
              discountDetailsArray.push({
                type: 'coupon',
                code: coupon.code,
                name: coupon.title || coupon.code,
                description: getDescription(),
                amount: discountResult.amount,
              });
            }
          });
          
          // Add gift card
          if (giftCardAmount > 0 && giftCardCoupon) {
            discountDetailsArray.push({
              type: 'gift_card',
              code: giftCardCoupon.code,
              name: 'גיפט קארד',
              description: `יתרה: ₪${giftCardCoupon.value}`,
              amount: giftCardAmount,
            });
          }
          
          // Add credit used
          if (creditUsed > 0) {
            discountDetailsArray.push({
              type: 'credit',
              name: 'קרדיט',
              description: 'יתרת קרדיט בחשבון',
              amount: creditUsed,
            });
          }
          
          const result = await createOrder(
            storeId || '',
            cart.map(item => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              variantTitle: item.variantTitle,
            })),
            formData,
            primaryCoupon ? {
              id: primaryCoupon.id,
              code: primaryCoupon.code,
              type: primaryCoupon.type,
              value: primaryCoupon.value,
            } : null,
            cartOriginalTotal,
            totalDiscount,
            shippingAfterDiscount,
            total,
            creditUsed,
            discountDetailsArray
          );

          if (result.success) {
            // Generate secure token for order verification
            const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
            
            // Save order summary to localStorage for thank you page
            const orderData = {
              items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                variantTitle: item.variantTitle,
                image: item.image,
              })),
              subtotal: cartOriginalTotal,
              discount: totalDiscount,
              shipping: shippingAfterDiscount,
              total,
              couponCodes: appliedCoupons.map(c => c.code),
              orderDate: new Date().toISOString(),
              orderNumber: result.orderNumber,
              token,
              customer: {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                address: buildFullAddress(),
                city: formData.city,
                zipCode: formData.zipCode,
              },
            };
            
            localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderData));
            
            // Mark abandoned cart as recovered if this was a recovery
            if (recoveredCartId) {
              try {
                const { markCartAsRecovered } = await import('@/app/shops/[slug]/admin/abandoned/actions');
                await markCartAsRecovered(recoveredCartId, result.orderId);
              } catch (error) {
                console.error('Failed to mark cart as recovered:', error);
              }
            }
            
            // Mark as redirecting BEFORE clearing cart to prevent flash of empty state
            setIsRedirecting(true);
            clearCart();
            clearCoupons();
            
            // Redirect to thank you page with order number in path and token in query
            router.push(`${basePath}/checkout/thank-you/${result.orderNumber}?t=${token}`);
          } else {
            setOrderError(result.error);
          }
        }
      } catch (error) {
        setOrderError('שגיאה בעיבוד ההזמנה');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Show loading state while redirecting to thank you page - ZARA style
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          {/* Minimal ZARA-style loader */}
          <div className="relative mb-12">
            <div className="w-px h-16 bg-black mx-auto animate-pulse" />
          </div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-black">
            מעבד
          </p>
        </div>
      </div>
    );
  }

  // Show loading while cart is hydrating from localStorage
  if (!isHydrated) {
    return (
      <div className="py-32 px-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-8 flex justify-center">
            <div className="w-px h-16 bg-black animate-pulse" />
          </div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-black">
            טוען
          </p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="py-32 px-6 text-center">
        <div className="max-w-md mx-auto">
          {/* Empty bag icon */}
          <div className="mb-8">
            <svg 
              width="120" 
              height="120" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#d1d5db" 
              strokeWidth="0.8"
              className="mx-auto"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h2 className="font-display text-2xl tracking-wide uppercase mb-3">העגלה ריקה</h2>
          <p className="text-gray-400 text-sm mb-10">נראה שעדיין לא הוספת פריטים לעגלה</p>
          <Link href={homeUrl} className="btn-primary">
            המשך בקניות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {['details', 'shipping', 'payment'].map((s, i) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                step === s ? 'bg-black text-white' : 
                ['details', 'shipping', 'payment'].indexOf(step) > i ? 'bg-black text-white' : 
                'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              <span className={`text-[11px] tracking-[0.15em] uppercase hidden sm:block ${
                step === s ? 'text-black' : 'text-gray-400'
              }`}>
                {s === 'details' && 'פרטים'}
                {s === 'shipping' && 'משלוח'}
                {s === 'payment' && 'תשלום'}
              </span>
              {i < 2 && <div className="w-12 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white p-8 shadow-sm">
              {step === 'details' && (
                <>
                  <h2 className="font-display text-xl mb-6">פרטי התקשרות</h2>
                  
                  {/* Login/Logged-in Section */}
                  {loggedInCustomer ? (
                    <div className="bg-green-50 border border-green-200 p-4 mb-6 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-800 font-medium mb-1">
                            שלום, {loggedInCustomer.firstName || loggedInCustomer.email}
                          </p>
                          <p className="text-xs text-green-600">
                            מחובר/ת כ-{loggedInCustomer.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="text-xs text-green-700 hover:text-green-900 underline underline-offset-4 hover:no-underline"
                        >
                          התנתק
                        </button>
                      </div>
                      {!loggedInCustomer.hasPassword && (
                        <p className="text-xs text-amber-700 bg-amber-50 -mx-4 -mb-4 mt-3 px-4 py-2 rounded-b border-t border-amber-200">
                          💡 תוכל להגדיר סיסמה לחשבונך באיזור האישי
                        </p>
                      )}
                    </div>
                  ) : showLoginForm ? (
                    <CheckoutLogin
                      onLoginSuccess={handleLoginSuccess}
                      onClose={() => setShowLoginForm(false)}
                      initialEmail={formData.email}
                      storeId={storeId || ''}
                    />
                  ) : (
                    <div className="bg-gray-50 p-4 mb-6 rounded">
                      <p className="text-sm text-gray-600 mb-2">
                        כבר חבר מועדון?{' '}
                        <button 
                          type="button" 
                          onClick={() => setShowLoginForm(true)}
                          className="text-black underline underline-offset-4 hover:no-underline cursor-pointer"
                        >
                          התחברות
                        </button>
                      </p>
                      <p className="text-xs text-gray-500">
                        חברי מועדון נהנים מהטבות בלעדיות, מעקב הזמנות ועוד
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                        אימייל *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => {
                          const email = e.target.value;
                          setFormData({...formData, email});
                          // Reset email check when email changes
                          if (formData.createAccount) {
                            setEmailExists(null);
                          }
                        }}
                        onBlur={() => {
                          // Check email when user leaves the field and createAccount is checked
                          if (formData.createAccount && formData.email) {
                            checkEmailExists(formData.email);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                          שם פרטי *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={e => setFormData({...formData, firstName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                          שם משפחה *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={e => setFormData({...formData, lastName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                        />
                      </div>
                    </div>
                    {/* Phone - based on settings */}
                    <div>
                      <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                        טלפון {checkoutSettings.requirePhone && '*'}
                      </label>
                      <input
                        type="tel"
                        required={checkoutSettings.requirePhone}
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                        placeholder="05X-XXXXXXX"
                      />
                    </div>

                    {/* Create Account Checkbox - Only show if not logged in */}
                    {!loggedInCustomer && (
                      <div className="pt-4 border-t border-gray-100">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.createAccount}
                            onChange={e => {
                              const checked = e.target.checked;
                              setFormData({...formData, createAccount: checked});
                              if (checked && formData.email) {
                                checkEmailExists(formData.email);
                              } else {
                                setEmailExists(null);
                              }
                            }}
                            className="mt-1 w-4 h-4 border-gray-300 rounded cursor-pointer"
                          />
                          <div>
                            <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                              צור חשבון והצטרף למועדון הלקוחות
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              קבל הנחות בלעדיות, צבור נקודות ועקוב אחרי ההזמנות שלך
                            </p>
                          </div>
                        </label>

                        {formData.createAccount && (
                          <div className="mt-4 mr-7">
                            {checkingEmail ? (
                              <p className="text-sm text-gray-500">בודק מייל...</p>
                            ) : emailExists?.hasAccount ? (
                              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                                <p className="text-sm text-blue-800 mb-2">
                                  כבר קיים חשבון עם כתובת מייל זו
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setShowLoginForm(true)}
                                  className="text-sm text-blue-600 underline underline-offset-4 hover:no-underline cursor-pointer"
                                >
                                  התחבר לחשבון הקיים
                                </button>
                              </div>
                            ) : emailExists?.exists ? (
                              <div className="bg-amber-50 border border-amber-200 p-4 rounded mb-4">
                                <p className="text-sm text-amber-800">
                                  ביצעת הזמנות בעבר עם מייל זה. הסיסמה תשמש לגישה לחשבונך.
                                </p>
                              </div>
                            ) : null}
                            
                            {!emailExists?.hasAccount && (
                              <>
                                <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                                  סיסמה *
                                </label>
                                <input
                                  type="password"
                                  required={formData.createAccount && !emailExists?.hasAccount}
                                  value={formData.password}
                                  onChange={e => setFormData({...formData, password: e.target.value})}
                                  className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                                  placeholder="לפחות 8 תווים"
                                  minLength={8}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Marketing Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.acceptsMarketing}
                        onChange={e => setFormData({...formData, acceptsMarketing: e.target.checked})}
                        className="mt-1 w-4 h-4 border-gray-300 rounded cursor-pointer"
                      />
                      <div>
                        <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                          אשמח לקבל עדכונים ומבצעים במייל
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          ניתן לבטל בכל עת
                        </p>
                      </div>
                    </label>
                  </div>
                </>
              )}

              {step === 'shipping' && (
                <>
                  <h2 className="font-display text-xl mb-6">כתובת למשלוח</h2>
                  <div className="space-y-4">
                    {/* Company field - based on settings */}
                    {checkoutSettings.requireCompany && (
                      <div>
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                          שם חברה
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={e => setFormData({...formData, company: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                          placeholder="שם החברה (אופציונלי)"
                        />
                      </div>
                    )}
                    
                    {/* City - required with autocomplete */}
                    <div>
                      <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                        עיר *
                      </label>
                      <Autocomplete
                        value={formData.city}
                        onChange={(value) => {
                          setFormData({...formData, city: value});
                          citySearch.setQuery(value);
                        }}
                        onSelect={(option) => {
                          setFormData({...formData, city: option.value, street: ''});
                          setSelectedCity(option.value);
                        }}
                        options={citySearch.cities.map((city) => ({
                          value: city.cityName,
                          label: city.cityName,
                        }))}
                        loading={citySearch.loading}
                        placeholder="התחל להקליד עיר..."
                        inputClassName="border-gray-200 focus:border-black"
                        required
                      />
                    </div>
                    
                    {/* Street and House Number - required */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                          רחוב *
                        </label>
                        <Autocomplete
                          value={formData.street}
                          onChange={(value) => {
                            setFormData({...formData, street: value});
                            streetSearch.setQuery(value);
                          }}
                          onSelect={(option) => {
                            setFormData({...formData, street: option.value});
                          }}
                          options={streetSearch.streets.map((street) => ({
                            value: street.streetName,
                            label: street.streetName,
                          }))}
                          loading={streetSearch.loading}
                          placeholder={selectedCity ? "התחל להקליד רחוב..." : "בחר עיר קודם"}
                          inputClassName="border-gray-200 focus:border-black"
                          disabled={!selectedCity}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                          מספר בית *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.houseNumber}
                          onChange={e => setFormData({...formData, houseNumber: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                          placeholder="12"
                        />
                      </div>
                    </div>
                    
                    {/* Apartment and Floor - optional */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                          דירה
                        </label>
                        <input
                          type="text"
                          value={formData.apartment}
                          onChange={e => setFormData({...formData, apartment: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                          placeholder="מספר דירה"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                          קומה
                        </label>
                        <input
                          type="text"
                          value={formData.floor}
                          onChange={e => setFormData({...formData, floor: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                          placeholder="מספר קומה"
                        />
                      </div>
                    </div>
                    
                    {/* Zip Code - based on settings */}
                    {checkoutSettings.showZipCode && (
                      <div>
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                          מיקוד
                        </label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={e => setFormData({...formData, zipCode: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                          placeholder="1234567"
                        />
                      </div>
                    )}
                    
                    {/* Notes - based on settings */}
                    {checkoutSettings.allowNotes && (
                      <div>
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                          הערות למשלוח
                        </label>
                        <textarea
                          rows={3}
                          value={formData.notes}
                          onChange={e => setFormData({...formData, notes: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors resize-none"
                          placeholder="הוראות מיוחדות לשליח..."
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {step === 'payment' && (
                <>
                  <h2 className="font-display text-xl mb-6">פרטי תשלום</h2>
                  <div className="space-y-4">
                    {/* Show payment error from URL - only if we're on payment step and error exists */}
                    {paymentError && step === 'payment' && (
                      <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          <span>התשלום נכשל. אנא נסה שנית.</span>
                        </div>
                      </div>
                    )}
                    
                    {hasActivePaymentProvider ? (
                      // Real payment - will redirect to payment provider
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="M2 10h20"/>
                                <path d="M6 16h4"/>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-blue-900">תשלום מאובטח</p>
                              <p className="text-sm text-blue-700">תועבר לעמוד תשלום מאובטח להשלמת הרכישה</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Payment methods icons */}
                        <div className="flex items-center justify-center gap-4 py-4">
                          <div className="text-[10px] tracking-wider text-gray-400 uppercase">אמצעי תשלום</div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Visa</span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Mastercard</span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Bit</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-400 text-center">
                          לאחר לחיצה על הכפתור תועבר לעמוד תשלום מאובטח
                        </p>
                      </div>
                    ) : (
                      // Simulation mode
                      <>
                        <div>
                          <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                            מספר כרטיס
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                              תוקף
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                              placeholder="MM/YY"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                              CVV
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                              placeholder="123"
                            />
                          </div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-100 p-4 text-sm text-yellow-700 flex items-center gap-2 rounded-lg">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          <span>מצב סימולציה - לא נדרשים פרטי כרטיס אמיתיים</span>
                        </div>
                      </>
                    )}
                    
                    {orderError && (
                      <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-600 rounded-lg">
                        {orderError}
                      </div>
                    )}
                    
                    {/* Terms and Conditions - based on settings */}
                    {checkoutSettings.termsRequired && (
                      <label className="flex items-start gap-3 cursor-pointer group pt-4 border-t border-gray-100">
                        <input
                          type="checkbox"
                          required
                          checked={formData.acceptTerms}
                          onChange={e => setFormData({...formData, acceptTerms: e.target.checked})}
                          className="mt-1 w-4 h-4 border-gray-300 rounded cursor-pointer"
                        />
                        <div>
                          <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                            קראתי ואני מאשר/ת את תנאי השימוש ומדיניות הפרטיות *
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-4 mt-8">
                {step !== 'details' && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(step === 'payment' ? 'shipping' : 'details');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="btn-secondary flex-1"
                  >
                    חזרה
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? 'מעבד...' : 
                   step === 'payment' ? `לתשלום ${formatPrice(total)}` : 'המשך'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Coupon - Separate Component */}
            <CouponInput
              storeId={storeId || ''}
              cartTotal={cartOriginalTotal}
              appliedCoupons={appliedCoupons}
              onApply={(coupon) => addCoupon(coupon)}
              onRemove={(couponId) => { 
                // מציאת הקופון שמוסר
                const removedCoupon = appliedCoupons.find(c => c.id === couponId);
                removeCoupon(couponId);
                
                // אם מסירים קופון טריגר, צריך להסיר גם את קופוני המתנה שהופעלו על ידו
                if (removedCoupon) {
                  const triggeredGiftCoupons = appliedCoupons.filter(
                    c => c.triggeredByCode?.toUpperCase() === removedCoupon.code.toUpperCase()
                  );
                  for (const giftCoupon of triggeredGiftCoupons) {
                    removeCoupon(giftCoupon.id);
                  }
                }
                
                setCouponWarning(null);
              }}
              email={formData.email}
              cartItems={cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
              }))}
              onTriggeredGiftCoupons={(giftCoupons) => {
                // הוספת קופוני מתנה שמופעלים אוטומטית
                for (const gc of giftCoupons) {
                  // וידוא שלא כבר מופעל
                  if (!appliedCoupons.some(c => c.id === gc.id)) {
                    addCoupon(gc);
                  }
                }
              }}
              hasNonStackableAutoDiscount={autoDiscounts.some(d => !d.stackable)}
              nonStackableAutoDiscountName={autoDiscounts.find(d => !d.stackable)?.name}
            />
            
            {/* Coupon Warning */}
            {couponWarning && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>{couponWarning}</span>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white p-6 shadow-sm">
              <h3 className="font-display text-xl mb-6">סיכום הזמנה</h3>
              
              <ul className="space-y-4 mb-6">
                {cart.map(item => (
                  <li key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.variantTitle && (
                        <p className="text-xs text-gray-500">{item.variantTitle}</p>
                      )}
                      <p className="text-sm text-gray-500">כמות: {item.quantity}</p>
                      <div className="flex flex-col gap-1">
                        {/* Show original and discounted price like cart sidebar */}
                        <div className="flex items-center gap-2">
                          {item.discountedPrice ? (
                            <>
                              <p className="text-sm text-green-600 font-medium">{formatPrice(item.discountedPrice * item.quantity)}</p>
                              <p className="text-xs text-gray-400 line-through">{formatPrice(item.price * item.quantity)}</p>
                            </>
                          ) : (
                            <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
                          )}
                        </div>
                        {/* Discount Badges - separate badge for each discount */}
                        {item.automaticDiscountName && (
                          <div className="flex flex-wrap gap-1">
                            {item.automaticDiscountName.split(' + ').map((name, i) => (
                              <span key={i} className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Addons Display */}
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-1.5 space-y-0.5 bg-gray-50 p-2 rounded text-xs">
                            {item.addons.map((addon, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-gray-600">{addon.name}: <span className="text-gray-800">{addon.displayValue}</span></span>
                                {addon.priceAdjustment > 0 && (
                                  <span className="text-green-600">+{formatPrice(addon.priceAdjustment)}</span>
                                )}
                              </div>
                            ))}
                            {item.addonTotal && item.addonTotal > 0 && (
                              <div className="text-gray-500 pt-1 border-t border-gray-200 flex justify-between">
                                <span>סה"כ תוספות:</span>
                                <span className="text-green-600">+{formatPrice(item.addonTotal * item.quantity)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <hr className="border-gray-100 mb-6" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">סכום לפני הנחות</span>
                  <span>{formatPrice(cartOriginalTotal)}</span>
                </div>
                
                {/* Member Discount */}
                {memberDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>הנחת חברי מועדון (5%)</span>
                    <span>-{formatPrice(memberDiscount)}</span>
                  </div>
                )}
                
                {/* Auto Product Discounts - show each discount with its name */}
                {autoDiscountResults.filter(d => engineAutoDiscounts.find(ed => ed.id === d.discountId)?.appliesTo !== 'member').map(d => {
                  const discountInfo = autoDiscounts.find(ad => ad.id === d.discountId);
                  return (
                    <div key={d.discountId} className="flex justify-between text-green-600">
                      <span>הנחה אוטומטית{discountInfo?.name ? `: ${discountInfo.name}` : ''}</span>
                      <span>-{formatPrice(d.amount)}</span>
                    </div>
                  );
                })}
                
                {/* Coupon Discounts - Each coupon shown separately with description */}
                {appliedCoupons.filter(c => c.type !== 'gift_card' && c.type !== 'free_shipping').map(coupon => {
                  const discountResult = couponDiscountResults.find(r => r.discountId === coupon.id);
                  if (!discountResult || discountResult.amount === 0) return null;
                  
                  // Format coupon description based on type
                  const getDiscountDescription = () => {
                    switch (coupon.type) {
                      case 'percentage':
                        return `${coupon.value}% הנחה`;
                      case 'fixed_amount':
                        return `הנחה של ${formatPrice(coupon.value)}`;
                      case 'buy_x_pay_y':
                        return coupon.buyQuantity && coupon.payAmount 
                          ? `קנה ${coupon.buyQuantity} שלם ${coupon.payAmount}`
                          : 'הנחת כמות';
                      case 'quantity_discount':
                        return 'הנחת כמות';
                      default:
                        return coupon.title || 'הנחה';
                    }
                  };
                  
                  return (
                    <div key={coupon.id} className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                          <line x1="7" y1="7" x2="7.01" y2="7"/>
                        </svg>
                        קופון {coupon.code} ({getDiscountDescription()})
                      </span>
                      <span>-{formatPrice(discountResult.amount)}</span>
                    </div>
                  );
                })}
                
                {/* Gift Card - Shown separately with balance info */}
                {giftCardAmount > 0 && giftCardCoupon && (
                  <div className="flex justify-between text-purple-600">
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="8" width="18" height="12" rx="2"/>
                        <path d="M12 8V3M12 3L9 6M12 3l3 3"/>
                        <path d="M7 12h10"/>
                      </svg>
                      גיפט קארד {giftCardCoupon.code}
                      <span className="text-xs text-purple-400">(יתרה: {formatPrice(giftCardCoupon.value)})</span>
                    </span>
                    <span>-{formatPrice(giftCardAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">משלוח</span>
                  {step === 'details' ? (
                    <span className="text-gray-400 text-xs">יחושב בשלב הבא</span>
                  ) : hasFreeShipping ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      חינם (קופון משלוח)
                    </span>
                  ) : shipping === 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      חינם
                    </span>
                  ) : (
                    <span>{formatPrice(shipping)}</span>
                  )}
                </div>
                {/* Free shipping threshold message */}
                {step !== 'details' && shipping === 0 && !hasFreeShipping && shippingSettings.enableFreeShipping && cartOriginalTotal >= shippingSettings.freeShippingThreshold && (
                  <p className="text-xs text-green-600">
                    ✓ משלוח חינם בקנייה מעל {formatPrice(shippingSettings.freeShippingThreshold)}
                  </p>
                )}
                {step !== 'details' && shipping > 0 && !hasFreeShipping && shippingSettings.enableFreeShipping && (
                  <p className="text-xs text-gray-400">
                    משלוח חינם בקנייה מעל {formatPrice(shippingSettings.freeShippingThreshold)}
                  </p>
                )}
              </div>

              {/* Credit Balance - Only show if logged in and has credit */}
              {loggedInCustomer && creditBalance > 0 && step !== 'details' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="M6 12h4"/>
                      </svg>
                      <span className="text-sm font-medium text-blue-800">יתרת קרדיט</span>
                    </div>
                    <span className="text-sm font-medium text-blue-800">{formatPrice(creditBalance)}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCredit}
                      onChange={(e) => setUseCredit(e.target.checked)}
                      className="w-4 h-4 border-blue-300 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-700">
                      השתמש בקרדיט {creditUsed > 0 && `(-${formatPrice(creditUsed)})`}
                    </span>
                  </label>
                </div>
              )}

              {/* Show credit used in summary */}
              {creditUsed > 0 && (
                <div className="flex justify-between text-sm text-blue-600 mt-4">
                  <span>קרדיט</span>
                  <span>-{formatPrice(creditUsed)}</span>
                </div>
              )}

              <hr className="border-gray-100 my-6" />

              <div className="flex justify-between text-lg font-display">
                <span>סה״כ</span>
                <span>{step === 'details' ? formatPrice(cartOriginalTotal - totalDiscount) : formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
