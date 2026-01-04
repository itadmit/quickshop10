'use client';

import { useState } from 'react';

// ============================================
// Section Settings - Right Panel (Shopify Style)
// ============================================

interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

interface SectionSettingsProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onRemove: () => void;
}

export function SectionSettings({ section, onUpdate, onRemove }: SectionSettingsProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      hero: 'Slideshow',
      categories: 'Collection list',
      products: 'Featured collection',
      newsletter: 'Newsletter',
      video_banner: 'Video',
      split_banner: 'Image with text overlay',
    };
    return titles[section.type] || 'Section';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{getSectionTitle()}</h3>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreIcon />
          </button>
        </div>
        
        {/* Device/View Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'content' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            תוכן
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'design' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            עיצוב
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'content' ? (
          <ContentSettings section={section} onUpdate={onUpdate} />
        ) : (
          <DesignSettings section={section} onUpdate={onUpdate} />
        )}
      </div>

      {/* Remove Section */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onRemove}
          className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <TrashIcon />
          <span className="text-sm">Remove section</span>
        </button>
      </div>
    </div>
  );
}

// Content Settings (varies by section type)
function ContentSettings({ 
  section, 
  onUpdate 
}: { 
  section: Section; 
  onUpdate: (updates: Partial<Section>) => void;
}) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({
      content: { ...section.content, [key]: value }
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Section Header */}
      <SettingsGroup title="Section header">
        <TextField
          label="Heading"
          value={section.title || ''}
          onChange={(v) => onUpdate({ title: v })}
          icon={<TextIcon />}
        />
        <TextField
          label="Subheading"
          value={section.subtitle || ''}
          onChange={(v) => onUpdate({ subtitle: v })}
          multiline
        />
        <TextField
          label="Description"
          value={(section.content.description as string) || ''}
          onChange={(v) => updateContent('description', v)}
          multiline
        />
        <ToggleField
          label="Text alignment"
          options={['Left', 'Center']}
          value={(section.settings.textAlign as string) || 'Center'}
          onChange={(v) => onUpdate({ settings: { ...section.settings, textAlign: v } })}
        />
      </SettingsGroup>

      {/* Type-specific content */}
      {section.type === 'hero' && (
        <HeroContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'categories' && (
        <CategoriesContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'products' && (
        <ProductsContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'newsletter' && (
        <NewsletterContentSettings section={section} onUpdate={onUpdate} />
      )}
    </div>
  );
}

// Design Settings
function DesignSettings({ 
  section, 
  onUpdate 
}: { 
  section: Section; 
  onUpdate: (updates: Partial<Section>) => void;
}) {
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({
      settings: { ...section.settings, [key]: value }
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* General */}
      <SettingsGroup title="General">
        <SelectField
          label="Container type"
          value={(section.settings.containerType as string) || 'container'}
          options={[
            { value: 'container', label: 'Use container box' },
            { value: 'full', label: 'Full width' },
          ]}
          onChange={(v) => updateSettings('containerType', v)}
        />
        <ColorField
          label="Background color"
          value={(section.settings.backgroundColor as string) || 'transparent'}
          onChange={(v) => updateSettings('backgroundColor', v)}
        />
        <SelectField
          label="Layout"
          value={(section.settings.layout as string) || 'standard'}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'grid', label: 'Grid' },
            { value: 'slider', label: 'Slider' },
          ]}
          onChange={(v) => updateSettings('layout', v)}
        />
        <SwitchField
          label="Expanded"
          description="Work if Enable slider is checked"
          value={(section.settings.expanded as boolean) || false}
          onChange={(v) => updateSettings('expanded', v)}
        />
      </SettingsGroup>

      {/* Card Settings */}
      {(section.type === 'categories' || section.type === 'products') && (
        <SettingsGroup title="Card settings">
          <SelectField
            label="Card style"
            value={(section.settings.cardStyle as string) || 'standard'}
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'minimal', label: 'Minimal' },
              { value: 'overlay', label: 'With overlay' },
            ]}
            onChange={(v) => updateSettings('cardStyle', v)}
          />
          <ToggleField
            label="Text alignment"
            options={['Left', 'Center']}
            value={(section.settings.cardTextAlign as string) || 'Center'}
            onChange={(v) => updateSettings('cardTextAlign', v)}
          />
          <SelectField
            label="Hover effect"
            value={(section.settings.hoverEffect as string) || 'scale'}
            options={[
              { value: 'none', label: 'None' },
              { value: 'scale', label: 'Scaling down' },
              { value: 'zoom', label: 'Zoom in' },
              { value: 'lift', label: 'Lift up' },
            ]}
            onChange={(v) => updateSettings('hoverEffect', v)}
          />
          <SwitchField
            label="Show product count"
            value={(section.settings.showProductCount as boolean) || false}
            onChange={(v) => updateSettings('showProductCount', v)}
          />
          <SwitchField
            label="Product count inline"
            value={(section.settings.productCountInline as boolean) || false}
            onChange={(v) => updateSettings('productCountInline', v)}
          />
          <SwitchField
            label="Image rounded"
            description="Don't work well with 'Content inside' layout"
            value={(section.settings.imageRounded as boolean) || false}
            onChange={(v) => updateSettings('imageRounded', v)}
          />
        </SettingsGroup>
      )}

      {/* Grid Settings */}
      <SettingsGroup title="Grid settings">
        <SliderField
          label="Collections per row"
          value={(section.settings.columns as number) || 4}
          min={1}
          max={6}
          onChange={(v) => updateSettings('columns', v)}
        />
        <SwitchField
          label="Enable slider"
          value={(section.settings.enableSlider as boolean) || false}
          onChange={(v) => updateSettings('enableSlider', v)}
        />
        <SwitchField
          label="Show pagination"
          value={(section.settings.showPagination as boolean) || false}
          onChange={(v) => updateSettings('showPagination', v)}
        />
        <SwitchField
          label="Show navigation"
          value={(section.settings.showNavigation as boolean) || false}
          onChange={(v) => updateSettings('showNavigation', v)}
        />
        <SwitchField
          label="Auto slide"
          value={(section.settings.autoSlide as boolean) || false}
          onChange={(v) => updateSettings('autoSlide', v)}
        />
        <SliderField
          label="Auto slide every"
          value={(section.settings.autoSlideInterval as number) || 5}
          min={1}
          max={10}
          suffix="s"
          onChange={(v) => updateSettings('autoSlideInterval', v)}
        />
      </SettingsGroup>

      {/* Mobile Settings */}
      <SettingsGroup title="Mobile settings">
        <SwitchField
          label="Disable slider"
          value={(section.settings.mobileDisableSlider as boolean) || false}
          onChange={(v) => updateSettings('mobileDisableSlider', v)}
        />
        <SwitchField
          label="Use horizontal scrollbar"
          description="Uncheck to display as grid"
          value={(section.settings.mobileHorizontalScroll as boolean) || false}
          onChange={(v) => updateSettings('mobileHorizontalScroll', v)}
        />
        <SliderField
          label="Column gap"
          value={(section.settings.mobileColumnGap as number) || 10}
          min={0}
          max={30}
          suffix="px"
          onChange={(v) => updateSettings('mobileColumnGap', v)}
        />
        <SwitchField
          label="Hide slider controls"
          value={(section.settings.hideSliderControls as boolean) || false}
          onChange={(v) => updateSettings('hideSliderControls', v)}
        />
      </SettingsGroup>

      {/* Section Padding */}
      <SettingsGroup title="Section Padding">
        <SliderField
          label="Padding Top"
          value={(section.settings.paddingTop as number) || 0}
          min={0}
          max={100}
          suffix="px"
          onChange={(v) => updateSettings('paddingTop', v)}
        />
        <SliderField
          label="Padding Bottom"
          value={(section.settings.paddingBottom as number) || 0}
          min={0}
          max={100}
          suffix="px"
          onChange={(v) => updateSettings('paddingBottom', v)}
        />
      </SettingsGroup>

      {/* Custom Attributes */}
      <SettingsGroup title="Custom Attributes">
        <TextField
          label="Custom classes"
          value={(section.settings.customClasses as string) || ''}
          onChange={(v) => updateSettings('customClasses', v)}
          icon={<TextIcon />}
        />
      </SettingsGroup>

      {/* Animations */}
      <SettingsGroup title="Animations">
        <SelectField
          label="Visible in the view animation"
          value={(section.settings.animation as string) || 'inherit'}
          options={[
            { value: 'inherit', label: 'Inherit global setting' },
            { value: 'none', label: 'None' },
            { value: 'fade', label: 'Fade in' },
            { value: 'slide', label: 'Slide up' },
          ]}
          onChange={(v) => updateSettings('animation', v)}
        />
      </SettingsGroup>

      {/* Theme Settings Accordion */}
      <CollapsibleGroup title="Theme Settings">
        <p className="text-sm text-gray-500">
          Global theme settings are managed in the theme settings panel.
        </p>
      </CollapsibleGroup>

      {/* Custom CSS */}
      <CollapsibleGroup title="Custom CSS" defaultOpen>
        <p className="text-xs text-gray-500 mb-2">
          Add custom styles to <strong>this section only</strong>.
        </p>
        <textarea
          value={(section.settings.customCss as string) || ''}
          onChange={(e) => updateSettings('customCss', e.target.value)}
          className="w-full h-24 p-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-500"
          placeholder="h2 {
  font-size: 32px;
}"
        />
        <p className="text-xs text-gray-400 mt-2">
          To add custom styles to your entire online store, go to{' '}
          <a href="#" className="text-blue-500 hover:underline">theme settings</a>.
        </p>
      </CollapsibleGroup>
    </div>
  );
}

