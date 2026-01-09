'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createShippingZone, 
  updateShippingZone, 
  deleteShippingZone,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  createPickupLocation,
  updatePickupLocation,
  deletePickupLocation,
} from './actions';

// ============================================
// Types
// ============================================

interface ShippingMethodConditions {
  minOrderAmount?: number;
  maxOrderAmount?: number;
  minWeight?: number;
  maxWeight?: number;
  weightRate?: number;
  baseWeight?: number;
}

interface ShippingMethod {
  id: string;
  zoneId: string;
  name: string;
  description: string | null;
  type: 'flat_rate' | 'free' | 'weight_based' | 'price_based' | 'local_pickup';
  price: string;
  conditions: ShippingMethodConditions | null;
  estimatedDays: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface ShippingZone {
  id: string;
  storeId: string;
  name: string;
  countries: string[];
  isDefault: boolean;
  isActive: boolean;
  methods: ShippingMethod[];
}

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  hours: string | null;
  instructions: string | null;
  isActive: boolean;
}

interface Props {
  storeId: string;
  storeSlug: string;
  initialZones: ShippingZone[];
  initialPickupLocations: PickupLocation[];
}

// ============================================
// Country Data
// ============================================

const COMMON_COUNTRIES = [
  { code: 'IL', name: 'ישראל' },
  { code: 'US', name: 'ארה"ב' },
  { code: 'GB', name: 'בריטניה' },
  { code: 'DE', name: 'גרמניה' },
  { code: 'FR', name: 'צרפת' },
  { code: 'CA', name: 'קנדה' },
  { code: 'AU', name: 'אוסטרליה' },
  { code: '*', name: 'כל העולם' },
];

const METHOD_TYPES = [
  { value: 'flat_rate', label: 'מחיר קבוע' },
  { value: 'free', label: 'משלוח חינם' },
  { value: 'weight_based', label: 'לפי משקל' },
  { value: 'price_based', label: 'לפי סכום הזמנה' },
  { value: 'local_pickup', label: 'איסוף עצמי' },
] as const;

// ============================================
// Main Component
// ============================================

