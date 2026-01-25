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

// Max width control
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
      label="רוחב מקסימלי"
      value={maxWidth}
      options={[
        { value: 'sm', label: 'קטן' },
        { value: 'md', label: 'בינוני' },
        { value: 'lg', label: 'גדול' },
        { value: 'xl', label: 'ענק' },
        { value: 'full', label: 'מלא' },
      ]}
      onChange={(v) => onChange('maxWidth', v)}
    />
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
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 5h18v2H3V5zm6 4h12v2H9V9zm-6 4h18v2H3v-2zm6 4h12v2H9v-2z"/>
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
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 5h18v2H3V5zm0 4h12v2H3V9zm0 4h18v2H3v-2zm0 4h12v2H3v-2z"/>
            </svg>
          )
        },
      ]}
      onChange={(v) => onChange(settingKey, v)}
    />
  );
}

