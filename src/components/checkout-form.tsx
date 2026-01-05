'use client';

import { useStore } from '@/lib/store-context';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CouponInput, type AppliedCoupon } from './coupon-input';
import { CheckoutLogin } from './checkout-login';
import { createOrder } from '@/app/actions/order';
import { getAutomaticDiscounts, type AutomaticDiscountResult, type CartItemForDiscount } from '@/app/actions/automatic-discount';
import { calculateDiscounts, dbDiscountToEngine, type CartItem as EngineCartItem, type Discount } from '@/lib/discount-engine';
import { tracker } from '@/lib/tracking';
import { getProductsByIds } from '@/app/actions/products';

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
  const { cart, cartTotal, clearCart, isHydrated, addGiftItem, removeGiftItemsByCoupon } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const homeUrl = basePath || '/';
  
  // Check for payment error in URL (only show for payment-related errors)
  const errorParam = searchParams.get('error');
  const paymentError = errorParam === 'payment_failed' || errorParam === 'payment_error' || errorParam === 'payment_cancelled';
  const [step, setStep] = useState<'details' | 'shipping' | 'payment'>('details');
  
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
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
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
  
  // Re-validate coupons when cart total DECREASES (no loop - uses functional update)
  const prevCartTotalRef = useRef(cartTotal);
  useEffect(() => {
    // Only check when cart total decreased
    if (cartTotal >= prevCartTotalRef.current) {
      prevCartTotalRef.current = cartTotal;
      return;
    }
    prevCartTotalRef.current = cartTotal;
    
    // Use functional update to avoid stale closure and infinite loops
    setAppliedCoupons(currentCoupons => {
      if (currentCoupons.length === 0) return currentCoupons;
      
      const invalidCoupons = currentCoupons.filter(coupon => 
        coupon.minimumAmount && cartTotal < coupon.minimumAmount
      );
      
      if (invalidCoupons.length === 0) return currentCoupons;
      
      // Show warning
      const removedCodes = invalidCoupons.map(c => c.code).join(', ');
      setCouponWarning(
        invalidCoupons.length === 1
          ? `הקופון ${removedCodes} הוסר - סכום ההזמנה נמוך מהמינימום הנדרש`
          : `הקופונים ${removedCodes} הוסרו - סכום ההזמנה נמוך מהמינימום הנדרש`
      );
      setTimeout(() => setCouponWarning(null), 5000);
      
      // Return filtered coupons
      return currentCoupons.filter(coupon =>
        !coupon.minimumAmount || cartTotal >= coupon.minimumAmount
      );
    });
  }, [cartTotal]); // Only depends on cartTotal - no appliedCoupons dependency!
  
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
      const discounts = await getAutomaticDiscounts(storeId, cartItems, cartTotal, email);
      setAutoDiscounts(discounts);
    } catch (error) {
      console.error('Failed to fetch auto discounts:', error);
    } finally {
      setLoadingAutoDiscounts(false);
    }
  }, [cart, cartTotal]);
  
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

        // סינון מוצרים רגילים (לא מתנה) שעונים על התנאים
        const regularItems = cart.filter(item => !item.isGift);
        
        const matchingItems = regularItems.filter(item => {
          // בדיקת החרגות
          if (coupon.excludeProductIds?.includes(item.productId)) return false;
          
          // בדיקת התאמה לפי appliesTo
          if (coupon.appliesTo === 'all') return true;
          if (coupon.appliesTo === 'product' && coupon.productIds?.includes(item.productId)) return true;
          return false;
        });

        const matchingTotal = matchingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const matchingQty = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // בדיקת תנאים: minimumAmount או minimumQuantity
        const meetsAmountCondition = !coupon.minimumAmount || matchingTotal >= coupon.minimumAmount;
        const meetsQuantityCondition = !coupon.minimumQuantity || matchingQty >= coupon.minimumQuantity;
        const meetsCondition = meetsAmountCondition && meetsQuantityCondition && matchingItems.length > 0;

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
  // Note: categoryId will be fetched from products if needed for discount matching
  const cartItemsForEngine: EngineCartItem[] = cart.map(item => ({
    id: item.id || `item-${item.productId}`,
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.image,
    // categoryId will be undefined for now - discounts will match by productId if needed
    categoryId: undefined,
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
  const discountCalc = calculateDiscounts(cartItemsForEngine, allDiscounts, {
    isMember: !!loggedInCustomer?.hasPassword,
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
    const afterAllDiscounts = cartTotal - memberDiscount - autoProductDiscount - couponDiscount;
    giftCardAmount = Math.min(giftCardCoupon.value, afterAllDiscounts);
  }
  
  // Check for free shipping
  const hasFreeShipping = discountCalc.freeShipping || appliedCoupons.some(c => c.type === 'free_shipping');

  // Calculate shipping based on store settings
  const baseShippingRate = shippingSettings.rates[0]?.price || 29;
  const freeShippingThreshold = shippingSettings.enableFreeShipping ? shippingSettings.freeShippingThreshold : Infinity;
  const shipping = cartTotal >= freeShippingThreshold ? 0 : baseShippingRate;
  const shippingAfterDiscount = hasFreeShipping ? 0 : shipping;
  const totalDiscount = memberDiscount + autoProductDiscount + couponDiscount + giftCardAmount;
  const subtotalAfterDiscount = cartTotal - totalDiscount + shippingAfterDiscount;
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
      totalValue: cartTotal,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      currency: 'ILS',
    };
    
    if (step === 'details') {
      // Track InitiateCheckout when moving from details to shipping
      tracker.initiateCheckout(cartData);
      setStep('shipping');
    } else if (step === 'shipping') {
      // Track AddShippingInfo when moving from shipping to payment
      tracker.addShippingInfo({
        ...cartData,
        shippingMethod: shippingSettings.rates[0]?.name || 'משלוח',
      });
      setStep('payment');
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
                sku: item.productId,
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
                  sku: item.productId,
                  image: item.image,
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
              })),
              subtotal: cartTotal,
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
          const result = await createOrder(
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
            cartTotal,
            totalDiscount,
            shippingAfterDiscount,
            total,
            creditUsed
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
              subtotal: cartTotal,
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
            
            // Mark as redirecting BEFORE clearing cart to prevent flash of empty state
            setIsRedirecting(true);
            clearCart();
            
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
                    
                    {/* City - required */}
                    <div>
                      <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                        עיר *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                        placeholder="תל אביב"
                      />
                    </div>
                    
                    {/* Street and House Number - required */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                          רחוב *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.street}
                          onChange={e => setFormData({...formData, street: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                          placeholder="שם הרחוב"
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
                    onClick={() => setStep(step === 'payment' ? 'shipping' : 'details')}
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
                   step === 'payment' ? `לתשלום ₪${total.toFixed(0)}` : 'המשך'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Coupon - Separate Component */}
            <CouponInput
              storeId={storeId || ''}
              cartTotal={cartTotal}
              appliedCoupons={appliedCoupons}
              onApply={(coupon) => setAppliedCoupons(prev => [...prev, coupon])}
              onRemove={(couponId) => { 
                setAppliedCoupons(prev => prev.filter(c => c.id !== couponId)); 
                setCouponWarning(null);
                // מחיקת מוצרי מתנה של הקופון שנמחק
                removeGiftItemsByCoupon(couponId);
              }}
              email={formData.email}
              cartItems={cart.map(item => ({
                productId: item.productId,
                categoryId: undefined, // TODO: צריך להוסיף categoryId ל-cart items
                quantity: item.quantity,
              }))}
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
                    <div className="w-16 h-20 bg-gray-50 overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.variantTitle && (
                        <p className="text-xs text-gray-500">{item.variantTitle}</p>
                      )}
                      <p className="text-sm text-gray-500">כמות: {item.quantity}</p>
                      <p className="text-sm">₪{(item.price * item.quantity).toFixed(0)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <hr className="border-gray-100 mb-6" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">סכום ביניים</span>
                  <span>₪{cartTotal.toFixed(0)}</span>
                </div>
                
                {/* Member Discount */}
                {memberDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>הנחת חברי מועדון (5%)</span>
                    <span>-₪{memberDiscount.toFixed(0)}</span>
                  </div>
                )}
                
                {/* Auto Product Discounts */}
                {autoProductDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>הנחה אוטומטית</span>
                    <span>-₪{autoProductDiscount.toFixed(0)}</span>
                  </div>
                )}
                
                {/* Coupon Discounts */}
                {appliedCoupons.length > 0 && couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>קופונים ({appliedCoupons.filter(c => c.type !== 'free_shipping').map(c => c.code).join(', ')})</span>
                    <span>-₪{couponDiscount.toFixed(0)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">משלוח</span>
                  {step === 'details' ? (
                    <span className="text-gray-400 text-xs">יחושב בשלב הבא</span>
                  ) : hasFreeShipping ? (
                    <span className="text-green-600">חינם (קופון)</span>
                  ) : (
                    <span>{shipping === 0 ? 'חינם' : `₪${shipping}`}</span>
                  )}
                </div>
                {step !== 'details' && shipping > 0 && !hasFreeShipping && shippingSettings.enableFreeShipping && (
                  <p className="text-xs text-gray-400">
                    משלוח חינם בהזמנה מעל ₪{shippingSettings.freeShippingThreshold}
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
                    <span className="text-sm font-medium text-blue-800">₪{creditBalance.toFixed(0)}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCredit}
                      onChange={(e) => setUseCredit(e.target.checked)}
                      className="w-4 h-4 border-blue-300 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-700">
                      השתמש בקרדיט {creditUsed > 0 && `(-₪${creditUsed.toFixed(0)})`}
                    </span>
                  </label>
                </div>
              )}

              {/* Show credit used in summary */}
              {creditUsed > 0 && (
                <div className="flex justify-between text-sm text-blue-600 mt-4">
                  <span>קרדיט</span>
                  <span>-₪{creditUsed.toFixed(0)}</span>
                </div>
              )}

              <hr className="border-gray-100 my-6" />

              <div className="flex justify-between text-lg font-display">
                <span>סה״כ</span>
                <span>₪{step === 'details' ? (cartTotal - totalDiscount).toFixed(0) : total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