export function ShippingZonesManager({ 
  storeId, 
  storeSlug,
  initialZones, 
  initialPickupLocations 
}: Props) {
  const [zones, setZones] = useState(initialZones);
  const [pickupLocations, setPickupLocations] = useState(initialPickupLocations);
  const [isPending, startTransition] = useTransition();
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [editingPickup, setEditingPickup] = useState<string | null>(null);
  const [showNewZone, setShowNewZone] = useState(false);
  const [showNewPickup, setShowNewPickup] = useState(false);
  const router = useRouter();

  // New zone form state
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCountries, setNewZoneCountries] = useState<string[]>([]);

  // New method form state (per zone)
  const [addingMethodToZone, setAddingMethodToZone] = useState<string | null>(null);
  const [newMethod, setNewMethod] = useState<{
    name: string;
    type: 'flat_rate' | 'free' | 'weight_based' | 'price_based' | 'local_pickup';
    price: number;
    estimatedDays: string;
    minOrderAmount: number | undefined;
  }>({
    name: '',
    type: 'flat_rate',
    price: 0,
    estimatedDays: '',
    minOrderAmount: undefined,
  });

  // New pickup form state
  const [newPickup, setNewPickup] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    hours: '',
  });

  // ============================================
  // Zone Actions
  // ============================================

  const handleCreateZone = async () => {
    if (!newZoneName.trim() || newZoneCountries.length === 0) return;
    
    startTransition(async () => {
      const zone = await createShippingZone(storeId, {
        name: newZoneName,
        countries: newZoneCountries,
      });
      setZones([...zones, { ...zone, methods: [], countries: zone.countries as string[] }]);
      setNewZoneName('');
      setNewZoneCountries([]);
      setShowNewZone(false);
      router.refresh();
    });
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('האם למחוק את אזור המשלוח? כל שיטות המשלוח שבו יימחקו.')) return;
    
    startTransition(async () => {
      await deleteShippingZone(zoneId);
      setZones(zones.filter(z => z.id !== zoneId));
      router.refresh();
    });
  };

  // ============================================
  // Method Actions
  // ============================================

  const handleCreateMethod = async (zoneId: string) => {
    if (!newMethod.name.trim()) return;
    
    startTransition(async () => {
      const conditions: ShippingMethodConditions = {};
      if (newMethod.type === 'free' && newMethod.minOrderAmount) {
        conditions.minOrderAmount = newMethod.minOrderAmount;
      }
      
      const method = await createShippingMethod(zoneId, {
        name: newMethod.name,
        type: newMethod.type,
        price: newMethod.type === 'free' ? 0 : newMethod.price,
        estimatedDays: newMethod.estimatedDays,
        conditions,
      });
      
      setZones(zones.map(z => 
        z.id === zoneId 
          ? { ...z, methods: [...z.methods, method as ShippingMethod] }
          : z
      ));
      
      setAddingMethodToZone(null);
      setNewMethod({ name: '', type: 'flat_rate' as const, price: 0, estimatedDays: '', minOrderAmount: undefined });
      router.refresh();
    });
  };

  const handleDeleteMethod = async (zoneId: string, methodId: string) => {
    if (!confirm('האם למחוק את שיטת המשלוח?')) return;
    
    startTransition(async () => {
      await deleteShippingMethod(methodId);
      setZones(zones.map(z => 
        z.id === zoneId 
          ? { ...z, methods: z.methods.filter(m => m.id !== methodId) }
          : z
      ));
      router.refresh();
    });
  };

  const handleToggleMethod = async (zoneId: string, methodId: string, isActive: boolean) => {
    startTransition(async () => {
      await updateShippingMethod(methodId, { isActive });
      setZones(zones.map(z => 
        z.id === zoneId 
          ? { ...z, methods: z.methods.map(m => m.id === methodId ? { ...m, isActive } : m) }
          : z
      ));
      router.refresh();
    });
  };

  // ============================================
  // Pickup Actions
  // ============================================

  const handleCreatePickup = async () => {
    if (!newPickup.name.trim() || !newPickup.address.trim() || !newPickup.city.trim()) return;
    
    startTransition(async () => {
      const location = await createPickupLocation(storeId, newPickup);
      setPickupLocations([...pickupLocations, location as PickupLocation]);
      setNewPickup({ name: '', address: '', city: '', phone: '', hours: '' });
      setShowNewPickup(false);
      router.refresh();
    });
  };

  const handleDeletePickup = async (locationId: string) => {
    if (!confirm('האם למחוק את נקודת האיסוף?')) return;
    
    startTransition(async () => {
      await deletePickupLocation(locationId);
      setPickupLocations(pickupLocations.filter(p => p.id !== locationId));
      router.refresh();
    });
  };

  const handleTogglePickup = async (locationId: string, isActive: boolean) => {
    startTransition(async () => {
      await updatePickupLocation(locationId, { isActive });
      setPickupLocations(pickupLocations.map(p => 
        p.id === locationId ? { ...p, isActive } : p
      ));
      router.refresh();
    });
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-8">
      {/* Shipping Zones Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">אזורי משלוח</h2>
            <p className="text-sm text-gray-500">הגדר אזורים לפי מדינות ושיטות משלוח לכל אזור</p>
          </div>
          <button
            onClick={() => setShowNewZone(true)}
            className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            + אזור חדש
          </button>
        </div>

        {/* New Zone Form */}
        {showNewZone && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-4">אזור משלוח חדש</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">שם האזור</label>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={e => setNewZoneName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black"
                  placeholder='לדוגמה: "ישראל" או "אירופה"'
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">מדינות</label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_COUNTRIES.map(country => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setNewZoneCountries(prev => 
                          prev.includes(country.code)
                            ? prev.filter(c => c !== country.code)
                            : [...prev, country.code]
                        );
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        newZoneCountries.includes(country.code)
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {country.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateZone}
                disabled={isPending || !newZoneName.trim() || newZoneCountries.length === 0}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                צור אזור
              </button>
              <button
                onClick={() => { setShowNewZone(false); setNewZoneName(''); setNewZoneCountries([]); }}
                className="px-4 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* Zones List */}
        <div className="space-y-4">
          {zones.map(zone => (
            <div key={zone.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Zone Header */}
              <div className="bg-gray-50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">{zone.name}</h3>
                    <p className="text-xs text-gray-500">
                      {zone.countries.includes('*') 
                        ? 'כל העולם' 
                        : zone.countries.map(c => 
                            COMMON_COUNTRIES.find(cc => cc.code === c)?.name || c
                          ).join(', ')
                      }
                      {zone.isDefault && <span className="mr-2 text-blue-600">(ברירת מחדל)</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAddingMethodToZone(zone.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + הוסף שיטת משלוח
                  </button>
                  {!zone.isDefault && (
                    <button
                      onClick={() => handleDeleteZone(zone.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      מחק
                    </button>
                  )}
                </div>
              </div>

              {/* New Method Form */}
              {addingMethodToZone === zone.id && (
                <div className="p-4 bg-blue-50 border-t border-blue-100">
                  <h4 className="font-medium mb-3">שיטת משלוח חדשה</h4>
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm mb-1">שם</label>
                      <input
                        type="text"
                        value={newMethod.name}
                        onChange={e => setNewMethod({ ...newMethod, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="משלוח רגיל"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">סוג</label>
                      <select
                        value={newMethod.type}
                        onChange={e => setNewMethod({ ...newMethod, type: e.target.value as typeof newMethod.type })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        {METHOD_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {newMethod.type !== 'free' && newMethod.type !== 'local_pickup' && (
                      <div>
                        <label className="block text-sm mb-1">מחיר (₪)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newMethod.price}
                          onChange={e => setNewMethod({ ...newMethod, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    )}
                    {newMethod.type === 'free' && (
                      <div>
                        <label className="block text-sm mb-1">מעל סכום (₪)</label>
                        <input
                          type="number"
                          min="0"
                          value={newMethod.minOrderAmount || ''}
                          onChange={e => setNewMethod({ ...newMethod, minOrderAmount: parseFloat(e.target.value) || undefined })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="ללא מינימום"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm mb-1">זמן משוער</label>
                      <input
                        type="text"
                        value={newMethod.estimatedDays}
                        onChange={e => setNewMethod({ ...newMethod, estimatedDays: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="3-5 ימי עסקים"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCreateMethod(zone.id)}
                      disabled={isPending || !newMethod.name.trim()}
                      className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                      הוסף
                    </button>
                    <button
                      onClick={() => { setAddingMethodToZone(null); setNewMethod({ name: '', type: 'flat_rate' as const, price: 0, estimatedDays: '', minOrderAmount: undefined }); }}
                      className="px-4 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {/* Methods List */}
              <div className="divide-y divide-gray-100">
                {zone.methods.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    אין שיטות משלוח. הוסף שיטת משלוח ראשונה.
                  </div>
                ) : (
                  zone.methods.map(method => (
                    <div 
                      key={method.id} 
                      className={`p-4 flex items-center justify-between ${!method.isActive ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {method.type === 'free' ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                          ) : method.type === 'local_pickup' ? (
                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {method.type === 'free' ? (
                              <span className="text-green-600 font-medium">חינם</span>
                            ) : method.type === 'local_pickup' ? (
                              <span className="text-blue-600">איסוף עצמי</span>
                            ) : (
                              <span>₪{parseFloat(method.price).toFixed(2)}</span>
                            )}
                            {method.conditions?.minOrderAmount && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                מעל ₪{method.conditions.minOrderAmount}
                              </span>
                            )}
                            {method.estimatedDays && (
                              <span className="text-gray-400">• {method.estimatedDays}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={method.isActive}
                            onChange={e => handleToggleMethod(zone.id, method.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
                        </label>
                        <button
                          onClick={() => handleDeleteMethod(zone.id, method.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pickup Locations Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">נקודות איסוף עצמי</h2>
            <p className="text-sm text-gray-500">הגדר נקודות שבהן לקוחות יכולים לאסוף את ההזמנה</p>
          </div>
          <button
            onClick={() => setShowNewPickup(true)}
            className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            + נקודה חדשה
          </button>
        </div>

        {/* New Pickup Form */}
        {showNewPickup && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-4">נקודת איסוף חדשה</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">שם הנקודה *</label>
                <input
                  type="text"
                  value={newPickup.name}
                  onChange={e => setNewPickup({ ...newPickup, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="סניף תל אביב"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">עיר *</label>
                <input
                  type="text"
                  value={newPickup.city}
                  onChange={e => setNewPickup({ ...newPickup, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="תל אביב"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">כתובת *</label>
                <input
                  type="text"
                  value={newPickup.address}
                  onChange={e => setNewPickup({ ...newPickup, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="דיזנגוף 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">טלפון</label>
                <input
                  type="text"
                  value={newPickup.phone}
                  onChange={e => setNewPickup({ ...newPickup, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="03-1234567"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">שעות פעילות</label>
                <input
                  type="text"
                  value={newPickup.hours}
                  onChange={e => setNewPickup({ ...newPickup, hours: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="א'-ה' 9:00-18:00, ו' 9:00-13:00"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreatePickup}
                disabled={isPending || !newPickup.name.trim() || !newPickup.address.trim() || !newPickup.city.trim()}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                צור נקודה
              </button>
              <button
                onClick={() => { setShowNewPickup(false); setNewPickup({ name: '', address: '', city: '', phone: '', hours: '' }); }}
                className="px-4 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* Pickup Locations List */}
        {pickupLocations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p>אין נקודות איסוף עצמי.</p>
            <p className="text-sm">הוסף נקודות שבהן לקוחות יכולים לאסוף את ההזמנה.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pickupLocations.map(location => (
              <div 
                key={location.id}
                className={`p-4 border rounded-lg flex items-center justify-between ${!location.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">{location.name}</div>
                    <div className="text-sm text-gray-500">
                      {location.address}, {location.city}
                      {location.phone && ` • ${location.phone}`}
                    </div>
                    {location.hours && (
                      <div className="text-xs text-gray-400 mt-1">
                        {location.hours}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={location.isActive}
                      onChange={e => handleTogglePickup(location.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                  <button
                    onClick={() => handleDeletePickup(location.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">טיפים</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• צור אזור משלוח לכל קבוצת מדינות עם תעריפים שונים</li>
          <li>• משלוח חינם מעל סכום מסוים מגדיל את סכום ההזמנה הממוצע</li>
          <li>• הוסף נקודות איסוף עצמי לחיסכון בעלויות משלוח</li>
          <li>• ציין זמני משלוח ריאליסטיים כדי לבנות אמון עם הלקוחות</li>
        </ul>
      </div>
    </div>
  );
}

