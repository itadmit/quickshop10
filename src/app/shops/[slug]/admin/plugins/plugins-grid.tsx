'use client';

/**
 * Plugins Grid - Client Component
 * 
 * 🎨 רשת תוספים עם אינטראקטיביות
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, PlayCircle, ImagePlus, Banknote, 
  CalendarOff, BarChart, MessageCircle, Crown,
  Settings, Trash2, Loader2
} from 'lucide-react';
import { categoryLabels } from '@/lib/plugins/registry';
import type { PluginWithStatus, PluginCategory } from '@/lib/plugins/types';
import { installPlugin, uninstallPlugin } from './actions';

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'play-circle': PlayCircle,
  'image': ImagePlus,
  'banknote': Banknote,
  'calendar-off': CalendarOff,
  'bar-chart': BarChart,
  'message-circle': MessageCircle,
  'crown': Crown,
};

interface PluginsGridProps {
  plugins: PluginWithStatus[];
  storeSlug: string;
  storeId: string;
}

export function PluginsGrid({ plugins, storeSlug, storeId }: PluginsGridProps) {
  const [localPlugins, setLocalPlugins] = useState(plugins);
  const [processingSlug, setProcessingSlug] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleInstall = async (pluginSlug: string) => {
    setProcessingSlug(pluginSlug);
    
    startTransition(async () => {
      const result = await installPlugin(storeId, pluginSlug);
      
      if (result.success) {
        setLocalPlugins(prev => 
          prev.map(p => 
            p.slug === pluginSlug 
              ? { ...p, isInstalled: true, isActive: true }
              : p
          )
        );
      } else {
        alert(result.error || 'שגיאה בהתקנה');
      }
      
      setProcessingSlug(null);
    });
  };

  const handleUninstall = async (pluginSlug: string) => {
    if (!confirm('האם אתה בטוח שברצונך להסיר את התוסף?')) return;
    
    setProcessingSlug(pluginSlug);
    
    startTransition(async () => {
      const result = await uninstallPlugin(storeId, pluginSlug);
      
      if (result.success) {
        setLocalPlugins(prev => 
          prev.map(p => 
            p.slug === pluginSlug 
              ? { ...p, isInstalled: false, isActive: false }
              : p
          )
        );
      } else {
        alert(result.error || 'שגיאה בהסרה');
      }
      
      setProcessingSlug(null);
    });
  };

  // Sort: installed first, then by name
  const sortedPlugins = [...localPlugins].sort((a, b) => {
    if (a.isInstalled && !b.isInstalled) return -1;
    if (!a.isInstalled && b.isInstalled) return 1;
    return a.name.localeCompare(b.name, 'he');
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedPlugins.map(plugin => {
        const IconComponent = iconMap[plugin.icon || ''] || PlayCircle;
        const isProcessing = processingSlug === plugin.slug;
        
        return (
          <div 
            key={plugin.slug}
            className={`
              bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden
              ${plugin.isInstalled 
                ? 'border-green-200 shadow-sm' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            {/* Header */}
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center
                  ${plugin.isInstalled 
                    ? 'bg-green-100' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }
                `}>
                  <IconComponent className={`
                    w-6 h-6 
                    ${plugin.isInstalled ? 'text-green-600' : 'text-gray-600'}
                  `} />
                </div>
                
                {/* Title & Category */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {plugin.name}
                    </h3>
                    {plugin.isInstalled && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {categoryLabels[plugin.category as PluginCategory]}
                  </p>
                </div>
                
                {/* Price Badge */}
                <div className="flex-shrink-0">
                  {plugin.isFree ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      חינם
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      ₪{plugin.price}/חודש
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                {plugin.description}
              </p>

              {/* Features */}
              {plugin.metadata?.features && plugin.metadata.features.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {plugin.metadata.features.slice(0, 3).map((feature, i) => (
                    <span 
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {feature}
                    </span>
                  ))}
                  {plugin.metadata.features.length > 3 && (
                    <span className="px-2 py-0.5 text-gray-400 text-xs">
                      +{plugin.metadata.features.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex gap-2">
              {plugin.isInstalled ? (
                <>
                  <Link
                    href={`/shops/${storeSlug}/admin/plugins/${plugin.slug}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    הגדרות
                  </Link>
                  <button
                    onClick={() => handleUninstall(plugin.slug)}
                    disabled={isProcessing}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    title="הסר תוסף"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleInstall(plugin.slug)}
                  disabled={isProcessing}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
                    font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer
                    ${plugin.isFree 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                  `}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      מתקין...
                    </>
                  ) : plugin.isFree ? (
                    'התקן חינם'
                  ) : plugin.trialDays ? (
                    `נסה ${plugin.trialDays} ימים חינם`
                  ) : (
                    `התקן - ₪${plugin.price}/חודש`
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


