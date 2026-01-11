'use client';

/**
 * Plugin Pricing Form
 * טופס לעריכת מחירי תוספים
 */

import { useState, useTransition } from 'react';
import { Save, Loader2, Check, Plus, Trash2 } from 'lucide-react';
import { updatePluginPricing, deletePluginPricing, addPluginPricing } from './actions';

interface PluginItem {
  slug: string;
  monthlyPrice: number;
  trialDays: number;
  isActive: boolean;
}

interface PluginPricingFormProps {
  plugins: PluginItem[];
}

// Plugin names mapping
const pluginNames: Record<string, string> = {
  'product-stories': 'סטוריז מוצרים',
  'smart-advisor': 'יועץ חכם',
  'wheel-of-fortune': 'גלגל המזל',
  'scratch-card': 'כרטיס גירוד',
  'loyalty-program': 'מועדון לקוחות PRO',
  'product-reviews': 'ביקורות מוצרים',
};

export function PluginPricingForm({ plugins: initialPlugins }: PluginPricingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [plugins, setPlugins] = useState(initialPlugins);
  const [newPlugin, setNewPlugin] = useState({ slug: '', monthlyPrice: 0, trialDays: 14 });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleUpdate = (slug: string, field: keyof PluginItem, value: number | boolean) => {
    setPlugins(plugins.map(p => 
      p.slug === slug ? { ...p, [field]: value } : p
    ));
  };

  const handleSave = () => {
    startTransition(async () => {
      await updatePluginPricing(plugins);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleDelete = (slug: string) => {
    if (!confirm(`למחוק את התוסף ${pluginNames[slug] || slug}?`)) return;
    
    startTransition(async () => {
      await deletePluginPricing(slug);
      setPlugins(plugins.filter(p => p.slug !== slug));
    });
  };

  const handleAdd = () => {
    if (!newPlugin.slug.trim()) return;
    
    startTransition(async () => {
      await addPluginPricing(newPlugin.slug, newPlugin.monthlyPrice, newPlugin.trialDays);
      setPlugins([...plugins, { 
        ...newPlugin, 
        isActive: true 
      }]);
      setNewPlugin({ slug: '', monthlyPrice: 0, trialDays: 14 });
      setShowAddForm(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Plugins Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-right py-3 px-2 font-medium text-gray-500">תוסף</th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">מחיר חודשי</th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">ימי נסיון</th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">סטטוס</th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plugins.map((plugin) => (
              <tr key={plugin.slug} className="hover:bg-gray-50">
                <td className="py-3 px-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {pluginNames[plugin.slug] || plugin.slug}
                    </span>
                    <p className="text-xs text-gray-500 font-mono">{plugin.slug}</p>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={plugin.monthlyPrice}
                      onChange={(e) => handleUpdate(plugin.slug, 'monthlyPrice', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-left text-sm"
                      dir="ltr"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₪</span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <input
                    type="number"
                    min="0"
                    value={plugin.trialDays}
                    onChange={(e) => handleUpdate(plugin.slug, 'trialDays', Number(e.target.value))}
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded text-left text-sm"
                    dir="ltr"
                  />
                </td>
                <td className="py-3 px-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(plugin.slug, 'isActive', !plugin.isActive)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plugin.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {plugin.isActive ? 'פעיל' : 'מושבת'}
                  </button>
                </td>
                <td className="py-3 px-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(plugin.slug)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New Plugin */}
      {showAddForm ? (
        <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={newPlugin.slug}
              onChange={(e) => setNewPlugin({ ...newPlugin, slug: e.target.value })}
              placeholder="plugin-slug"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              dir="ltr"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-700 mb-1">מחיר</label>
            <input
              type="number"
              value={newPlugin.monthlyPrice}
              onChange={(e) => setNewPlugin({ ...newPlugin, monthlyPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-left"
              dir="ltr"
            />
          </div>
          <div className="w-20">
            <label className="block text-xs font-medium text-gray-700 mb-1">נסיון</label>
            <input
              type="number"
              value={newPlugin.trialDays}
              onChange={(e) => setNewPlugin({ ...newPlugin, trialDays: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-left"
              dir="ltr"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || !newPlugin.slug.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            הוסף
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            ביטול
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <Plus className="w-4 h-4" />
          הוסף תוסף חדש
        </button>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? 'נשמר!' : 'שמור שינויים'}
        </button>

        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Check className="w-4 h-4" />
            מחירי התוספים עודכנו בהצלחה
          </span>
        )}
      </div>
    </div>
  );
}

