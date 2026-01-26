'use client';

import { useState, useTransition, useRef, useMemo } from 'react';
import { ProductSearch } from './product-search';
import { CustomerSection } from './customer-section';
import { CartSection } from './cart-section';
import { createPOSOrder, chargeWithQuickPayment, processExchangeRefund } from './actions';
import { QuickPaymentForm, type QuickPaymentFormRef } from '@/components/checkout/QuickPaymentForm';
import type { AppliedCoupon } from '@/lib/store-context';

// ============================================
// POS Terminal - Client Component
// Main POS interface with product search, cart, and checkout
// ============================================

interface Product {
  id: string;
  name: string;
  price: string | null;
  comparePrice: string | null;
  imageUrl: string | null;
  sku: string | null;
  barcode: string | null;
  hasVariants: boolean;
  inventory: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  defaultAddress: unknown;
  totalOrders: number | null;
}

export interface CartItem {
  id: string;
  type: 'product' | 'manual' | 'return'; // 🆕 return = מוצר מוחזר (מחיר שלילי)
  productId?: string;
  variantId?: string;
  name: string;
  price: number; // שלילי אם זה החזרה
  quantity: number;
  imageUrl?: string;
  description?: string;
  originalOrderId?: string; // 🆕 הזמנה מקורית (להחזרות)
}

export interface POSCustomer {
  type: 'existing' | 'new' | 'guest';
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    houseNumber?: string;
    apartment?: string;
    floor?: string;
    city: string;
    zipCode?: string;
  };
}

// 🆕 Quick Payments config
interface QuickPaymentConfig {
  enabled: boolean;
  publicKey?: string;
  testMode?: boolean;
}

interface POSTerminalProps {
  storeId: string;
  storeSlug: string;
  initialProducts: Product[];
  categories: Category[];
  recentCustomers: Customer[];
  quickPaymentConfig?: QuickPaymentConfig; // 🆕 Quick Payment configuration
  currentUserId?: string; // CRM Plugin: מי המשתמש שיוצר את ההזמנה
}

