/**
 * Section Editor - Form to edit individual section properties
 */
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import type { HomeSection } from './types';

interface SectionEditorProps {
  section: HomeSection;
  onSave: (section: HomeSection) => void;
  onClose: () => void;
  storeId?: string;
}

export function SectionEditor({ section, onSave, onClose, storeId }: SectionEditorProps) {
  const [current, setCurrent] = useState<HomeSection>(JSON.parse(JSON.stringify(section)));

  const updateData = (key: string, value: any) => {
    setCurrent({ ...current, data: { ...current.data, [key]: value } } as any);
  };

  const handleSave = () => {
    onSave(current);
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Edit Section</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.body}>
          {current.type === 'hero_banner' && (
            <HeroBannerEditor data={current.data} onChange={updateData} storeId={storeId} />
          )}
          {current.type === 'category_strip' && (
            <CategoryStripEditor data={current.data} onChange={updateData} />
          )}
          {current.type === 'featured_products' && (
            <FeaturedEditor data={current.data} onChange={updateData} />
          )}
          {current.type === 'editorial_banner' && (
            <EditorialEditor data={current.data} onChange={updateData} storeId={storeId} />
          )}
          {current.type === 'announcement' && (
            <AnnouncementEditor data={current.data} onChange={updateData} />
          )}
          {current.type === 'spacer' && (
            <SpacerEditor data={current.data} onChange={updateData} />
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSave} style={styles.saveBtn}>Save</button>
        </div>
      </div>
    </div>
  );
}

