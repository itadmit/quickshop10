'use client';

import { useState, useEffect } from 'react';
import { getBundleComponentsForCart } from '@/app/shops/[slug]/admin/products/bundle-actions';

interface CartBundleComponentsProps {
  productId: string;
}

export function CartBundleComponents({ productId }: CartBundleComponentsProps) {
  const [components, setComponents] = useState<{ name: string; variantTitle?: string; quantity: number }[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    async function loadComponents() {
      try {
        const data = await getBundleComponentsForCart(productId);
        if (mounted) {
          setComponents(data?.components || null);
        }
      } catch (error) {
        console.error('Error loading bundle components:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    loadComponents();
    
    return () => {
      mounted = false;
    };
  }, [productId]);

  if (loading || !components || components.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 bg-gray-50 border border-gray-200 p-2">
      <div className="flex items-center gap-1 text-xs text-gray-700 mb-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span className="font-medium">כולל:</span>
      </div>
      <div className="space-y-0.5">
        {components.map((comp, i) => (
          <div key={i} className="text-[11px] text-gray-600 flex items-center gap-1">
            <span className="text-gray-400">•</span>
            <span>
              {comp.name}
              {comp.variantTitle && <span className="text-gray-400"> ({comp.variantTitle})</span>}
              {comp.quantity > 1 && <span className="text-gray-400"> ×{comp.quantity}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