export function POSTerminal({
  storeId,
  storeSlug,
  initialProducts,
  categories,
  recentCustomers,
  quickPaymentConfig,
  currentUserId,
}: POSTerminalProps) {
  // 🆕 Mode: sale (רגיל) or exchange (החלפה/החזרה)
  const [mode, setMode] = useState<'sale' | 'exchange'>('sale');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Customer state
  const [customer, setCustomer] = useState<POSCustomer>({
    type: 'guest',
    name: '',
    email: '',
    phone: '',
  });
  
  // Shipping state
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [shippingAmount, setShippingAmount] = useState(0);
  
  // Discount state - using AppliedCoupon from checkout
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
  
  // Notes
  const [notes, setNotes] = useState('');
  
  // 🆕 Post-checkout actions
  const [runPostCheckout, setRunPostCheckout] = useState(true);
  
  // 🆕 Mark as paid (skip payment gateway)
  const [markAsPaid, setMarkAsPaid] = useState(false);
  
  // 🆕 Quick Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const quickPaymentRef = useRef<QuickPaymentFormRef>(null);
  
  // 🆕 Exchange refund state
  const [originalOrderIdForRefund, setOriginalOrderIdForRefund] = useState<string>('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  
  // Loading state
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate discount amount from applied coupons
  const discountAmount = useMemo(() => {
    return appliedCoupons.reduce((sum, coupon) => {
      if (coupon.isGiftCard) {
        // Gift card - use the value directly (already validated amount)
        return sum + coupon.value;
      } else if (coupon.type === 'percentage') {
        // Percentage discount
        return sum + (subtotal * (coupon.value / 100));
      } else if (coupon.type === 'fixed_amount') {
        // Fixed amount discount
        return sum + coupon.value;
      }
      // For other types (buy_x_get_y, etc.) - handled differently
      return sum;
    }, 0);
  }, [appliedCoupons, subtotal]);
  
  const total = subtotal - discountAmount + shippingAmount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id && item.type === 'product');
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        type: 'product',
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price || '0'),
        quantity: 1,
        imageUrl: product.imageUrl || undefined,
      };
      setCart([...cart, newItem]);
    }
  };

  // Add manual item to cart
  const addManualItem = (name: string, price: number, description?: string) => {
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      type: 'manual',
      name,
      price,
      quantity: 1,
      description,
    };
    setCart([...cart, newItem]);
  };

  // 🆕 Add return item to cart (negative price - credit to customer)
  const addReturnItem = (product: Product, originalOrderId?: string) => {
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      type: 'return',
      productId: product.id,
      name: `החזרה: ${product.name}`,
      price: -Math.abs(parseFloat(product.price || '0')), // מחיר שלילי
      quantity: 1,
      imageUrl: product.imageUrl || undefined,
      originalOrderId,
    };
    setCart([...cart, newItem]);
  };

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setAppliedCoupons([]);
    setNotes('');
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      setError('העגלה ריקה');
      return;
    }

    if (!customer.name || !customer.email || !customer.phone) {
      setError('נא למלא את פרטי הלקוח');
      return;
    }

    // 🆕 If exchange mode with customer credit (negative total), need to process refund
    if (mode === 'exchange' && total < 0 && !originalOrderIdForRefund) {
      setShowRefundModal(true);
      return;
    }

    setError(null);

    startTransition(async () => {
      // 🆕 If Quick Payments enabled and not marked as paid, show payment modal first
      const needsPayment = total > 0 && !markAsPaid;
      const useQuickPayment = needsPayment && quickPaymentConfig?.enabled && !!quickPaymentConfig.publicKey;
      
      const result = await createPOSOrder(storeId, storeSlug, {
        items: cart,
        customer,
        shippingMethod,
        shippingAmount,
        discountCode: appliedCoupons.length > 0 ? appliedCoupons.map(c => c.code).join(',') : undefined,
        discountAmount,
        notes: notes || undefined,
        subtotal,
        total,
        runPostCheckout, // 🆕 פעולות פוסט-צ'קאאוט
        isExchange: mode === 'exchange', // 🆕 סימון שזו החלפה
        markAsPaid, // 🆕 סמן כשולם (ללא תשלום)
        skipPaymentProvider: useQuickPayment, // 🆕 דלג על ספק תשלום אם יש Quick Payment
        createdByUserId: currentUserId, // CRM Plugin: מי יצר את ההזמנה
      });

      if (result.success) {
        // 🆕 If Quick Payments - show modal to collect card details
        if (useQuickPayment && result.orderId) {
          setPendingOrderId(result.orderId);
          setShowPaymentModal(true);
          return;
        }
        
        if (result.paymentUrl) {
          // Redirect to payment page
          window.location.href = result.paymentUrl;
        } else {
          // Zero payment or no provider - order created successfully
          handleOrderSuccess(result.orderId!);
        }
      } else {
        setError(result.error || 'שגיאה ביצירת ההזמנה');
      }
    });
  };

  // 🆕 Handle Quick Payment submission
  const handleQuickPayment = async () => {
    if (!quickPaymentRef.current || !pendingOrderId) return;
    
    setPaymentError(null);
    setIsProcessingPayment(true);
    
    try {
      // Tokenize card
      const { token, cardMask, cardType } = await quickPaymentRef.current.tokenize({
        amount: total,
        currency: 'ILS',
        orderId: pendingOrderId,
        productName: `הזמנה בקופה`,
        customerEmail: customer.email,
        customerName: customer.name,
        customerPhone: customer.phone,
      });
      
      // Charge with token
      const chargeResult = await chargeWithQuickPayment(storeSlug, {
        token,
        orderId: pendingOrderId,
        amount: total,
        cardMask,
        cardType,
      });
      
      if (chargeResult.success) {
        setShowPaymentModal(false);
        handleOrderSuccess(pendingOrderId);
      } else {
        setPaymentError(chargeResult.error || 'שגיאה בביצוע התשלום');
      }
    } catch (err) {
      console.error('Quick payment error:', err);
      setPaymentError(err instanceof Error ? err.message : 'שגיאה בביצוע התשלום');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // 🆕 Handle successful order
  const handleOrderSuccess = (orderId: string) => {
    setCart([]);
    setCustomer({
      name: '',
      email: '',
      phone: '',
      type: 'guest',
    });
    setAppliedCoupons([]);
    setNotes('');
    setPendingOrderId(null);
    setOriginalOrderIdForRefund('');
    // Refresh page to show success message
    window.location.href = `?payment=success&orderId=${orderId}`;
  };

  // 🆕 Handle exchange refund (when customer gets credit back)
  const handleExchangeRefund = async () => {
    if (!originalOrderIdForRefund.trim()) {
      setRefundError('נא להזין מספר הזמנה מקורית');
      return;
    }

    setRefundError(null);
    setIsProcessingRefund(true);

    try {
      // First process the refund for the difference
      const refundResult = await processExchangeRefund(
        storeSlug,
        originalOrderIdForRefund.trim(),
        Math.abs(total),
        `זיכוי בגין החלפה - פער לטובת הלקוח`
      );

      if (!refundResult.success) {
        setRefundError(refundResult.error || 'שגיאה בביצוע הזיכוי');
        setIsProcessingRefund(false);
        return;
      }

      // Now create the exchange order (total will be 0 after refund credit)
      const result = await createPOSOrder(storeId, storeSlug, {
        items: cart,
        customer,
        shippingMethod,
        shippingAmount,
        discountCode: appliedCoupons.length > 0 ? appliedCoupons.map(c => c.code).join(',') : undefined,
        discountAmount: discountAmount + Math.abs(total), // Add the refund as discount
        notes: `${notes || ''}\nזיכוי מהזמנה ${originalOrderIdForRefund}: ₪${Math.abs(total).toFixed(2)}`.trim(),
        subtotal,
        total: 0, // After refund, total is 0
        runPostCheckout,
        isExchange: true,
        markAsPaid: true, // It's paid via refund credit
      });

      if (result.success) {
        setShowRefundModal(false);
        handleOrderSuccess(result.orderId!);
      } else {
        setRefundError(result.error || 'שגיאה ביצירת ההזמנה');
      }
    } catch (err) {
      console.error('Exchange refund error:', err);
      setRefundError(err instanceof Error ? err.message : 'שגיאה בביצוע הזיכוי');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // 🆕 Handle skip refund - create order without processing refund
  const handleSkipRefund = async () => {
    setRefundError(null);
    setIsProcessingRefund(true);

    try {
      // Create the exchange order without refund - keep the difference as store credit/note
      const result = await createPOSOrder(storeId, storeSlug, {
        items: cart,
        customer,
        shippingMethod,
        shippingAmount,
        discountCode: appliedCoupons.length > 0 ? appliedCoupons.map(c => c.code).join(',') : undefined,
        discountAmount,
        notes: `${notes || ''}\nהפרש לטובת הלקוח (ללא זיכוי): ₪${Math.abs(total).toFixed(2)}`.trim(),
        subtotal,
        total, // Keep the negative total as-is
        runPostCheckout,
        isExchange: true,
        markAsPaid: true, // Mark as completed
      });

      if (result.success) {
        setShowRefundModal(false);
        handleOrderSuccess(result.orderId!);
      } else {
        setRefundError(result.error || 'שגיאה ביצירת ההזמנה');
      }
    } catch (err) {
      console.error('Skip refund error:', err);
      setRefundError(err instanceof Error ? err.message : 'שגיאה ביצירת ההזמנה');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // 🆕 Calculate returns and purchases separately
  const returnItems = cart.filter(item => item.type === 'return');
  const purchaseItems = cart.filter(item => item.type !== 'return');
  const returnTotal = returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const purchaseTotal = purchaseItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">
      {/* Left Side - Products */}
      <div className="flex-1 p-4 lg:p-6 overflow-auto">
        {/* 🆕 Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('sale')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'sale'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            מכירה
          </button>
          <button
            onClick={() => setMode('exchange')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'exchange'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            החלפה / החזרה
          </button>
        </div>

        {/* Exchange Mode Info */}
        {mode === 'exchange' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-orange-800">מצב החלפה / החזרה</p>
                <p className="text-orange-700 mt-1">
                  לחץ <strong>"הוסף להחזרה"</strong> על מוצר כדי להוסיף אותו כזיכוי (יחזור למלאי).
                  לאחר מכן הוסף את המוצר החדש להחלפה.
                </p>
              </div>
            </div>
          </div>
        )}

        <ProductSearch
          storeId={storeId}
          initialProducts={initialProducts}
          categories={categories}
          onAddToCart={addToCart}
          onAddManualItem={addManualItem}
          onAddReturnItem={mode === 'exchange' ? addReturnItem : undefined}
          isExchangeMode={mode === 'exchange'}
        />
      </div>

      {/* Right Side - Customer & Cart */}
      <div className="w-full lg:w-[420px] bg-white border-t lg:border-t-0 lg:border-r border-gray-200 flex flex-col">
        {/* Customer Section */}
        <CustomerSection
          customer={customer}
          setCustomer={setCustomer}
          recentCustomers={recentCustomers}
          shippingMethod={shippingMethod}
          setShippingMethod={setShippingMethod}
          shippingAmount={shippingAmount}
          setShippingAmount={setShippingAmount}
        />

        {/* Cart Section */}
        <CartSection
          cart={cart}
          updateQuantity={updateQuantity}
          removeItem={removeItem}
          clearCart={clearCart}
          subtotal={subtotal}
          storeId={storeId}
          appliedCoupons={appliedCoupons}
          onApplyCoupon={(coupon) => setAppliedCoupons(prev => [...prev, coupon])}
          onRemoveCoupon={(couponId) => setAppliedCoupons(prev => prev.filter(c => c.id !== couponId))}
          discountAmount={discountAmount}
          shippingAmount={shippingAmount}
          total={total}
          itemCount={itemCount}
          notes={notes}
          setNotes={setNotes}
          onCheckout={handleCheckout}
          isPending={isPending}
          error={error}
          isExchangeMode={mode === 'exchange'}
          returnTotal={returnTotal}
          purchaseTotal={purchaseTotal}
          runPostCheckout={runPostCheckout}
          setRunPostCheckout={setRunPostCheckout}
          markAsPaid={markAsPaid}
          setMarkAsPaid={setMarkAsPaid}
        />
      </div>

      {/* 🆕 Refund Modal for Exchange with Customer Credit */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => {
              if (!isProcessingRefund) {
                setShowRefundModal(false);
                setRefundError(null);
              }
            }}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">זיכוי בגין החלפה</h3>
                {!isProcessingRefund && (
                  <button
                    onClick={() => {
                      setShowRefundModal(false);
                      setRefundError(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Refund Amount */}
              <div className="p-4 bg-green-50 border-b border-green-200">
                <div className="text-center">
                  <p className="text-sm text-green-600 mb-1">סכום לזיכוי ללקוח</p>
                  <p className="text-3xl font-bold text-green-700">₪{Math.abs(total).toFixed(2)}</p>
                </div>
              </div>

              {/* Form */}
              <div className="p-4 space-y-4">
                {refundError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {refundError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מספר הזמנה מקורית לזיכוי *
                  </label>
                  <input
                    type="text"
                    value={originalOrderIdForRefund}
                    onChange={(e) => setOriginalOrderIdForRefund(e.target.value)}
                    placeholder="לדוגמה: #1234 או UUID"
                    disabled={isProcessingRefund}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    הזן את מספר ההזמנה המקורית שממנה יבוצע הזיכוי
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>
                      הזיכוי יבוצע דרך ספק התשלום המקורי (Pelecard/PayMe).
                      אם ההזמנה שולמה במזומן - אי אפשר לזכות.
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-200 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRefundModal(false);
                      setRefundError(null);
                    }}
                    disabled={isProcessingRefund}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleExchangeRefund}
                    disabled={isProcessingRefund || !originalOrderIdForRefund.trim()}
                    className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessingRefund ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>מעבד זיכוי...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>בצע זיכוי ₪{Math.abs(total).toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Skip refund button */}
                <button
                  onClick={handleSkipRefund}
                  disabled={isProcessingRefund}
                  className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingRefund ? (
                    <span>מעבד...</span>
                  ) : (
                    <span>המשך ללא זיכוי (ההפרש ישאר +₪{Math.abs(total).toFixed(2)})</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Quick Payment Modal */}
      {showPaymentModal && quickPaymentConfig?.enabled && quickPaymentConfig.publicKey && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => {
              if (!isProcessingPayment) {
                setShowPaymentModal(false);
                setPendingOrderId(null);
              }
            }}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">תשלום בכרטיס אשראי</h3>
                {!isProcessingPayment && (
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPendingOrderId(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Amount */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">סכום לתשלום</p>
                  <p className="text-3xl font-bold">₪{total.toFixed(2)}</p>
                </div>
              </div>

              {/* Payment Form */}
              <div className="p-4">
                {paymentError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {paymentError}
                  </div>
                )}

                <QuickPaymentForm
                  ref={quickPaymentRef}
                  publicKey={quickPaymentConfig.publicKey}
                  testMode={quickPaymentConfig.testMode ?? false}
                  storeSlug={storeSlug}
                  disabled={isProcessingPayment}
                />
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleQuickPayment}
                  disabled={isProcessingPayment}
                  className="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>מעבד תשלום...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>שלם ₪{total.toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

