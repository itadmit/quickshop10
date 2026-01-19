'use client';

import { useState, useTransition, useRef } from 'react';
import { ProductSearch } from './product-search';
import { CustomerSection } from './customer-section';
import { CartSection } from './cart-section';
import { createPOSOrder, chargeWithQuickPayment } from './actions';
import { QuickPaymentForm, type QuickPaymentFormRef } from '@/components/checkout/QuickPaymentForm';

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
}

export function POSTerminal({
  storeId,
  storeSlug,
  initialProducts,
  categories,
  recentCustomers,
  quickPaymentConfig,
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
  
  // Discount state
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  
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
  
  // Loading state
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
    setDiscountCode('');
    setDiscountAmount(0);
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
        discountCode: discountCode || undefined,
        discountAmount,
        notes: notes || undefined,
        subtotal,
        total,
        runPostCheckout, // 🆕 פעולות פוסט-צ'קאאוט
        isExchange: mode === 'exchange', // 🆕 סימון שזו החלפה
        markAsPaid, // 🆕 סמן כשולם (ללא תשלום)
        skipPaymentProvider: useQuickPayment, // 🆕 דלג על ספק תשלום אם יש Quick Payment
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
    setDiscountCode('');
    setDiscountAmount(0);
    setNotes('');
    setPendingOrderId(null);
    // Refresh page to show success message
    window.location.href = `?payment=success&orderId=${orderId}`;
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
          discountCode={discountCode}
          setDiscountCode={setDiscountCode}
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

