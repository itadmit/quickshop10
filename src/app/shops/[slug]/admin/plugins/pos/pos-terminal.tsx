'use client';

import { useState, useTransition } from 'react';
import { ProductSearch } from './product-search';
import { CustomerSection } from './customer-section';
import { CartSection } from './cart-section';
import { createPOSOrder } from './actions';

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
  type: 'product' | 'manual';
  productId?: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  description?: string;
}

export interface POSCustomer {
  type: 'existing' | 'new' | 'guest';
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    postalCode?: string;
  };
}

interface POSTerminalProps {
  storeId: string;
  storeSlug: string;
  initialProducts: Product[];
  categories: Category[];
  recentCustomers: Customer[];
}

export function POSTerminal({
  storeId,
  storeSlug,
  initialProducts,
  categories,
  recentCustomers,
}: POSTerminalProps) {
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
      });

      if (result.success && result.paymentUrl) {
        // Redirect to payment page
        window.location.href = result.paymentUrl;
      } else {
        setError(result.error || 'שגיאה ביצירת ההזמנה');
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">
      {/* Left Side - Products */}
      <div className="flex-1 p-4 lg:p-6 overflow-auto">
        <ProductSearch
          storeId={storeId}
          initialProducts={initialProducts}
          categories={categories}
          onAddToCart={addToCart}
          onAddManualItem={addManualItem}
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
        />
      </div>
    </div>
  );
}

