'use client';

import { useState } from 'react';
import type { POSCustomer } from './pos-terminal';

// ============================================
// Customer Section Component
// Customer details and shipping method selection
// ============================================

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  defaultAddress: unknown;
  totalOrders: number | null;
}

interface CustomerSectionProps {
  customer: POSCustomer;
  setCustomer: (customer: POSCustomer) => void;
  recentCustomers: Customer[];
  shippingMethod: 'pickup' | 'delivery';
  setShippingMethod: (method: 'pickup' | 'delivery') => void;
  shippingAmount: number;
  setShippingAmount: (amount: number) => void;
}

export function CustomerSection({
  customer,
  setCustomer,
  recentCustomers,
  shippingMethod,
  setShippingMethod,
  shippingAmount,
  setShippingAmount,
}: CustomerSectionProps) {
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter customers by search
  const filteredCustomers = recentCustomers.filter(c => {
    const query = searchQuery.toLowerCase();
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.phone || '').includes(query)
    );
  });

  // Select existing customer
  const selectCustomer = (c: Customer) => {
    const address = c.defaultAddress as { street?: string; city?: string; postalCode?: string } | null;
    setCustomer({
      type: 'existing',
      customerId: c.id,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email,
      email: c.email,
      phone: c.phone || '',
      address: address ? {
        street: address.street || '',
        city: address.city || '',
        zipCode: address.postalCode,
      } : undefined,
    });
    setShowCustomerSearch(false);
    setSearchQuery('');
  };

  // Clear customer
  const clearCustomer = () => {
    setCustomer({
      type: 'guest',
      name: '',
      email: '',
      phone: '',
    });
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          פרטי לקוח
        </h2>
        {customer.type === 'existing' && (
          <button
            onClick={clearCustomer}
            className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            נקה
          </button>
        )}
      </div>

      {/* Customer Search Button */}
      {customer.type !== 'existing' && (
        <button
          onClick={() => setShowCustomerSearch(true)}
          className="w-full flex items-center gap-2 px-3 py-2 mb-3 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          חיפוש לקוח קיים
        </button>
      )}

      {/* Selected Customer Display */}
      {customer.type === 'existing' && customer.name && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{customer.name}</p>
              <p className="text-xs text-gray-500">{customer.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Form */}
      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value, type: customer.type === 'existing' ? 'existing' : 'new' })}
            placeholder="שם מלא *"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            placeholder="טלפון *"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            dir="ltr"
          />
          <input
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            placeholder="אימייל *"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            dir="ltr"
          />
        </div>
      </div>

      {/* Shipping Method */}
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">אופציית משלוח</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShippingMethod('pickup');
              setShippingAmount(0);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors cursor-pointer ${
              shippingMethod === 'pickup'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            איסוף עצמי
          </button>
          <button
            onClick={() => setShippingMethod('delivery')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors cursor-pointer ${
              shippingMethod === 'delivery'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            משלוח
          </button>
        </div>

        {/* Delivery Address & Cost */}
        {shippingMethod === 'delivery' && (
          <div className="mt-3 space-y-2">
            {/* City */}
            <input
              type="text"
              value={customer.address?.city || ''}
              onChange={(e) => setCustomer({
                ...customer,
                address: { ...customer.address, city: e.target.value, street: customer.address?.street || '' },
              })}
              placeholder="עיר *"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            
            {/* Street + House Number */}
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={customer.address?.street || ''}
                onChange={(e) => setCustomer({
                  ...customer,
                  address: { ...customer.address, street: e.target.value, city: customer.address?.city || '' },
                })}
                placeholder="רחוב *"
                className="col-span-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <input
                type="text"
                value={customer.address?.houseNumber || ''}
                onChange={(e) => setCustomer({
                  ...customer,
                  address: { ...customer.address, houseNumber: e.target.value, street: customer.address?.street || '', city: customer.address?.city || '' },
                })}
                placeholder="מס׳ בית *"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Apartment + Floor + Zip */}
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={customer.address?.apartment || ''}
                onChange={(e) => setCustomer({
                  ...customer,
                  address: { ...customer.address, apartment: e.target.value, street: customer.address?.street || '', city: customer.address?.city || '' },
                })}
                placeholder="דירה"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <input
                type="text"
                value={customer.address?.floor || ''}
                onChange={(e) => setCustomer({
                  ...customer,
                  address: { ...customer.address, floor: e.target.value, street: customer.address?.street || '', city: customer.address?.city || '' },
                })}
                placeholder="קומה"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <input
                type="text"
                value={customer.address?.zipCode || ''}
                onChange={(e) => setCustomer({
                  ...customer,
                  address: { ...customer.address, zipCode: e.target.value, street: customer.address?.street || '', city: customer.address?.city || '' },
                })}
                placeholder="מיקוד"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                dir="ltr"
              />
            </div>
            
            {/* Shipping Cost */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">עלות משלוח</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₪</span>
                <input
                  type="number"
                  value={shippingAmount || ''}
                  onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className="w-full pr-8 pl-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowCustomerSearch(false)}
          />
          <div className="flex min-h-full items-start justify-center p-4 pt-20">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-4 border-b border-gray-200">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש לפי שם, אימייל או טלפון..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {filteredCustomers.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer text-right"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                          {(c.firstName || c.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {c.firstName || c.lastName 
                              ? `${c.firstName || ''} ${c.lastName || ''}`.trim()
                              : c.email}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{c.email}</p>
                        </div>
                        {c.totalOrders && c.totalOrders > 0 && (
                          <span className="text-xs text-gray-400">
                            {c.totalOrders} הזמנות
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    לא נמצאו לקוחות
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowCustomerSearch(false)}
                  className="w-full py-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  סגור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

