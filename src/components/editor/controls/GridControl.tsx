'use client';

/**
 * GridControl - Grid/layout settings
 * הגדרות גריד ופריסה
 * 
 * שימוש:
 * <GridControl
 *   settings={section.settings}
 *   onChange={(key, value) => updateSettings(key, value)}
 * />
 * 
 * יוצר הגדרות: columns, mobileColumns, gap, layout
 */

import { EditorSelect, EditorToggleGroup, EditorIconGroup } from '../ui/EditorSelect';
import { EditorSlider } from '../ui/EditorSlider';
import { Grid2X2, LayoutGrid, Rows } from 'lucide-react';

interface GridControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  showLayout?: boolean;
  showColumns?: boolean;
  showMobileColumns?: boolean;
  showGap?: boolean;
  columnOptions?: number[];
  maxGap?: number;
}

export function GridControl({
  settings,
  onChange,
  showLayout = true,
  showColumns = true,
  showMobileColumns = true,
  showGap = true,
  columnOptions = [2, 3, 4],
  maxGap = 60,
}: GridControlProps) {
  const layout = (settings.layout as string) || 'grid';
  const columns = (settings.columns as number) || 3;
  const mobileColumns = (settings.mobileColumns as number) || 1;
  const gap = (settings.gap as number) || 24;

  return (
    <div className="space-y-1">
      {showLayout && (
        <EditorToggleGroup
          label="פריסה"
          value={layout}
          options={[
            { value: 'grid', label: 'גריד', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
            { value: 'slider', label: 'סליידר', icon: <Rows className="w-3.5 h-3.5" /> },
          ]}
          onChange={(v) => onChange('layout', v)}
        />
      )}
      
      {showColumns && (
        <EditorSelect
          label="עמודות (מחשב)"
          value={String(columns)}
          options={columnOptions.map(n => ({ value: String(n), label: String(n) }))}
          onChange={(v) => onChange('columns', parseInt(v))}
        />
      )}
      
      {showMobileColumns && (
        <EditorSelect
          label="עמודות (מובייל)"
          value={String(mobileColumns)}
          options={[
            { value: '1', label: '1' },
            { value: '2', label: '2' },
          ]}
          onChange={(v) => onChange('mobileColumns', parseInt(v))}
        />
      )}
      
      {showGap && (
        <EditorSlider
          label="רווח בין פריטים"
          value={gap}
          onChange={(v) => onChange('gap', v)}
          min={0}
          max={maxGap}
          suffix="px"
        />
      )}
    </div>
  );
}

// Columns only
interface ColumnsControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  options?: number[];
}

export function ColumnsControl({
  settings,
  onChange,
  options = [2, 3, 4],
}: ColumnsControlProps) {
  const columns = (settings.columns as number) || 3;

  return (
    <EditorSelect
      label="עמודות (מחשב)"
      value={String(columns)}
      options={options.map(n => ({ value: String(n), label: String(n) }))}
      onChange={(v) => onChange('columns', parseInt(v))}
    />
  );
}

// Max width control - simple version
interface MaxWidthControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function MaxWidthControl({
  settings,
  onChange,
}: MaxWidthControlProps) {
  const maxWidth = (settings.maxWidth as string) || 'lg';

  return (
    <EditorSelect
      label="רוחב תוכן"
      value={maxWidth}
      options={[
        { value: 'sm', label: 'קטן (640px)' },
        { value: 'md', label: 'בינוני (768px)' },
        { value: 'lg', label: 'גדול (1024px)' },
        { value: 'xl', label: 'ענק (1280px)' },
        { value: '2xl', label: 'מקסימום (1536px)' },
        { value: 'full', label: 'מלא (100%)' },
      ]}
      onChange={(v) => onChange('maxWidth', v)}
    />
  );
}

