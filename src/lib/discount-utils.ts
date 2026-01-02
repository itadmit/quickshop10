// Utility functions for discount calculations (client-side safe)

export type AutomaticDiscountResult = {
  id: string;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  categoryIds: string[];
  productIds: string[];
  stackable: boolean;
};

export type CartItemForDiscount = {
  productId: string;
  categoryId?: string;
  price: number;
  quantity: number;
};

// Calculate discount amount for a specific item
export function calculateItemDiscount(
  item: CartItemForDiscount,
  discount: AutomaticDiscountResult
): number {
  const itemTotal = item.price * item.quantity;
  
  // Check if discount applies to this item
  if (discount.appliesTo === 'category' && item.categoryId) {
    if (!discount.categoryIds.includes(item.categoryId)) {
      return 0;
    }
  }
  
  if (discount.appliesTo === 'product') {
    if (!discount.productIds.includes(item.productId)) {
      return 0;
    }
  }

  // Calculate discount amount
  if (discount.type === 'percentage') {
    return (itemTotal * discount.value) / 100;
  } else if (discount.type === 'fixed_amount') {
    return Math.min(discount.value, itemTotal);
  }
  
  return 0;
}

// Calculate total discount for all items
export function calculateTotalDiscount(
  cartItems: CartItemForDiscount[],
  cartTotal: number,
  discounts: AutomaticDiscountResult[]
): { memberDiscount: number; productDiscounts: number; totalDiscount: number } {
  let memberDiscount = 0;
  let productDiscounts = 0;

  for (const discount of discounts) {
    if (discount.appliesTo === 'member' || discount.appliesTo === 'all') {
      // Apply to entire cart
      if (discount.type === 'percentage') {
        const amount = (cartTotal * discount.value) / 100;
        if (discount.appliesTo === 'member') {
          memberDiscount += amount;
        } else {
          productDiscounts += amount;
        }
      } else if (discount.type === 'fixed_amount') {
        if (discount.appliesTo === 'member') {
          memberDiscount += discount.value;
        } else {
          productDiscounts += Math.min(discount.value, cartTotal);
        }
      }
    } else {
      // Apply to specific items
      for (const item of cartItems) {
        productDiscounts += calculateItemDiscount(item, discount);
      }
    }
  }

  return {
    memberDiscount,
    productDiscounts,
    totalDiscount: memberDiscount + productDiscounts,
  };
}

