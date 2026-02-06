/**
 * Theme Editor - Color pickers + Typography settings
 */
'use client';

import { HexColorPicker } from 'react-colorful';
import { useState } from 'react';
import type { AppTheme, AppTypography } from './types';

interface ThemeEditorProps {
  theme: AppTheme;
  typography: AppTypography;
  onThemeChange: (theme: AppTheme) => void;
  onTypographyChange: (typography: AppTypography) => void;
}

const FONT_OPTIONS = [
  'System',
  'Playfair Display',
  'Cormorant Garamond',
  'Inter',
  'Helvetica Neue',
  'DM Sans',
  'Space Grotesk',
  'Montserrat',
];

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={styles.label}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            ...styles.colorSwatch,
            backgroundColor: value,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.colorInput}
        />
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export function ThemeEditor({ theme, typography, onThemeChange, onTypographyChange }: ThemeEditorProps) {
  const updateTheme = (key: keyof AppTheme, value: string) => {
    onThemeChange({ ...theme, [key]: value });
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>THEME</h3>

      <ColorField label="Primary Color" value={theme.primaryColor} onChange={(v) => updateTheme('primaryColor', v)} />
      <ColorField label="Secondary Color" value={theme.secondaryColor} onChange={(v) => updateTheme('secondaryColor', v)} />
      <ColorField label="Accent Color" value={theme.accentColor} onChange={(v) => updateTheme('accentColor', v)} />
      <ColorField label="Background" value={theme.backgroundColor} onChange={(v) => updateTheme('backgroundColor', v)} />
      <ColorField label="Surface" value={theme.surfaceColor} onChange={(v) => updateTheme('surfaceColor', v)} />
      <ColorField label="Text Primary" value={theme.textPrimary} onChange={(v) => updateTheme('textPrimary', v)} />
      <ColorField label="Text Secondary" value={theme.textSecondary} onChange={(v) => updateTheme('textSecondary', v)} />

      <div style={{ marginTop: 24 }}>
        <h3 style={styles.sectionTitle}>TYPOGRAPHY</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={styles.label}>Heading Font</label>
          <select
            value={typography.headingFont}
            onChange={(e) => onTypographyChange({ ...typography, headingFont: e.target.value })}
            style={styles.select}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={styles.label}>Body Font</label>
          <select
            value={typography.bodyFont}
            onChange={(e) => onTypographyChange({ ...typography, bodyFont: e.target.value })}
            style={styles.select}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={styles.label}>Heading Weight</label>
          <select
            value={typography.headingWeight}
            onChange={(e) => onTypographyChange({ ...typography, headingWeight: e.target.value })}
            style={styles.select}
          >
            <option value="200">200 - Ultra Light</option>
            <option value="300">300 - Light</option>
            <option value="400">400 - Regular</option>
            <option value="500">500 - Medium</option>
            <option value="600">600 - Semibold</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={styles.label}>Letter Spacing</label>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={typography.headingLetterSpacing}
            onChange={(e) =>
              onTypographyChange({ ...typography, headingLetterSpacing: Number(e.target.value) })
            }
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: 12, color: '#999' }}>{typography.headingLetterSpacing}px</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={typography.uppercaseHeadings}
            onChange={(e) =>
              onTypographyChange({ ...typography, uppercaseHeadings: e.target.checked })
            }
          />
          <label style={styles.label}>Uppercase Headings</label>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: 600,
    marginBottom: 16,
    borderBottom: '1px solid #e5e5e5',
    paddingBottom: 8,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    color: '#666',
    display: 'block',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    border: '1px solid #ddd',
    cursor: 'pointer',
    padding: 0,
  },
  colorInput: {
    border: '1px solid #ddd',
    padding: '4px 8px',
    fontSize: 12,
    fontFamily: 'monospace',
    width: 80,
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    fontSize: 13,
    backgroundColor: '#fff',
  },
};