// Section Width Control - Elementor style with visual icons
interface SectionWidthControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function SectionWidthControl({
  settings,
  onChange,
}: SectionWidthControlProps) {
  const sectionWidth = (settings.sectionWidth as string) || 'boxed';
  const contentWidth = (settings.contentWidth as string) || 'lg';

  return (
    <div className="space-y-3">
      {/* Section Width - Full or Boxed */}
      <div className="py-2">
        <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">רוחב סקשן</label>
        <div className="flex gap-2">
          {/* Boxed */}
          <button
            onClick={() => onChange('sectionWidth', 'boxed')}
            className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
              sectionWidth === 'boxed'
                ? 'border-[var(--editor-accent-blue)] bg-[var(--editor-accent-blue)]/5'
                : 'border-[var(--editor-border-default)] hover:border-[var(--editor-border-hover)]'
            }`}
          >
            {/* Icon - Boxed layout */}
            <div className="w-10 h-6 flex items-center justify-center">
              <div className="w-6 h-4 border-2 border-current rounded-sm" 
                   style={{ borderColor: sectionWidth === 'boxed' ? 'var(--editor-accent-blue)' : 'var(--editor-text-muted)' }} />
            </div>
            <span className={`text-[10px] ${sectionWidth === 'boxed' ? 'text-[var(--editor-accent-blue)]' : 'text-[var(--editor-text-muted)]'}`}>
              קונטיינר
            </span>
          </button>

          {/* Full Width */}
          <button
            onClick={() => onChange('sectionWidth', 'full')}
            className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
              sectionWidth === 'full'
                ? 'border-[var(--editor-accent-blue)] bg-[var(--editor-accent-blue)]/5'
                : 'border-[var(--editor-border-default)] hover:border-[var(--editor-border-hover)]'
            }`}
          >
            {/* Icon - Full width */}
            <div className="w-10 h-6 flex items-center justify-center">
              <div className="w-10 h-4 border-2 border-current rounded-sm"
                   style={{ borderColor: sectionWidth === 'full' ? 'var(--editor-accent-blue)' : 'var(--editor-text-muted)' }} />
            </div>
            <span className={`text-[10px] ${sectionWidth === 'full' ? 'text-[var(--editor-accent-blue)]' : 'text-[var(--editor-text-muted)]'}`}>
              מלא
            </span>
          </button>
        </div>
      </div>

      {/* Content Width - only show if boxed */}
      {sectionWidth === 'boxed' && (
        <EditorSelect
          label="רוחב תוכן"
          value={contentWidth}
          options={[
            { value: 'sm', label: 'קטן (640px)' },
            { value: 'md', label: 'בינוני (768px)' },
            { value: 'lg', label: 'גדול (1024px)' },
            { value: 'xl', label: 'ענק (1280px)' },
            { value: '2xl', label: 'מקסימום (1536px)' },
          ]}
          onChange={(v) => onChange('contentWidth', v)}
        />
      )}
    </div>
  );
}

// Text alignment
interface AlignmentControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  settingKey?: string;
  label?: string;
}

export function AlignmentControl({
  settings,
  onChange,
  settingKey = 'textAlign',
  label = 'יישור טקסט',
}: AlignmentControlProps) {
  const align = (settings[settingKey] as string) || 'center';

  return (
    <EditorIconGroup
      label={label}
      value={align}
      options={[
        { 
          value: 'right', 
          title: 'ימין',
          // Icon shows lines aligned to right (RTL context)
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 5h18v2H3V5zm0 9h18v2H3v-2zm0 4h12v2H3v-2zm0-8h12v2H3V9z"/>
            </svg>
          )
        },
        { 
          value: 'center', 
          title: 'מרכז',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 5h18v2H3V5zm3 4h12v2H6V9zm-3 4h18v2H3v-2zm3 4h12v2H6v-2z"/>
            </svg>
          )
        },
        { 
          value: 'left', 
          title: 'שמאל',
          // Icon shows lines aligned to left (RTL context)
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 5h18v2H3V5zm6 4h12v2H9V9zm-6 4h18v2H3v-2zm6 4h12v2H9v-2z"/>
            </svg>
          )
        },
      ]}
      onChange={(v) => onChange(settingKey, v)}
    />
  );
}

// Vertical Alignment (for sections with min-height)
interface VerticalAlignControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function VerticalAlignControl({
  settings,
  onChange,
}: VerticalAlignControlProps) {
  const verticalAlign = (settings.verticalAlign as string) || 'center';

  return (
    <EditorIconGroup
      label="יישור אנכי"
      value={verticalAlign}
      options={[
        { 
          value: 'start', 
          title: 'למעלה',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16M12 8v12M8 12l4-4 4 4" />
            </svg>
          )
        },
        { 
          value: 'center', 
          title: 'מרכז',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12h16M12 6v12" />
            </svg>
          )
        },
        { 
          value: 'end', 
          title: 'למטה',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 20h16M12 4v12M8 12l4 4 4-4" />
            </svg>
          )
        },
      ]}
      onChange={(v) => onChange('verticalAlign', v)}
    />
  );
}

