/**
 * Section List - Draggable list of home sections
 */
'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import type { HomeSection } from './types';
import { SECTION_TYPE_LABELS } from './types';

interface SectionListProps {
  sections: HomeSection[];
  onReorder: (sections: HomeSection[]) => void;
  onToggleVisible: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (type: HomeSection['type']) => void;
}

function SortableItem({
  section,
  onToggleVisible,
  onEdit,
  onDelete,
}: {
  section: HomeSection;
  onToggleVisible: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSectionSummary = (s: HomeSection): string => {
    switch (s.type) {
      case 'hero_banner':
        return `"${s.data.title}"`;
      case 'category_strip':
        return `${s.data.categories.length} categories`;
      case 'featured_products':
        return `"${s.data.title}"`;
      case 'editorial_banner':
        return `"${s.data.title}"`;
      case 'announcement':
        return `"${s.data.text.substring(0, 30)}..."`;
      case 'spacer':
        return `${s.data.height}px`;
      default:
        return '';
    }
  };

  return (
    <div ref={setNodeRef} style={{ ...itemStyles.container, ...style }}>
      <div {...attributes} {...listeners} style={itemStyles.dragHandle}>
        <GripVertical size={16} color="#999" />
      </div>
      <div style={itemStyles.info}>
        <span style={itemStyles.type}>
          {SECTION_TYPE_LABELS[section.type] || section.type}
        </span>
        <span style={itemStyles.summary}>{getSectionSummary(section)}</span>
      </div>
      <div style={itemStyles.actions}>
        <button onClick={onEdit} style={itemStyles.actionBtn} title="Edit">
          <Pencil size={14} />
        </button>
        <button onClick={onToggleVisible} style={itemStyles.actionBtn} title="Toggle visibility">
          {section.visible ? <Eye size={14} /> : <EyeOff size={14} color="#ccc" />}
        </button>
        <button onClick={onDelete} style={itemStyles.actionBtn} title="Delete">
          <Trash2 size={14} color="#d32f2f" />
        </button>
      </div>
    </div>
  );
}

export function SectionList({
  sections,
  onReorder,
  onToggleVisible,
  onEdit,
  onDelete,
  onAdd,
}: SectionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({
        ...s,
        order: i,
      }));
      onReorder(newSections);
    }
  };

  return (
    <div style={listStyles.container}>
      <div style={listStyles.header}>
        <h3 style={listStyles.title}>HOME SECTIONS</h3>
        <div style={listStyles.addMenu}>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onAdd(e.target.value as HomeSection['type']);
                e.target.value = '';
              }
            }}
            style={listStyles.addSelect}
            defaultValue=""
          >
            <option value="" disabled>+ Add Section</option>
            <option value="hero_banner">Hero Banner</option>
            <option value="category_strip">Category Strip</option>
            <option value="featured_products">Featured Products</option>
            <option value="editorial_banner">Editorial Banner</option>
            <option value="announcement">Announcement Bar</option>
            <option value="spacer">Spacer</option>
          </select>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <SortableItem
                key={section.id}
                section={section}
                onToggleVisible={() => onToggleVisible(section.id)}
                onEdit={() => onEdit(section.id)}
                onDelete={() => onDelete(section.id)}
              />
            ))}
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <div style={listStyles.empty}>
          <p>No sections yet. Add one to get started.</p>
        </div>
      )}
    </div>
  );
}

const listStyles: Record<string, React.CSSProperties> = {
  container: {
    borderTop: '1px solid #e5e5e5',
    paddingTop: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px 12px',
  },
  title: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  addMenu: {},
  addSelect: {
    padding: '4px 8px',
    border: '1px solid #000',
    fontSize: 11,
    letterSpacing: 1,
    cursor: 'pointer',
    backgroundColor: '#fff',
  },
  empty: {
    padding: 32,
    textAlign: 'center' as const,
    color: '#999',
    fontSize: 13,
  },
};

const itemStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#fff',
    gap: 8,
  },
  dragHandle: {
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    padding: 4,
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  type: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  summary: {
    fontSize: 11,
    color: '#999',
  },
  actions: {
    display: 'flex',
    gap: 4,
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    opacity: 0.7,
  },
};