// Type-specific content settings
function HeroContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="Media">
        <ImageField
          label="Image"
          value={(section.content.imageUrl as string) || ''}
          onChange={(v) => updateContent('imageUrl', v)}
        />
        <SliderField
          label="Overlay opacity"
          value={((section.settings.overlay as number) || 0.3) * 100}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => onUpdate({ settings: { ...section.settings, overlay: v / 100 } })}
        />
      </SettingsGroup>
      <SettingsGroup title="Button">
        <TextField
          label="Button text"
          value={(section.content.buttonText as string) || ''}
          onChange={(v) => updateContent('buttonText', v)}
        />
        <TextField
          label="Button link"
          value={(section.content.buttonLink as string) || ''}
          onChange={(v) => updateContent('buttonLink', v)}
        />
      </SettingsGroup>
    </>
  );
}

function CategoriesContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  return (
    <SettingsGroup title="Collections">
      <p className="text-sm text-gray-500">
        Categories are automatically loaded from your store.
      </p>
    </SettingsGroup>
  );
}

function ProductsContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <SettingsGroup title="Products">
      <SelectField
        label="Show products"
        value={(section.content.type as string) || 'all'}
        options={[
          { value: 'all', label: 'All products' },
          { value: 'featured', label: 'Featured only' },
        ]}
        onChange={(v) => updateContent('type', v)}
      />
      <SliderField
        label="Products to show"
        value={(section.content.limit as number) || 8}
        min={1}
        max={24}
        onChange={(v) => updateContent('limit', v)}
      />
    </SettingsGroup>
  );
}

function NewsletterContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <SettingsGroup title="Form">
      <TextField
        label="Placeholder text"
        value={(section.content.placeholder as string) || ''}
        onChange={(v) => updateContent('placeholder', v)}
      />
      <TextField
        label="Button text"
        value={(section.content.buttonText as string) || ''}
        onChange={(v) => updateContent('buttonText', v)}
      />
    </SettingsGroup>
  );
}

// UI Components
function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  );
}

function CollapsibleGroup({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-gray-100 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1"
      >
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20 focus:outline-none focus:border-blue-500"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        )}
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              value === opt 
                ? 'bg-gray-900 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SwitchField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <label className="text-sm text-gray-700">{label}</label>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          value ? 'bg-blue-500' : 'bg-gray-200'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-700 shrink-0">{label}</label>
      <div className="flex items-center gap-3 flex-1">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex items-center gap-1 w-16">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-12 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-blue-500"
          />
          {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
        />
        <span className="text-xs text-gray-500">
          {value === 'transparent' ? 'Transparent' : value}
        </span>
      </div>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{label}</label>
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt=""
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
          />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 bg-white/90 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <TrashIcon />
          </button>
        </div>
      ) : (
        <button className="w-full h-32 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center hover:border-gray-300 transition-colors">
          <UploadIcon />
          <span className="text-xs text-gray-500 mt-2">Select image</span>
        </button>
      )}
    </div>
  );
}

// Icons
function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}