// Individual editors for each section type
function HeroBannerEditor({ data, onChange, storeId }: { data: any; onChange: (k: string, v: any) => void; storeId?: string }) {
  return (
    <div>
      <Field label="Image URL">
        <input value={data.imageUrl} onChange={(e) => onChange('imageUrl', e.target.value)} style={fieldStyles.input} />
        <ImageUploader onUpload={(url) => onChange('imageUrl', url)} storeId={storeId} />
      </Field>
      <Field label="Title">
        <input value={data.title} onChange={(e) => onChange('title', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Subtitle">
        <input value={data.subtitle} onChange={(e) => onChange('subtitle', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Button Text">
        <input value={data.buttonText} onChange={(e) => onChange('buttonText', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Link Type">
        <select value={data.linkType} onChange={(e) => onChange('linkType', e.target.value)} style={fieldStyles.select}>
          <option value="category">Category</option>
          <option value="product">Product</option>
          <option value="url">URL</option>
        </select>
      </Field>
      <Field label="Link Value (slug or URL)">
        <input value={data.linkValue} onChange={(e) => onChange('linkValue', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Text Position">
        <select value={data.textPosition} onChange={(e) => onChange('textPosition', e.target.value)} style={fieldStyles.select}>
          <option value="center">Center</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-center">Bottom Center</option>
        </select>
      </Field>
      <Field label="Height">
        <select value={data.height} onChange={(e) => onChange('height', e.target.value)} style={fieldStyles.select}>
          <option value="full">Full (85vh)</option>
          <option value="large">Large (60vh)</option>
          <option value="medium">Medium (40vh)</option>
        </select>
      </Field>
      <Field label={`Overlay Opacity: ${data.overlayOpacity}`}>
        <input type="range" min={0} max={1} step={0.05} value={data.overlayOpacity} onChange={(e) => onChange('overlayOpacity', Number(e.target.value))} style={{ width: '100%' }} />
      </Field>
      <Field label="Text Color">
        <input type="color" value={data.textColor} onChange={(e) => onChange('textColor', e.target.value)} />
      </Field>
    </div>
  );
}

function CategoryStripEditor({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  const showImages = data.style === 'image-circle' || data.style === 'image-square';

  const addCategory = () => {
    onChange('categories', [...data.categories, { name: '', slug: '', imageUrl: '' }]);
  };
  const updateCategory = (index: number, key: string, value: string) => {
    const cats = [...data.categories];
    cats[index] = { ...cats[index], [key]: value };
    onChange('categories', cats);
  };
  const removeCategory = (index: number) => {
    onChange('categories', data.categories.filter((_: any, i: number) => i !== index));
  };

  return (
    <div>
      <Field label="Style">
        <select value={data.style} onChange={(e) => onChange('style', e.target.value)} style={fieldStyles.select}>
          <option value="text">Text Only</option>
          <option value="image-circle">Image Circle</option>
          <option value="image-square">Image Square</option>
        </select>
      </Field>
      <label style={fieldStyles.label}>Categories</label>
      {data.categories.map((cat: any, i: number) => (
        <div key={i} style={{ marginBottom: 8, border: '1px solid #eee', padding: 8 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: showImages ? 4 : 0, alignItems: 'center' }}>
            <input value={cat.name} placeholder="Name" onChange={(e) => updateCategory(i, 'name', e.target.value)} style={{ ...fieldStyles.input, flex: 1 }} />
            <input value={cat.slug} placeholder="Slug" onChange={(e) => updateCategory(i, 'slug', e.target.value)} style={{ ...fieldStyles.input, flex: 1 }} />
            <button onClick={() => removeCategory(i)} style={fieldStyles.removeBtn}>×</button>
          </div>
          {showImages && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
              {cat.imageUrl && (
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: 'cover',
                    borderRadius: data.style === 'image-circle' ? 16 : 2,
                    flexShrink: 0,
                  }}
                />
              )}
              <input
                value={cat.imageUrl || ''}
                placeholder="Image URL"
                onChange={(e) => updateCategory(i, 'imageUrl', e.target.value)}
                style={{ ...fieldStyles.input, flex: 1, fontSize: 11 }}
              />
            </div>
          )}
        </div>
      ))}
      <button onClick={addCategory} style={fieldStyles.addBtn}>+ Add Category</button>
    </div>
  );
}

function FeaturedEditor({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  return (
    <div>
      <Field label="Title">
        <input value={data.title} onChange={(e) => onChange('title', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Subtitle">
        <input value={data.subtitle || ''} onChange={(e) => onChange('subtitle', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Source">
        <select value={data.source} onChange={(e) => onChange('source', e.target.value)} style={fieldStyles.select}>
          <option value="featured">Featured Products</option>
          <option value="category">By Category</option>
          <option value="new-arrivals">New Arrivals</option>
          <option value="sale">Sale</option>
        </select>
      </Field>
      {data.source === 'category' && (
        <Field label="Category Slug">
          <input value={data.categorySlug || ''} onChange={(e) => onChange('categorySlug', e.target.value)} style={fieldStyles.input} />
        </Field>
      )}
      <Field label="Limit">
        <input type="number" min={2} max={12} value={data.limit} onChange={(e) => onChange('limit', Number(e.target.value))} style={fieldStyles.input} />
      </Field>
      <Field label="Columns">
        <select value={data.columns} onChange={(e) => onChange('columns', Number(e.target.value))} style={fieldStyles.select}>
          <option value={2}>2 Columns</option>
          <option value={3}>3 Columns</option>
        </select>
      </Field>
    </div>
  );
}

function EditorialEditor({ data, onChange, storeId }: { data: any; onChange: (k: string, v: any) => void; storeId?: string }) {
  return (
    <div>
      <Field label="Image URL">
        <input value={data.imageUrl} onChange={(e) => onChange('imageUrl', e.target.value)} style={fieldStyles.input} />
        <ImageUploader onUpload={(url) => onChange('imageUrl', url)} storeId={storeId} />
      </Field>
      <Field label="Title">
        <input value={data.title} onChange={(e) => onChange('title', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Subtitle">
        <input value={data.subtitle || ''} onChange={(e) => onChange('subtitle', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Button Text">
        <input value={data.buttonText || ''} onChange={(e) => onChange('buttonText', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Link Type">
        <select value={data.linkType} onChange={(e) => onChange('linkType', e.target.value)} style={fieldStyles.select}>
          <option value="category">Category</option>
          <option value="product">Product</option>
          <option value="url">URL</option>
        </select>
      </Field>
      <Field label="Link Value">
        <input value={data.linkValue} onChange={(e) => onChange('linkValue', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Height">
        <select value={data.height} onChange={(e) => onChange('height', e.target.value)} style={fieldStyles.select}>
          <option value="large">Large</option>
          <option value="medium">Medium</option>
          <option value="small">Small</option>
        </select>
      </Field>
      <Field label={`Overlay Opacity: ${data.overlayOpacity ?? 0.3}`}>
        <input type="range" min={0} max={1} step={0.05} value={data.overlayOpacity ?? 0.3} onChange={(e) => onChange('overlayOpacity', Number(e.target.value))} style={{ width: '100%' }} />
      </Field>
      <Field label="Text Color">
        <input type="color" value={data.textColor || '#FFFFFF'} onChange={(e) => onChange('textColor', e.target.value)} />
      </Field>
    </div>
  );
}

function AnnouncementEditor({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  return (
    <div>
      <Field label="Text">
        <input value={data.text} onChange={(e) => onChange('text', e.target.value)} style={fieldStyles.input} />
      </Field>
      <Field label="Background Color">
        <input type="color" value={data.backgroundColor} onChange={(e) => onChange('backgroundColor', e.target.value)} />
      </Field>
      <Field label="Text Color">
        <input type="color" value={data.textColor} onChange={(e) => onChange('textColor', e.target.value)} />
      </Field>
    </div>
  );
}

function SpacerEditor({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  return (
    <div>
      <Field label={`Height: ${data.height}px`}>
        <input type="range" min={8} max={120} value={data.height} onChange={(e) => onChange('height', Number(e.target.value))} style={{ width: '100%' }} />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={fieldStyles.label}>{label}</label>
      {children}
    </div>
  );
}

const fieldStyles: Record<string, React.CSSProperties> = {
  label: {
    fontSize: 11,
    letterSpacing: 1,
    color: '#666',
    display: 'block',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    fontSize: 13,
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    fontSize: 13,
    backgroundColor: '#fff',
  },
  removeBtn: {
    background: 'none',
    border: '1px solid #ddd',
    padding: '2px 8px',
    cursor: 'pointer',
    fontSize: 16,
    color: '#d32f2f',
  },
  addBtn: {
    background: 'none',
    border: '1px solid #000',
    padding: '4px 12px',
    cursor: 'pointer',
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 8,
  },
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    width: 480,
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e5e5',
  },
  title: {
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  body: {
    padding: 20,
    overflowY: 'auto',
    flex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '12px 20px',
    borderTop: '1px solid #e5e5e5',
  },
  cancelBtn: {
    padding: '8px 20px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    letterSpacing: 1,
  },
  saveBtn: {
    padding: '8px 20px',
    border: 'none',
    background: '#000',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    letterSpacing: 1,
  },
};
