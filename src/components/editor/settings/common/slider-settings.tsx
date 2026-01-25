'use client';

/**
 * Slider Settings - Navigation, autoplay, and display controls
 * הגדרות סליידר - ניווט, אוטומטי ותצוגה
 */

interface SliderSettingsProps {
  settings: Record<string, unknown>;
  onChange: (updates: Record<string, unknown>) => void;
  showItemsPerView?: boolean;
  maxItemsPerView?: number;
}

export function SliderSettings({ 
  settings, 
  onChange,
  showItemsPerView = true,
  maxItemsPerView = 6,
}: SliderSettingsProps) {
  const showArrows = (settings.showArrows as boolean) ?? true;
  const showDots = (settings.showDots as boolean) ?? true;
  const arrowStyle = (settings.arrowStyle as string) || 'circle';
  const dotsStyle = (settings.dotsStyle as string) || 'dots';
  const autoplay = (settings.autoplay as boolean) ?? false;
  const autoplayInterval = (settings.autoplayInterval as number) || 5000;
  const loop = (settings.loop as boolean) ?? false;
  const itemsPerView = (settings.itemsPerView as number) || 3;
  const itemsPerViewMobile = (settings.itemsPerViewMobile as number) || 1;

  return (
    <div className="space-y-4">
      {/* Items per view */}
      {showItemsPerView && (
        <>
          <div>
            <label className="text-sm text-gray-700 block mb-2">
              פריטים בתצוגה (מחשב)
            </label>
            <input
              type="range"
              min="1"
              max={maxItemsPerView}
              step="1"
              value={itemsPerView}
              onChange={(e) => onChange({ itemsPerView: Number(e.target.value) })}
              className="w-full accent-gray-900"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>{itemsPerView}</span>
              <span>{maxItemsPerView}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-2">
              פריטים בתצוגה (מובייל)
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={itemsPerViewMobile}
              onChange={(e) => onChange({ itemsPerViewMobile: Number(e.target.value) })}
              className="w-full accent-gray-900"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>{itemsPerViewMobile}</span>
              <span>3</span>
            </div>
          </div>
        </>
      )}

      {/* Navigation toggles */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">הצג חצים</span>
        <button
          type="button"
          onClick={() => onChange({ showArrows: !showArrows })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            showArrows ? 'bg-gray-900' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              showArrows ? 'right-0.5' : 'right-5'
            }`}
          />
        </button>
      </div>

      {showArrows && (
        <div>
          <label className="text-sm text-gray-700 block mb-2">
            סגנון חצים
          </label>
          <div className="flex gap-2">
            {['circle', 'square', 'minimal'].map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => onChange({ arrowStyle: style })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  arrowStyle === style
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {style === 'circle' ? 'עיגול' : style === 'square' ? 'מרובע' : 'מינימלי'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">הצג נקודות</span>
        <button
          type="button"
          onClick={() => onChange({ showDots: !showDots })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            showDots ? 'bg-gray-900' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              showDots ? 'right-0.5' : 'right-5'
            }`}
          />
        </button>
      </div>

      {showDots && (
        <div>
          <label className="text-sm text-gray-700 block mb-2">
            סגנון נקודות
          </label>
          <div className="flex gap-2">
            {['dots', 'lines', 'numbers'].map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => onChange({ dotsStyle: style })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  dotsStyle === style
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {style === 'dots' ? 'נקודות' : style === 'lines' ? 'קווים' : 'מספרים'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loop */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">לולאה אינסופית</span>
        <button
          type="button"
          onClick={() => onChange({ loop: !loop })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            loop ? 'bg-gray-900' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              loop ? 'right-0.5' : 'right-5'
            }`}
          />
        </button>
      </div>

      {/* Autoplay */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">הפעלה אוטומטית</span>
        <button
          type="button"
          onClick={() => onChange({ autoplay: !autoplay })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            autoplay ? 'bg-gray-900' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              autoplay ? 'right-0.5' : 'right-5'
            }`}
          />
        </button>
      </div>

      {autoplay && (
        <div>
          <label className="text-sm text-gray-700 block mb-2">
            מהירות החלפה (שניות)
          </label>
          <input
            type="range"
            min="2000"
            max="10000"
            step="500"
            value={autoplayInterval}
            onChange={(e) => onChange({ autoplayInterval: Number(e.target.value) })}
            className="w-full accent-gray-900"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2</span>
            <span>{autoplayInterval / 1000}s</span>
            <span>10</span>
          </div>
        </div>
      )}
    </div>
  );
}

