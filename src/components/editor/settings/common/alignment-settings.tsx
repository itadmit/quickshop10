'use client';

/**
 * Alignment Settings - Text and content alignment controls
 * הגדרות יישור - יישור טקסט ותוכן
 */

interface AlignmentSettingsProps {
  settings: Record<string, unknown>;
  onChange: (updates: Record<string, unknown>) => void;
  label?: string;
  fieldName?: string;
}

export function AlignmentSettings({ 
  settings, 
  onChange,
  label = 'יישור תוכן',
  fieldName = 'textAlign',
}: AlignmentSettingsProps) {
  const align = (settings[fieldName] as string) || 'center';

  const options = [
    { value: 'right', label: 'ימין', icon: '→' },
    { value: 'center', label: 'מרכז', icon: '↔' },
    { value: 'left', label: 'שמאל', icon: '←' },
  ];

  return (
    <div>
      <label className="text-sm text-gray-700 block mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange({ [fieldName]: option.value })}
            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              align === option.value
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Layout toggle (grid vs slider)
export function LayoutSettings({ 
  settings, 
  onChange,
}: AlignmentSettingsProps) {
  const layout = (settings.layout as string) || 'grid';

  return (
    <div>
      <label className="text-sm text-gray-700 block mb-2">
        פריסה
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ layout: 'grid' })}
          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
            layout === 'grid'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          גריד
        </button>
        <button
          type="button"
          onClick={() => onChange({ layout: 'slider' })}
          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
            layout === 'slider'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          סליידר
        </button>
      </div>
    </div>
  );
}

